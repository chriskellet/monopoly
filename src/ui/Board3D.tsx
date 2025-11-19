import { useEffect, useState, useRef } from 'react';
import { GameState } from '../game/GameState';
import { TileConfig } from '../config/configSchema';
import './Board3D.css';

interface Board3DProps {
  gameState: GameState;
}

interface AnimatedPosition {
  position: number;
  progress: number;
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
  const [animatedPositions, setAnimatedPositions] = useState<Record<string, AnimatedPosition>>({});
  const [cameraFocus, setCameraFocus] = useState<number | null>(null);
  const animationFrameRef = useRef<number>();

  // Handle movement animation
  useEffect(() => {
    if (gameState.animation.isAnimating && gameState.animation.type === 'movement') {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const startPos = gameState.animation.fromPosition!;
      const endPos = gameState.animation.toPosition!;
      const totalSteps = gameState.animation.totalSteps!;

      let currentStep = 0;
      const stepDuration = 400; // ms per step

      const animate = () => {
        if (currentStep <= totalSteps) {
          const targetPos = (startPos + currentStep) % tiles.length;
          setAnimatedPositions({
            [currentPlayer.id]: {
              position: targetPos,
              progress: 1,
            },
          });
          setCameraFocus(targetPos);
          currentStep++;
          setTimeout(animate, stepDuration);
        } else {
          setCameraFocus(null);
        }
      };

      animate();
    } else {
      setAnimatedPositions({});
      setCameraFocus(null);
    }
  }, [gameState.animation, gameState.currentPlayerIndex, gameState.players, tiles.length]);

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
    return gameState.players.filter((p) => {
      if (p.isBankrupt) return false;

      // Check if player is being animated
      const animPos = animatedPositions[p.id];
      if (animPos) {
        return animPos.position === position;
      }

      return p.position === position;
    });
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
                className="player-token-3d"
                title={player.name}
              >
                <div
                  className="token-piece"
                  style={{
                    backgroundColor: player.color,
                    borderColor: player.color,
                  }}
                >
                  <div className="token-icon">{player.token}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Calculate transform for camera focus
  const getBoardTransform = () => {
    if (cameraFocus === null) {
      return 'rotateX(25deg) rotateZ(0deg) scale(1)';
    }

    // Calculate the position of the tile to center it in viewport
    // Board is a square, tiles are on the edges
    // We need to calculate X and Y offset to center the focused tile

    let translateX = 0;
    let translateY = 0;
    let rotation = 0;

    // Bottom row (0-10): positions along bottom
    if (cameraFocus === 0) {
      translateX = 40; translateY = 40; // Bottom right corner
    } else if (cameraFocus >= 1 && cameraFocus <= 9) {
      translateX = 40 - (cameraFocus * 8.8); // Move left along bottom
      translateY = 40;
    } else if (cameraFocus === 10) {
      translateX = -40; translateY = 40; // Bottom left corner
    }
    // Left column (11-19): positions along left
    else if (cameraFocus >= 11 && cameraFocus <= 19) {
      translateX = -40;
      translateY = 40 - ((cameraFocus - 10) * 8.8); // Move up along left
      rotation = -90;
    }
    // Top row (20-30): positions along top
    else if (cameraFocus === 20) {
      translateX = -40; translateY = -40; // Top left corner
      rotation = -180;
    } else if (cameraFocus >= 21 && cameraFocus <= 29) {
      translateX = -40 + ((cameraFocus - 20) * 8.8); // Move right along top
      translateY = -40;
      rotation = -180;
    } else if (cameraFocus === 30) {
      translateX = 40; translateY = -40; // Top right corner
      rotation = -90;
    }
    // Right column (31-39): positions along right
    else if (cameraFocus >= 31 && cameraFocus <= 39) {
      translateX = 40;
      translateY = -40 + ((cameraFocus - 30) * 8.8); // Move down along right
      rotation = -90;
    }

    // Zoom in more on mobile for better visibility
    const isMobile = window.innerWidth <= 768;
    const scale = isMobile ? 2.2 : 1.8;
    const tiltAngle = isMobile ? 25 : 30; // Less tilt on mobile for better view

    return `rotateX(${tiltAngle}deg) rotateZ(${rotation}deg) scale(${scale}) translate(${translateX}%, ${translateY}%)`;
  };

  return (
    <div className="board-container">
      <div
        className={`board-3d ${cameraFocus !== null ? 'camera-focused' : ''}`}
        style={{
          transform: getBoardTransform(),
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
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
