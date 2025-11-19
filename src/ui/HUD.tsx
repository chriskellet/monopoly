import { GameState } from '../game/GameState';
import './HUD.css';

interface HUDProps {
  gameState: GameState;
  onQuit: () => void;
}

function HUD({ gameState, onQuit }: HUDProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const getPhaseDescription = (): string => {
    if (gameState.gameOver) {
      const winner = gameState.players.find((p) => p.id === gameState.winner);
      return `🎉 ${winner?.name} wins!`;
    }

    if (gameState.pendingDecision) {
      switch (gameState.pendingDecision.type) {
        case 'BUY_PROPERTY':
          return 'Decide whether to buy this property';
        case 'PAY_RENT':
          return 'Pay rent to property owner';
        case 'DRAW_CARD':
          return 'Drew a card - click to see effect';
        case 'PAY_TAX':
          return 'Pay taxes';
        default:
          return 'Make a decision';
      }
    }

    switch (gameState.turnPhase) {
      case 'ROLL':
        if (currentPlayer.inJail) {
          return `Roll doubles to escape jail (${currentPlayer.jailTurnsRemaining} turns remaining)`;
        }
        return 'Roll the dice to start your turn';
      case 'MOVING':
        return 'Moving to new position...';
      case 'RESOLVING_TILE':
        return 'Resolving tile effects...';
      case 'MANAGE':
        return 'Buy houses or end your turn';
      case 'END':
        return 'Turn complete';
      default:
        return '';
    }
  };

  return (
    <div className="hud">
      <div className="hud-left">
        <div className="game-title-small">{gameState.config.theme.boardName}</div>
        <div className="turn-info">Turn {gameState.turnNumber}</div>
      </div>

      <div className="hud-center">
        <div className="current-player-info">
          <div
            className="player-indicator"
            style={{ backgroundColor: currentPlayer.color }}
          />
          <div>
            <div className="current-player-name">{currentPlayer.name}</div>
            <div className="current-player-balance">
              {gameState.config.currency.symbol}{currentPlayer.balance}
            </div>
          </div>
        </div>
        <div className="phase-description">{getPhaseDescription()}</div>
      </div>

      <div className="hud-right">
        <button className="quit-button" onClick={onQuit}>
          Menu
        </button>
      </div>
    </div>
  );
}

export default HUD;
