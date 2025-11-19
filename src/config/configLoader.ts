import { GameModeConfig } from './configSchema';
import classicConfig from './modes/classic.json';
import fantasyConfig from './modes/fantasy.json';
import cityConfig from './modes/city.json';
import ukConfig from './modes/uk.json';
import starwarsConfig from './modes/starwars.json';
import marioConfig from './modes/mario.json';
import minecraftConfig from './modes/minecraft.json';
import waltonConfig from './modes/walton.json';

const configs: Record<string, GameModeConfig> = {
  classic: classicConfig as GameModeConfig,
  fantasy: fantasyConfig as GameModeConfig,
  city: cityConfig as GameModeConfig,
  uk: ukConfig as GameModeConfig,
  starwars: starwarsConfig as GameModeConfig,
  mario: marioConfig as GameModeConfig,
  minecraft: minecraftConfig as GameModeConfig,
  walton: waltonConfig as GameModeConfig,
};

export function getAvailableModes(): { id: string; displayName: string }[] {
  return Object.values(configs).map((config) => ({
    id: config.id,
    displayName: config.displayName,
  }));
}

export function loadGameMode(modeId: string): GameModeConfig {
  const config = configs[modeId];
  if (!config) {
    console.error(`Game mode '${modeId}' not found, falling back to 'classic'`);
    return configs.classic;
  }

  // Validate config
  if (!config.board?.tiles || config.board.tiles.length === 0) {
    throw new Error(`Invalid config for mode '${modeId}': board tiles missing`);
  }

  return config;
}

export function validateConfig(config: GameModeConfig): boolean {
  try {
    if (!config.id || !config.displayName) return false;
    if (!config.board?.tiles || config.board.tiles.length < 4) return false;
    if (!config.currency?.symbol || !config.currency?.startingBalance) return false;
    if (!config.rules) return false;
    return true;
  } catch (error) {
    console.error('Config validation error:', error);
    return false;
  }
}
