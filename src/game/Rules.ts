import { GameState, Player } from './GameState';
import { GameModeConfig, TileConfig } from '../config/configSchema';

export function calculateRent(
  property: TileConfig,
  owner: Player,
  state: GameState
): number {
  const config = state.config;

  if (!property.baseRent) return 0;

  // For utilities and stations, special rules apply
  if (property.type === 'utility') {
    const utilitiesOwned = countUtilitiesOwned(owner, state);
    const multiplier = utilitiesOwned === 1 ? 4 : 10;
    return (state.dice?.total || 0) * multiplier;
  }

  if (property.type === 'station') {
    const stationsOwned = countStationsOwned(owner, state);
    return property.baseRent * Math.pow(2, stationsOwned - 1);
  }

  // For regular properties
  const houses = owner.houses[property.id] || 0;
  const hasHotel = owner.hotels[property.id] || 0;

  if (hasHotel > 0) {
    return property.baseRent * config.rules.rentMultipliers.withHotel;
  }

  if (houses > 0) {
    const multiplier = config.rules.rentMultipliers.withHouses[houses - 1] || 1;
    return property.baseRent * multiplier;
  }

  // Check if owner has full color set
  if (ownsFullColorSet(owner, property, state)) {
    return property.baseRent * config.rules.rentMultipliers.fullSetOwned;
  }

  return property.baseRent;
}

export function ownsFullColorSet(
  player: Player,
  property: TileConfig,
  state: GameState
): boolean {
  if (!property.colorGroup) return false;

  const propertiesInGroup = state.config.board.tiles.filter(
    (t) => t.colorGroup === property.colorGroup && t.type === 'property'
  );

  return propertiesInGroup.every((p) => player.properties.includes(p.id));
}

export function canBuildHouse(
  player: Player,
  propertyId: string,
  state: GameState
): boolean {
  const property = state.config.board.tiles.find((t) => t.id === propertyId);
  if (!property || property.type !== 'property') return false;

  // Must own full color set
  if (!ownsFullColorSet(player, property, state)) return false;

  // Check if we haven't exceeded max houses
  const currentHouses = player.houses[propertyId] || 0;
  if (currentHouses >= state.config.rules.housesPerPropertySet) return false;

  // Check if player has enough money
  const houseCost = (property.price || 0) * state.config.rules.houseCostMultiplier / 100;
  if (player.balance < houseCost) return false;

  // Must build evenly across color set
  const propertiesInGroup = state.config.board.tiles.filter(
    (t) => t.colorGroup === property.colorGroup && t.type === 'property'
  );

  const minHousesInGroup = Math.min(
    ...propertiesInGroup.map((p) => player.houses[p.id] || 0)
  );

  return currentHouses <= minHousesInGroup;
}

export function canBuildHotel(
  player: Player,
  propertyId: string,
  state: GameState
): boolean {
  if (!state.config.rules.hotelsAllowed) return false;

  const property = state.config.board.tiles.find((t) => t.id === propertyId);
  if (!property || property.type !== 'property') return false;

  // Must have max houses
  const currentHouses = player.houses[propertyId] || 0;
  if (currentHouses < state.config.rules.housesPerPropertySet) return false;

  // Must not already have hotel
  if (player.hotels[propertyId]) return false;

  // Check if player has enough money
  const hotelCost = (property.price || 0) * state.config.rules.houseCostMultiplier / 100;
  return player.balance >= hotelCost;
}

export function countUtilitiesOwned(player: Player, state: GameState): number {
  return state.config.board.tiles.filter(
    (t) => t.type === 'utility' && player.properties.includes(t.id)
  ).length;
}

export function countStationsOwned(player: Player, state: GameState): number {
  return state.config.board.tiles.filter(
    (t) => t.type === 'station' && player.properties.includes(t.id)
  ).length;
}

export function countHousesAndHotels(player: Player): { houses: number; hotels: number } {
  const houses = Object.values(player.houses).reduce((sum, count) => sum + count, 0);
  const hotels = Object.values(player.hotels).reduce((sum, count) => sum + count, 0);
  return { houses, hotels };
}

export function getHouseCost(property: TileConfig, config: GameModeConfig): number {
  return (property.price || 0) * config.rules.houseCostMultiplier / 100;
}

export function getHotelCost(property: TileConfig, config: GameModeConfig): number {
  return (property.price || 0) * config.rules.houseCostMultiplier / 100;
}
