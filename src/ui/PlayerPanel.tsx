import { GameState } from '../game/GameState';
import './PlayerPanel.css';

interface PlayerPanelProps {
  gameState: GameState;
}

function PlayerPanel({ gameState }: PlayerPanelProps) {
  return (
    <div className="player-panel">
      <h3 className="panel-title">Players</h3>
      <div className="player-list">
        {gameState.players.map((player, index) => {
          const isActive = index === gameState.currentPlayerIndex;
          const propertyCount = player.properties.length;
          const houseCount = Object.values(player.houses).reduce((a, b) => a + b, 0);
          const hotelCount = Object.values(player.hotels).reduce((a, b) => a + b, 0);

          return (
            <div
              key={player.id}
              className={`player-card ${isActive ? 'active' : ''} ${player.isBankrupt ? 'bankrupt' : ''}`}
            >
              <div className="player-header">
                <div
                  className="player-color"
                  style={{ backgroundColor: player.color }}
                />
                <div className="player-details">
                  <div className="player-name">
                    {player.name}
                    {isActive && <span className="active-badge">•</span>}
                  </div>
                  <div className="player-balance">
                    {gameState.config.currency.symbol}{player.balance}
                  </div>
                </div>
              </div>

              {!player.isBankrupt && (
                <div className="player-stats">
                  <div className="stat">
                    <span className="stat-icon">🏠</span>
                    <span className="stat-value">{propertyCount}</span>
                  </div>
                  {houseCount > 0 && (
                    <div className="stat">
                      <span className="stat-icon">🏘️</span>
                      <span className="stat-value">{houseCount}</span>
                    </div>
                  )}
                  {hotelCount > 0 && (
                    <div className="stat">
                      <span className="stat-icon">🏨</span>
                      <span className="stat-value">{hotelCount}</span>
                    </div>
                  )}
                  {player.inJail && (
                    <div className="stat jail">
                      <span className="stat-icon">⛓️</span>
                      <span className="stat-value">{player.jailTurnsRemaining}</span>
                    </div>
                  )}
                  {player.getOutOfJailCards > 0 && (
                    <div className="stat">
                      <span className="stat-icon">🎫</span>
                      <span className="stat-value">{player.getOutOfJailCards}</span>
                    </div>
                  )}
                </div>
              )}

              {player.isBankrupt && (
                <div className="bankrupt-badge">BANKRUPT</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="event-log">
        <h4 className="log-title">Event Log</h4>
        <div className="log-content">
          {gameState.events.slice(-8).reverse().map((event, index) => (
            <div key={index} className={`log-entry ${event.type}`}>
              <span className="log-message">{event.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlayerPanel;
