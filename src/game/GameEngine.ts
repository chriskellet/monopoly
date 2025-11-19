import {
  GameState,
  Player,
  DiceRoll,
  GameEvent,
  PendingDecision,
} from './GameState';
import { GameModeConfig, CardConfig, TileConfig } from '../config/configSchema';
import { calculateRent, countHousesAndHotels } from './Rules';

const PLAYER_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
];

const PLAYER_TOKENS = [
  '🚗', // Car
  '🎩', // Top Hat
  '🐕', // Dog
  '⛵', // Ship
  '🎸', // Guitar
  '⭐', // Star
];

export function createInitialGameState(
  config: GameModeConfig,
  playerNames: string[]
): GameState {
  const players: Player[] = playerNames.map((name, index) => ({
    id: `player-${index}`,
    name,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    token: PLAYER_TOKENS[index % PLAYER_TOKENS.length],
    balance: config.currency.startingBalance,
    position: 0,
    properties: [],
    inJail: false,
    jailTurnsRemaining: 0,
    getOutOfJailCards: 0,
    isBankrupt: false,
    houses: {},
    hotels: {},
  }));

  return {
    config,
    players,
    currentPlayerIndex: 0,
    turnPhase: 'ROLL',
    dice: null,
    consecutiveDoubles: 0,
    events: [
      {
        timestamp: Date.now(),
        message: 'Game started! Good luck!',
        type: 'info',
      },
    ],
    propertyOwnership: {},
    chanceDeck: shuffleDeck([...config.cards.chance]),
    communityDeck: shuffleDeck([...config.cards.community]),
    gameOver: false,
    winner: null,
    turnNumber: 1,
    pendingDecision: null,
    animation: {
      isAnimating: false,
      type: null,
    },
  };
}

function shuffleDeck(deck: CardConfig[]): CardConfig[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function rollDice(state: GameState): GameState {
  if (state.turnPhase !== 'ROLL') return state;

  const currentPlayer = state.players[state.currentPlayerIndex];

  // Handle jail
  if (currentPlayer.inJail) {
    return handleJailRoll(state);
  }

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;
  const isDouble = die1 === die2;

  const dice: DiceRoll = { die1, die2, total, isDouble };

  const newState: GameState = {
    ...state,
    dice,
    turnPhase: 'MOVING',
    events: [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} rolled ${die1} + ${die2} = ${total}${isDouble ? ' (doubles!)' : ''}`,
        playerId: currentPlayer.id,
        type: 'info',
      },
    ],
  };

  // Handle doubles
  if (isDouble) {
    newState.consecutiveDoubles = state.consecutiveDoubles + 1;

    if (newState.consecutiveDoubles >= 3) {
      return sendToJail(newState, 'Rolled 3 doubles in a row!');
    }
  } else {
    newState.consecutiveDoubles = 0;
  }

  return newState;
}

function handleJailRoll(state: GameState): GameState {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;
  const isDouble = die1 === die2;

  const dice: DiceRoll = { die1, die2, total, isDouble };
  const currentPlayer = state.players[state.currentPlayerIndex];

  let newState: GameState = { ...state, dice };

  if (isDouble) {
    // Released from jail!
    newState.players = state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? { ...p, inJail: false, jailTurnsRemaining: 0 }
        : p
    );
    newState.turnPhase = 'MOVING';
    newState.events = [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} rolled doubles and is released from jail!`,
        playerId: currentPlayer.id,
        type: 'success',
      },
    ];
  } else {
    newState.players = state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? { ...p, jailTurnsRemaining: p.jailTurnsRemaining - 1 }
        : p
    );

    if (currentPlayer.jailTurnsRemaining <= 1) {
      // Must pay fine
      newState = payJailFine(newState);
      newState.turnPhase = 'MOVING';
    } else {
      newState.turnPhase = 'END';
      newState.events = [
        ...newState.events,
        {
          timestamp: Date.now(),
          message: `${currentPlayer.name} failed to roll doubles. ${currentPlayer.jailTurnsRemaining - 1} turns remaining in jail.`,
          playerId: currentPlayer.id,
          type: 'warning',
        },
      ];
    }
  }

  return newState;
}

export function movePlayer(state: GameState): GameState {
  if (state.turnPhase !== 'MOVING' || !state.dice) return state;

  const currentPlayer = state.players[state.currentPlayerIndex];
  const oldPosition = currentPlayer.position;
  const newPosition = (oldPosition + state.dice.total) % state.config.board.tiles.length;

  let newState = { ...state };

  // Check if passed GO
  if (newPosition < oldPosition) {
    newState.players = state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? { ...p, balance: p.balance + state.config.currency.passGoAmount }
        : p
    );
    newState.events = [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} passed GO! Collected ${state.config.currency.symbol}${state.config.currency.passGoAmount}`,
        playerId: currentPlayer.id,
        type: 'success',
      },
    ];
  }

  newState.players = newState.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, position: newPosition } : p
  );

  newState.turnPhase = 'RESOLVING_TILE';

  return newState;
}

export function resolveTileLanding(state: GameState): GameState {
  if (state.turnPhase !== 'RESOLVING_TILE') return state;

  const currentPlayer = state.players[state.currentPlayerIndex];
  const tile = state.config.board.tiles[currentPlayer.position];

  switch (tile.type) {
    case 'go':
      return advanceToManage(state);

    case 'property':
    case 'utility':
    case 'station':
      return handlePropertyLanding(state, tile);

    case 'tax':
      return handleTax(state, tile);

    case 'chance':
      return handleChanceCard(state);

    case 'community':
      return handleCommunityCard(state);

    case 'jail':
      return advanceToManage(state);

    case 'gotojail':
      return sendToJail(state, 'Landed on Go To Jail!');

    case 'freeparking':
      return advanceToManage(state);

    default:
      return advanceToManage(state);
  }
}

function handlePropertyLanding(state: GameState, tile: TileConfig): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const owner = state.propertyOwnership[tile.id];

  if (!owner) {
    // Property is unowned - offer to buy
    return {
      ...state,
      pendingDecision: {
        type: 'BUY_PROPERTY',
        data: { tileId: tile.id, price: tile.price },
        playerId: currentPlayer.id,
      },
    };
  } else if (owner !== currentPlayer.id) {
    // Pay rent
    const ownerPlayer = state.players.find((p) => p.id === owner);
    if (ownerPlayer && !ownerPlayer.isBankrupt) {
      const rent = calculateRent(tile, ownerPlayer, state);
      return {
        ...state,
        pendingDecision: {
          type: 'PAY_RENT',
          data: { amount: rent, ownerId: owner, ownerName: ownerPlayer.name },
          playerId: currentPlayer.id,
        },
      };
    }
  }

  return advanceToManage(state);
}

function handleTax(state: GameState, tile: TileConfig): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const taxAmount = tile.taxAmount || 0;

  return {
    ...state,
    pendingDecision: {
      type: 'PAY_TAX',
      data: { amount: taxAmount, tileName: tile.name },
      playerId: currentPlayer.id,
    },
  };
}

function handleChanceCard(state: GameState): GameState {
  const card = state.chanceDeck[0];
  const newDeck = [...state.chanceDeck.slice(1), card];

  return {
    ...state,
    chanceDeck: newDeck,
    pendingDecision: {
      type: 'DRAW_CARD',
      data: { card, deckType: 'chance' },
      playerId: state.players[state.currentPlayerIndex].id,
    },
  };
}

function handleCommunityCard(state: GameState): GameState {
  const card = state.communityDeck[0];
  const newDeck = [...state.communityDeck.slice(1), card];

  return {
    ...state,
    communityDeck: newDeck,
    pendingDecision: {
      type: 'DRAW_CARD',
      data: { card, deckType: 'community' },
      playerId: state.players[state.currentPlayerIndex].id,
    },
  };
}

export function buyProperty(state: GameState, tileId: string): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const tile = state.config.board.tiles.find((t) => t.id === tileId);

  if (!tile || !tile.price || currentPlayer.balance < tile.price) {
    return state;
  }

  const price = tile.price; // Store price to avoid type issues

  const newState: GameState = {
    ...state,
    players: state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? {
            ...p,
            balance: p.balance - price,
            properties: [...p.properties, tileId],
          }
        : p
    ),
    propertyOwnership: {
      ...state.propertyOwnership,
      [tileId]: currentPlayer.id,
    },
    pendingDecision: null,
    events: [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} bought ${tile.name} for ${state.config.currency.symbol}${tile.price}`,
        playerId: currentPlayer.id,
        type: 'success',
      },
    ],
  };

  return advanceToManage(newState);
}

export function declineProperty(state: GameState): GameState {
  const newState = {
    ...state,
    pendingDecision: null,
  };
  return advanceToManage(newState);
}

export function payRent(state: GameState, amount: number, ownerId: string): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const owner = state.players.find((p) => p.id === ownerId);

  if (!owner) return state;

  let newState: GameState = {
    ...state,
    players: state.players.map((p) => {
      if (p.id === currentPlayer.id) {
        return { ...p, balance: p.balance - amount };
      }
      if (p.id === ownerId) {
        return { ...p, balance: p.balance + amount };
      }
      return p;
    }),
    pendingDecision: null,
    events: [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} paid ${state.config.currency.symbol}${amount} rent to ${owner.name}`,
        playerId: currentPlayer.id,
        type: 'warning',
      },
    ],
  };

  newState = checkBankruptcy(newState);
  return advanceToManage(newState);
}

export function payTax(state: GameState, amount: number): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];

  let newState: GameState = {
    ...state,
    players: state.players.map((p, i) =>
      i === state.currentPlayerIndex ? { ...p, balance: p.balance - amount } : p
    ),
    pendingDecision: null,
    events: [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} paid ${state.config.currency.symbol}${amount} in taxes`,
        playerId: currentPlayer.id,
        type: 'warning',
      },
    ],
  };

  newState = checkBankruptcy(newState);
  return advanceToManage(newState);
}

export function applyCardEffect(state: GameState, card: CardConfig): GameState {
  let newState: GameState = { ...state, pendingDecision: null };
  const currentPlayer = state.players[state.currentPlayerIndex];

  switch (card.effectType) {
    case 'receive':
      newState.players = state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, balance: p.balance + (card.amount || 0) }
          : p
      );
      newState.events = [
        ...state.events,
        {
          timestamp: Date.now(),
          message: `${currentPlayer.name} received ${state.config.currency.symbol}${card.amount}`,
          playerId: currentPlayer.id,
          type: 'success',
        },
      ];
      break;

    case 'pay':
      newState.players = state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, balance: p.balance - (card.amount || 0) }
          : p
      );
      newState.events = [
        ...state.events,
        {
          timestamp: Date.now(),
          message: `${currentPlayer.name} paid ${state.config.currency.symbol}${card.amount}`,
          playerId: currentPlayer.id,
          type: 'warning',
        },
      ];
      newState = checkBankruptcy(newState);
      break;

    case 'move_to_go':
      newState.players = state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, position: 0, balance: p.balance + (card.amount || 0) }
          : p
      );
      newState.events = [
        ...state.events,
        {
          timestamp: Date.now(),
          message: `${currentPlayer.name} advanced to GO!`,
          playerId: currentPlayer.id,
          type: 'success',
        },
      ];
      break;

    case 'go_to_jail':
      return sendToJail(newState, 'Card sent to jail!');

    case 'get_out_of_jail_free':
      newState.players = state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, getOutOfJailCards: p.getOutOfJailCards + 1 }
          : p
      );
      newState.events = [
        ...state.events,
        {
          timestamp: Date.now(),
          message: `${currentPlayer.name} received a Get Out of Jail Free card!`,
          playerId: currentPlayer.id,
          type: 'success',
        },
      ];
      break;

    case 'move_back':
      const moveSpaces = card.moveSpaces || 0;
      newState.players = state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? {
              ...p,
              position: Math.max(0, p.position - moveSpaces),
            }
          : p
      );
      newState.turnPhase = 'RESOLVING_TILE';
      return newState;

    case 'move':
      if (card.targetTileId) {
        const targetTile = state.config.board.tiles.find(
          (t) => t.id === card.targetTileId
        );
        if (targetTile) {
          const oldPos = currentPlayer.position;
          const newPos = targetTile.position;

          newState.players = state.players.map((p, i) => {
            if (i === state.currentPlayerIndex) {
              let balance = p.balance;
              // Check if passed GO
              if (newPos < oldPos) {
                balance += state.config.currency.passGoAmount;
              }
              return { ...p, position: newPos, balance };
            }
            return p;
          });

          newState.turnPhase = 'RESOLVING_TILE';
          return newState;
        }
      }
      break;

    case 'per_property_fee':
      const amountPerPlayer = card.amount || 0;
      const totalFromOthers =
        amountPerPlayer * (state.players.filter((p) => !p.isBankrupt).length - 1);

      newState.players = state.players.map((p, i) => {
        if (i === state.currentPlayerIndex) {
          return { ...p, balance: p.balance - totalFromOthers };
        } else if (!p.isBankrupt) {
          return { ...p, balance: p.balance + amountPerPlayer };
        }
        return p;
      });
      newState = checkBankruptcy(newState);
      break;

    case 'per_house_hotel_fee':
      const { houses, hotels } = countHousesAndHotels(currentPlayer);
      const houseFee = (card.perHouseAmount || 0) * houses;
      const hotelFee = (card.perHotelAmount || 0) * hotels;
      const totalFee = houseFee + hotelFee;

      newState.players = state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, balance: p.balance - totalFee }
          : p
      );
      newState.events = [
        ...state.events,
        {
          timestamp: Date.now(),
          message: `${currentPlayer.name} paid ${state.config.currency.symbol}${totalFee} for repairs`,
          playerId: currentPlayer.id,
          type: 'warning',
        },
      ];
      newState = checkBankruptcy(newState);
      break;
  }

  return advanceToManage(newState);
}

function sendToJail(state: GameState, reason: string): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const jailTile = state.config.board.tiles.find((t) => t.type === 'jail');
  const jailPosition = jailTile ? jailTile.position : 10;

  return {
    ...state,
    players: state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? {
            ...p,
            position: jailPosition,
            inJail: true,
            jailTurnsRemaining: 3,
          }
        : p
    ),
    consecutiveDoubles: 0,
    turnPhase: 'END',
    pendingDecision: null,
    events: [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} sent to jail! ${reason}`,
        playerId: currentPlayer.id,
        type: 'error',
      },
    ],
  };
}

export function useGetOutOfJailCard(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];

  if (currentPlayer.getOutOfJailCards <= 0) return state;

  return {
    ...state,
    players: state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? {
            ...p,
            inJail: false,
            jailTurnsRemaining: 0,
            getOutOfJailCards: p.getOutOfJailCards - 1,
          }
        : p
    ),
    events: [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} used a Get Out of Jail Free card!`,
        playerId: currentPlayer.id,
        type: 'success',
      },
    ],
  };
}

export function payJailFine(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const jailFine = state.config.rules.jailFine;

  if (currentPlayer.balance < jailFine) {
    return state;
  }

  return {
    ...state,
    players: state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? {
            ...p,
            balance: p.balance - jailFine,
            inJail: false,
            jailTurnsRemaining: 0,
          }
        : p
    ),
    events: [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} paid ${state.config.currency.symbol}${jailFine} to get out of jail`,
        playerId: currentPlayer.id,
        type: 'info',
      },
    ],
  };
}

function advanceToManage(state: GameState): GameState {
  return {
    ...state,
    turnPhase: 'MANAGE',
    pendingDecision: null,
  };
}

export function endTurn(state: GameState): GameState {
  let newState = { ...state };

  // If rolled doubles and not in jail, can roll again
  if (
    state.dice?.isDouble &&
    state.consecutiveDoubles < 3 &&
    !state.players[state.currentPlayerIndex].inJail
  ) {
    newState.turnPhase = 'ROLL';
    newState.events = [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${state.players[state.currentPlayerIndex].name} rolled doubles! Roll again.`,
        type: 'info',
      },
    ];
    return newState;
  }

  // Move to next player
  let nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

  // Skip bankrupt players
  while (state.players[nextPlayerIndex].isBankrupt) {
    nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
  }

  newState.currentPlayerIndex = nextPlayerIndex;
  newState.turnPhase = 'ROLL';
  newState.dice = null;
  newState.consecutiveDoubles = 0;

  // Increment turn number when we've cycled through all players
  if (nextPlayerIndex === 0 || nextPlayerIndex < state.currentPlayerIndex) {
    newState.turnNumber = state.turnNumber + 1;
  }

  newState.events = [
    ...newState.events,
    {
      timestamp: Date.now(),
      message: `${state.players[nextPlayerIndex].name}'s turn`,
      playerId: state.players[nextPlayerIndex].id,
      type: 'info',
    },
  ];

  return checkWinCondition(newState);
}

export function checkBankruptcy(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];

  if (currentPlayer.balance < 0) {
    return {
      ...state,
      players: state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, isBankrupt: true, balance: 0 }
          : p
      ),
      propertyOwnership: Object.fromEntries(
        Object.entries(state.propertyOwnership).filter(
          ([_, ownerId]) => ownerId !== currentPlayer.id
        )
      ),
      events: [
        ...state.events,
        {
          timestamp: Date.now(),
          message: `${currentPlayer.name} is bankrupt!`,
          playerId: currentPlayer.id,
          type: 'error',
        },
      ],
    };
  }

  return state;
}

export function checkWinCondition(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => !p.isBankrupt);

  if (activePlayers.length === 1) {
    return {
      ...state,
      gameOver: true,
      winner: activePlayers[0].id,
      events: [
        ...state.events,
        {
          timestamp: Date.now(),
          message: `${activePlayers[0].name} wins the game!`,
          playerId: activePlayers[0].id,
          type: 'success',
        },
      ],
    };
  }

  // Check max turns
  if (
    state.config.rules.maxTurns &&
    state.turnNumber >= state.config.rules.maxTurns
  ) {
    const richestPlayer = [...state.players].sort(
      (a, b) => b.balance - a.balance
    )[0];
    return {
      ...state,
      gameOver: true,
      winner: richestPlayer.id,
      events: [
        ...state.events,
        {
          timestamp: Date.now(),
          message: `Game ended after ${state.turnNumber} turns. ${richestPlayer.name} wins with ${state.config.currency.symbol}${richestPlayer.balance}!`,
          playerId: richestPlayer.id,
          type: 'success',
        },
      ],
    };
  }

  return state;
}

export function buildHouse(state: GameState, propertyId: string): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const property = state.config.board.tiles.find((t) => t.id === propertyId);

  if (!property || !property.price) return state;

  const cost = Math.floor(
    (property.price * state.config.rules.houseCostMultiplier) / 100
  );

  if (currentPlayer.balance < cost) return state;

  return {
    ...state,
    players: state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? {
            ...p,
            balance: p.balance - cost,
            houses: {
              ...p.houses,
              [propertyId]: (p.houses[propertyId] || 0) + 1,
            },
          }
        : p
    ),
    events: [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} built a house on ${property.name}`,
        playerId: currentPlayer.id,
        type: 'success',
      },
    ],
  };
}

export function buildHotel(state: GameState, propertyId: string): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const property = state.config.board.tiles.find((t) => t.id === propertyId);

  if (!property || !property.price) return state;

  const cost = Math.floor(
    (property.price * state.config.rules.houseCostMultiplier) / 100
  );

  if (currentPlayer.balance < cost) return state;

  return {
    ...state,
    players: state.players.map((p, i) =>
      i === state.currentPlayerIndex
        ? {
            ...p,
            balance: p.balance - cost,
            houses: {
              ...p.houses,
              [propertyId]: 0,
            },
            hotels: {
              ...p.hotels,
              [propertyId]: 1,
            },
          }
        : p
    ),
    events: [
      ...state.events,
      {
        timestamp: Date.now(),
        message: `${currentPlayer.name} built a hotel on ${property.name}`,
        playerId: currentPlayer.id,
        type: 'success',
      },
    ],
  };
}
