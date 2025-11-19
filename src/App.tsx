import React, { useState, useEffect } from 'react';
import { GameState } from './game/GameState';
import { getAvailableModes, loadGameMode } from './config/configLoader';
import { createInitialGameState } from './game/GameEngine';
import Board3D from './ui/Board3D';
import HUD from './ui/HUD';
import PlayerPanel from './ui/PlayerPanel';
import GameModals from './ui/GameModals';
import './App.css';

type AppState = 'MENU' | 'SETUP' | 'PLAYING';

function App() {
  const [appState, setAppState] = useState<AppState>('MENU');
  const [selectedMode, setSelectedMode] = useState<string>('classic');
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2']);
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Load saved game on mount
  useEffect(() => {
    const savedGame = localStorage.getItem('monopoly-game-state');
    if (savedGame) {
      try {
        const parsed = JSON.parse(savedGame);
        // Show continue option
        if (window.confirm('Continue previous game?')) {
          setGameState(parsed);
          setAppState('PLAYING');
        }
      } catch (e) {
        console.error('Failed to load saved game:', e);
      }
    }
  }, []);

  // Save game state periodically
  useEffect(() => {
    if (gameState && appState === 'PLAYING') {
      localStorage.setItem('monopoly-game-state', JSON.stringify(gameState));
    }
  }, [gameState, appState]);

  const handleStartNewGame = () => {
    const config = loadGameMode(selectedMode);
    const newGameState = createInitialGameState(config, playerNames);
    setGameState(newGameState);
    setAppState('PLAYING');
  };

  const handleBackToMenu = () => {
    if (window.confirm('Are you sure you want to quit? Game will be saved.')) {
      setAppState('MENU');
    }
  };

  const handleNewGame = () => {
    localStorage.removeItem('monopoly-game-state');
    setAppState('SETUP');
  };

  if (appState === 'MENU') {
    return (
      <div className="menu-screen">
        <div className="menu-container">
          <h1 className="game-title">MONOPOLY</h1>
          <p className="game-subtitle">Board Game Collection</p>
          <div className="menu-buttons">
            <button className="menu-button primary" onClick={handleNewGame}>
              New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'SETUP') {
    const modes = getAvailableModes();

    return (
      <div className="setup-screen">
        <div className="setup-container">
          <h2>Game Setup</h2>

          <div className="setup-section">
            <label>Select Game Mode:</label>
            <div className="mode-selector">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  className={`mode-button ${selectedMode === mode.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  {mode.displayName}
                </button>
              ))}
            </div>
          </div>

          <div className="setup-section">
            <label>Number of Players:</label>
            <div className="player-count">
              {[2, 3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  className={`count-button ${playerNames.length === count ? 'selected' : ''}`}
                  onClick={() => {
                    const names = Array.from({ length: count }, (_, i) =>
                      i < playerNames.length ? playerNames[i] : `Player ${i + 1}`
                    );
                    setPlayerNames(names);
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="setup-section">
            <label>Player Names:</label>
            <div className="player-names">
              {playerNames.map((name, index) => (
                <input
                  key={index}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const newNames = [...playerNames];
                    newNames[index] = e.target.value;
                    setPlayerNames(newNames);
                  }}
                  placeholder={`Player ${index + 1}`}
                  className="player-name-input"
                />
              ))}
            </div>
          </div>

          <div className="setup-buttons">
            <button className="btn-secondary" onClick={() => setAppState('MENU')}>
              Back
            </button>
            <button className="btn-primary" onClick={handleStartNewGame}>
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'PLAYING' && gameState) {
    return (
      <div className="game-screen" style={{
        '--primary-color': gameState.config.theme.primaryColor,
        '--secondary-color': gameState.config.theme.secondaryColor,
        '--background-color': gameState.config.theme.backgroundColor,
        '--accent-color': gameState.config.theme.accentColor,
      } as React.CSSProperties}>
        <HUD gameState={gameState} onQuit={handleBackToMenu} />
        <div className="game-layout">
          <PlayerPanel gameState={gameState} />
          <Board3D gameState={gameState} />
        </div>
        <GameModals gameState={gameState} setGameState={setGameState} />
      </div>
    );
  }

  return null;
}

export default App;
