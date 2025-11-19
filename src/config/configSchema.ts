export type TileType =
  | 'go'
  | 'property'
  | 'tax'
  | 'chance'
  | 'community'
  | 'jail'
  | 'gotojail'
  | 'freeparking'
  | 'utility'
  | 'station';

export interface TileConfig {
  id: string;
  type: TileType;
  name: string;
  colorGroup?: string;
  position: number;
  price?: number;
  baseRent?: number;
  taxAmount?: number;
  icon?: string;
}

export type CardEffectType =
  | 'move'
  | 'pay'
  | 'receive'
  | 'go_to_jail'
  | 'get_out_of_jail_free'
  | 'per_property_fee'
  | 'per_house_hotel_fee'
  | 'move_to_go'
  | 'move_back'
  | 'move_to_nearest';

export interface CardConfig {
  id: string;
  title: string;
  description: string;
  effectType: CardEffectType;
  amount?: number;
  targetTileId?: string;
  targetTileType?: TileType;
  moveSpaces?: number;
  perHouseAmount?: number;
  perHotelAmount?: number;
}

export interface GameModeConfig {
  id: string;
  displayName: string;
  theme: {
    boardName: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    accentColor: string;
    fontFamily?: string;
    tokenStyle?: string;
  };
  currency: {
    symbol: string;
    name: string;
    startingBalance: number;
    passGoAmount: number;
  };
  board: {
    tiles: TileConfig[];
  };
  rules: {
    maxPlayers: number;
    allowAuctions: boolean;
    allowTrading: boolean;
    jailFine: number;
    housesPerPropertySet: number;
    hotelsAllowed: boolean;
    houseCostMultiplier: number;
    rentMultipliers: {
      fullSetOwned: number;
      withHouses: number[];
      withHotel: number;
    };
    maxTurns?: number;
  };
  cards: {
    chance: CardConfig[];
    community: CardConfig[];
  };
}
