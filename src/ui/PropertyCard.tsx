import { TileConfig } from '../config/configSchema';
import './PropertyCard.css';

interface PropertyCardProps {
  tile: TileConfig;
  currencySymbol: string;
  colorGroup?: string;
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

function PropertyCard({ tile, currencySymbol }: PropertyCardProps) {
  const getTileColor = (): string => {
    if (tile.colorGroup) {
      return COLOR_GROUPS[tile.colorGroup] || '#999';
    }
    return '#333';
  };

  const isProperty = tile.type === 'property';
  const isStation = tile.type === 'station';
  const isUtility = tile.type === 'utility';

  return (
    <div className="property-card">
      {isProperty && (
        <div
          className="property-card-color-bar"
          style={{ backgroundColor: getTileColor() }}
        />
      )}

      <div className="property-card-content">
        <h3 className="property-card-title">{tile.name}</h3>

        {(isProperty || isStation || isUtility) && (
          <>
            {tile.price && (
              <div className="property-card-section">
                <div className="property-card-label">Price</div>
                <div className="property-card-value property-card-price">
                  {currencySymbol}{tile.price}
                </div>
              </div>
            )}

            {tile.baseRent && (
              <div className="property-card-section">
                <div className="property-card-label">Base Rent</div>
                <div className="property-card-value">
                  {currencySymbol}{tile.baseRent}
                </div>
              </div>
            )}
          </>
        )}

        {isStation && (
          <div className="property-card-icon-large">
            {tile.icon || '🚂'}
          </div>
        )}

        {isUtility && (
          <div className="property-card-icon-large">
            {tile.icon || '⚡'}
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyCard;
