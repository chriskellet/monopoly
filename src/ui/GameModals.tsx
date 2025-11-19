import { useState } from 'react';
import { GameState } from '../game/GameState';
import {
  rollDice,
  movePlayer,
  resolveTileLanding,
  buyProperty,
  declineProperty,
  payRent,
  payTax,
  applyCardEffect,
  endTurn,
  useGetOutOfJailCard,
  payJailFine,
  buildHouse,
  buildHotel,
} from '../game/GameEngine';
import { canBuildHouse, canBuildHotel } from '../game/Rules';
import Dice from './Dice';
import PropertyCard from './PropertyCard';
import './GameModals.css';

interface GameModalsProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

function GameModals({ gameState, setGameState }: GameModalsProps) {
  const [isRolling, setIsRolling] = useState(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const handleRollDice = async () => {
    // Start dice rolling animation
    setIsRolling(true);

    // Roll dice immediately to get the values
    let newState = rollDice(gameState);
    newState = {
      ...newState,
      animation: {
        isAnimating: true,
        type: 'dice',
      },
    };
    setGameState(newState);

    // Wait for dice animation to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRolling(false);

    // IMPORTANT: Show the dice result for 1.5 seconds before moving
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Auto-advance if not in jail or rolled to get out
    if (newState.turnPhase === 'MOVING') {
      const oldPosition = newState.players[newState.currentPlayerIndex].position;
      const steps = newState.dice!.total;

      // Start movement animation
      newState = {
        ...newState,
        animation: {
          isAnimating: true,
          type: 'movement',
          fromPosition: oldPosition,
          toPosition: (oldPosition + steps) % newState.config.board.tiles.length,
          currentStep: 0,
          totalSteps: steps,
        },
      };
      setGameState(newState);

      // Wait for movement animation (will be handled by Board3D)
      await new Promise((resolve) => setTimeout(resolve, steps * 400 + 500));

      // Complete the move
      newState = movePlayer(newState);
      newState = {
        ...newState,
        animation: {
          isAnimating: false,
          type: null,
        },
      };
      setGameState(newState);

      // Small delay before showing next modal
      await new Promise((resolve) => setTimeout(resolve, 300));
      newState = resolveTileLanding(newState);
      setGameState(newState);
    } else {
      // End animation if not moving
      newState = {
        ...newState,
        animation: {
          isAnimating: false,
          type: null,
        },
      };
      setGameState(newState);
    }
  };

  const handleBuyProperty = () => {
    if (gameState.pendingDecision?.type === 'BUY_PROPERTY') {
      const newState = buyProperty(gameState, gameState.pendingDecision.data.tileId);
      setGameState(newState);
    }
  };

  const handleDeclineProperty = () => {
    const newState = declineProperty(gameState);
    setGameState(newState);
  };

  const handlePayRent = () => {
    if (gameState.pendingDecision?.type === 'PAY_RENT') {
      const { amount, ownerId } = gameState.pendingDecision.data;
      const newState = payRent(gameState, amount, ownerId);
      setGameState(newState);
    }
  };

  const handlePayTax = () => {
    if (gameState.pendingDecision?.type === 'PAY_TAX') {
      const { amount } = gameState.pendingDecision.data;
      const newState = payTax(gameState, amount);
      setGameState(newState);
    }
  };

  const handleCardEffect = () => {
    if (gameState.pendingDecision?.type === 'DRAW_CARD') {
      const { card } = gameState.pendingDecision.data;
      const newState = applyCardEffect(gameState, card);
      setGameState(newState);
    }
  };

  const handleEndTurn = () => {
    let newState = endTurn(gameState);
    // Always reset animation when ending turn
    newState = {
      ...newState,
      animation: {
        isAnimating: false,
        type: null,
      },
    };
    setGameState(newState);
  };

  const handleUseJailCard = () => {
    const newState = useGetOutOfJailCard(gameState);
    setGameState(newState);
  };

  const handlePayJailFine = () => {
    const newState = payJailFine(gameState);
    setGameState(newState);
  };

  const handleBuildHouse = (propertyId: string) => {
    const newState = buildHouse(gameState, propertyId);
    setGameState(newState);
  };

  const handleBuildHotel = (propertyId: string) => {
    const newState = buildHotel(gameState, propertyId);
    setGameState(newState);
  };

  // Hide modals during movement animation EXCEPT for the roll modal
  if (
    gameState.animation.isAnimating &&
    gameState.animation.type === 'movement' &&
    gameState.turnPhase !== 'ROLL'
  ) {
    return null;
  }

  // Roll dice modal - show during ROLL phase OR during dice animation
  if ((gameState.turnPhase === 'ROLL' || gameState.animation.type === 'dice') && !gameState.gameOver) {
    // Always show dice (use previous roll or default values)
    const die1 = gameState.dice?.die1 || 1;
    const die2 = gameState.dice?.die2 || 1;

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Your Turn, {currentPlayer.name}!</h2>

          {gameState.dice && !isRolling && (
            <div className="dice-result-label">Your Roll:</div>
          )}
          <Dice die1={die1} die2={die2} rolling={isRolling} />

          {currentPlayer.inJail && gameState.turnPhase === 'ROLL' && (
            <div className="jail-options">
              <p>You are in jail!</p>
              {currentPlayer.getOutOfJailCards > 0 && (
                <button className="btn-primary" onClick={handleUseJailCard}>
                  Use Get Out of Jail Free Card
                </button>
              )}
              {currentPlayer.balance >= gameState.config.rules.jailFine && (
                <button className="btn-primary" onClick={handlePayJailFine}>
                  Pay {gameState.config.currency.symbol}{gameState.config.rules.jailFine} Fine
                </button>
              )}
              <button className="btn-primary" onClick={handleRollDice} disabled={isRolling}>
                {isRolling ? 'Rolling...' : 'Try to Roll Doubles'}
              </button>
            </div>
          )}

          {!currentPlayer.inJail && gameState.turnPhase === 'ROLL' && (
            <button className="btn-primary btn-large" onClick={handleRollDice} disabled={isRolling}>
              {isRolling ? 'Rolling...' : '🎲 Roll Dice'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Buy property modal
  if (gameState.pendingDecision?.type === 'BUY_PROPERTY') {
    const tile = gameState.config.board.tiles.find(
      (t) => t.id === gameState.pendingDecision?.data.tileId
    );
    const canAfford = currentPlayer.balance >= (gameState.pendingDecision.data.price || 0);

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Property Available</h2>

          {tile && (
            <PropertyCard
              tile={tile}
              currencySymbol={gameState.config.currency.symbol}
            />
          )}

          <p>Your balance: {gameState.config.currency.symbol}{currentPlayer.balance}</p>

          <div className="modal-buttons">
            <button
              className="btn-primary"
              onClick={handleBuyProperty}
              disabled={!canAfford}
            >
              {canAfford ? 'Buy Property' : 'Cannot Afford'}
            </button>
            <button className="btn-secondary" onClick={handleDeclineProperty}>
              Pass
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pay rent modal
  if (gameState.pendingDecision?.type === 'PAY_RENT') {
    const { amount, ownerName } = gameState.pendingDecision.data;
    const tile = gameState.config.board.tiles[currentPlayer.position];

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Pay Rent</h2>

          <PropertyCard
            tile={tile}
            currencySymbol={gameState.config.currency.symbol}
          />

          <p className="modal-rent">
            Rent: {gameState.config.currency.symbol}{amount}
          </p>
          <p>Pay to: <strong>{ownerName}</strong></p>

          <button className="btn-primary btn-large" onClick={handlePayRent}>
            Pay Rent
          </button>
        </div>
      </div>
    );
  }

  // Pay tax modal
  if (gameState.pendingDecision?.type === 'PAY_TAX') {
    const { amount, tileName } = gameState.pendingDecision.data;

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>{tileName}</h2>
          <p className="modal-tax">
            Tax: {gameState.config.currency.symbol}{amount}
          </p>

          <button className="btn-primary" onClick={handlePayTax}>
            Pay Tax
          </button>
        </div>
      </div>
    );
  }

  // Card modal
  if (gameState.pendingDecision?.type === 'DRAW_CARD') {
    const { card, deckType } = gameState.pendingDecision.data;

    return (
      <div className="modal-overlay">
        <div className="modal card-modal">
          <div className="card-header">
            {deckType === 'chance' ? '⭐ Fate Card' : '📜 Quest Card'}
          </div>
          <h2>{card.title}</h2>
          <p className="card-description">{card.description}</p>

          <button className="btn-primary" onClick={handleCardEffect}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  // End phase - auto advance to next player
  if (gameState.turnPhase === 'END' && !gameState.gameOver) {
    // Automatically end turn after a brief delay
    setTimeout(() => {
      handleEndTurn();
    }, 100);
    return null; // Show nothing while transitioning
  }

  // Manage phase modal
  if (gameState.turnPhase === 'MANAGE' && !gameState.gameOver) {
    const buildableProperties = currentPlayer.properties.filter((propId) =>
      canBuildHouse(currentPlayer, propId, gameState)
    );

    const hotelableProperties = currentPlayer.properties.filter((propId) =>
      canBuildHotel(currentPlayer, propId, gameState)
    );

    return (
      <div className="modal-overlay">
        <div className="modal manage-modal">
          <h2>Manage Properties</h2>

          {buildableProperties.length > 0 && (
            <div className="build-section">
              <h3>Build Houses</h3>
              <div className="property-list">
                {buildableProperties.map((propId) => {
                  const tile = gameState.config.board.tiles.find((t) => t.id === propId);
                  const cost = tile?.price
                    ? (tile.price * gameState.config.rules.houseCostMultiplier) / 100
                    : 0;
                  return (
                    <button
                      key={propId}
                      className="property-button"
                      onClick={() => handleBuildHouse(propId)}
                    >
                      {tile?.name} ({gameState.config.currency.symbol}{cost})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hotelableProperties.length > 0 && (
            <div className="build-section">
              <h3>Build Hotels</h3>
              <div className="property-list">
                {hotelableProperties.map((propId) => {
                  const tile = gameState.config.board.tiles.find((t) => t.id === propId);
                  const cost = tile?.price
                    ? (tile.price * gameState.config.rules.houseCostMultiplier) / 100
                    : 0;
                  return (
                    <button
                      key={propId}
                      className="property-button"
                      onClick={() => handleBuildHotel(propId)}
                    >
                      {tile?.name} ({gameState.config.currency.symbol}{cost})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button className="btn-primary btn-large" onClick={handleEndTurn}>
            End Turn
          </button>
        </div>
      </div>
    );
  }

  // Game over modal
  if (gameState.gameOver) {
    const winner = gameState.players.find((p) => p.id === gameState.winner);

    return (
      <div className="modal-overlay">
        <div className="modal victory-modal">
          <h1>🎉 Game Over! 🎉</h1>
          <h2>{winner?.name} Wins!</h2>
          <p className="winner-balance">
            Final Balance: {gameState.config.currency.symbol}{winner?.balance}
          </p>
          <p>Congratulations on dominating the board!</p>
        </div>
      </div>
    );
  }

  return null;
}

export default GameModals;
