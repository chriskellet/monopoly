import { GameState } from '../game/GameState';
import { TileConfig } from '../config/configSchema';
import './Board3D.css';

interface Board3DProps {
  gameState: GameState;
}

const COLOR_GROUPS: Record<string, string> = {
  brown: '#8B4513',
  lightblue: '#87CEEB',
  pink: '#FF69B4',
  orange: '#FFA500',
  red: '#DC143C',
  yellow: '#FFD700',
  green: '#228B22',
  darkblue: '#00008B',
  swamp: '#4a5c3a',
  forest: '#2d5016',
  mountain: '#8b7355',
  coast: '#4682b4',
  magic: '#9370db',
  holy: '#ffd700',
  royal: '#8b0000',
  legendary: '#4b0082',
  residential: '#a0a0a0',
  business: '#4169e1',
  cultural: '#daa520',
  shopping: '#ff1493',
  downtown: '#2f4f4f',
  waterfront: '#1e90ff',
  premium: '#8b4789',
  luxury: '#ffd700',
};

function Board3D({ gameState }: Board3DProps) {
  const tiles = gameState.config.board.tiles;

  const getTileColor = (tile: TileConfig): string => {
    if (tile.colorGroup) {
      return COLOR_GROUPS[tile.colorGroup] || '#999';
    }
    return 'transparent';
  };

  const getOwnerColor = (tileId: string): string | null => {
    const ownerId = gameState.propertyOwnership[tileId];
    if (ownerId) {
      const owner = gameState.players.find((p) => p.id === ownerId);
      return owner?.color || null;
    }
    return null;
  };

  const getPlayersAtPosition = (position: number) => {
    return gameState.players.filter((p) => p.position === position && !p.isBankrupt);
  };

  const getHouseCount = (tileId: string): number => {
    const ownerId = gameState.propertyOwnership[tileId];
    if (ownerId) {
      const owner = gameState.players.find((p) => p.id === ownerId);
      return owner?.houses[tileId] || 0;
    }
    return 0;
  };

  const getHotelCount = (tileId: string): number => {
    const ownerId = gameState.propertyOwnership[tileId];
    if (ownerId) {
      const owner = gameState.players.find((p) => p.id === ownerId);
      return owner?.hotels[tileId] || 0;
    }
    return 0;
  };

  const renderTile = (tile: TileConfig, index: number) => {
    const ownerColor = getOwnerColor(tile.id);
    const players = getPlayersAtPosition(tile.position);
    const houses = getHouseCount(tile.id);
    const hotels = getHotelCount(tile.id);
    const tileColor = getTileColor(tile);

    return (
      <div
        key={tile.id}
        className={`board-tile tile-${index} ${tile.type}`}
        data-position={tile.position}
      >
        {tile.colorGroup && (
          <div className="color-bar" style={{ backgroundColor: tileColor }} />
        )}

        <div className="tile-content">
          {tile.icon && <div className="tile-icon">{tile.icon}</div>}
          <div className="tile-name">{tile.name}</div>
          {tile.price && (
            <div className="tile-price">
              {gameState.config.currency.symbol}{tile.price}
            </div>
          )}
          {tile.taxAmount && (
            <div className="tile-tax">
              Pay {gameState.config.currency.symbol}{tile.taxAmount}
            </div>
          )}
        </div>

        {ownerColor && (
          <div className="ownership-indicator" style={{ backgroundColor: ownerColor }} />
        )}

        {houses > 0 && (
          <div className="buildings">
            {Array.from({ length: houses }).map((_, i) => (
              <div key={i} className="house">🏠</div>
            ))}
          </div>
        )}

        {hotels > 0 && (
          <div className="buildings">
            <div className="hotel">🏨</div>
          </div>
        )}

        {players.length > 0 && (
          <div className="player-tokens">
            {players.map((player) => (
              <div
                key={player.id}
                className="player-token"
                style={{ backgroundColor: player.color }}
                title={player.name}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="board-container">
      <div className="board-3d">
        <div className="board-surface">
          {tiles.map((tile, index) => renderTile(tile, index))}

          <div className="board-center">
            <h2 className="board-title">{gameState.config.theme.boardName}</h2>
            <div className="board-info">
              <div>Turn {gameState.turnNumber}</div>
              <div>
                {gameState.players[gameState.currentPlayerIndex].name}'s Turn
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Board3D;
