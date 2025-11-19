import { GameModeConfig, CardConfig } from '../config/configSchema';

export type TurnPhase = 'ROLL' | 'MOVING' | 'RESOLVING_TILE' | 'MANAGE' | 'END';

export interface Player {
  id: string;
  name: string;
  color: string;
  token: string; // Token icon/shape identifier
  balance: number;
  position: number;
  properties: string[];
  inJail: boolean;
  jailTurnsRemaining: number;
  getOutOfJailCards: number;
  isBankrupt: boolean;
  houses: Record<string, number>;
  hotels: Record<string, number>;
}

export interface DiceRoll {
  die1: number;
  die2: number;
  total: number;
  isDouble: boolean;
}

export interface GameEvent {
  timestamp: number;
  message: string;
  playerId?: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface PropertyOwnership {
  [tileId: string]: string;
}

export interface AnimationState {
  isAnimating: boolean;
  type: 'dice' | 'movement' | null;
  fromPosition?: number;
  toPosition?: number;
  currentStep?: number;
  totalSteps?: number;
}

export interface GameState {
  config: GameModeConfig;
  players: Player[];
  currentPlayerIndex: number;
  turnPhase: TurnPhase;
  dice: DiceRoll | null;
  consecutiveDoubles: number;
  events: GameEvent[];
  propertyOwnership: PropertyOwnership;
  chanceDeck: CardConfig[];
  communityDeck: CardConfig[];
  gameOver: boolean;
  winner: string | null;
  turnNumber: number;
  pendingDecision: PendingDecision | null;
  animation: AnimationState;
}

export type DecisionType =
  | 'BUY_PROPERTY'
  | 'PAY_RENT'
  | 'DRAW_CARD'
  | 'PAY_TAX'
  | 'JAIL_CHOICE'
  | 'BUILD_HOUSE'
  | 'CARD_EFFECT';

export interface PendingDecision {
  type: DecisionType;
  data: any;
  playerId: string;
}
