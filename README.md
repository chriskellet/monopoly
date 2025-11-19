# Monopoly Board Game 🎲

A fully-featured, web-based Monopoly-style board game with stunning 3D/2.5D visuals, configurable game modes, and smooth animations. Built with React, TypeScript, and modern web technologies.

## Features

- **3D/2.5D Board Presentation**: Beautiful CSS-based 3D transforms create an immersive board game experience
- **Configurable Game Modes**: Switch between different themed boards (Classic, Fantasy Kingdom, Metro City)
- **Full Gameplay**: Complete Monopoly rules including:
  - Property buying and rent collection
  - Building houses and hotels
  - Chance and Community Chest cards
  - Jail mechanics
  - Tax tiles
  - Player bankruptcy and game victory
- **2-6 Players**: Local pass-and-play multiplayer
- **Smooth Animations**: Dice rolling, token movement, and UI transitions
- **Game Persistence**: Automatically saves game state to local storage
- **Responsive Design**: Works on desktop and tablet devices
- **No Backend Required**: Runs entirely in the browser as a static site

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and dev server
- **CSS3** - 3D transforms and animations
- **Local Storage** - Game state persistence

## Project Structure

```
monopoly/
├── public/
│   └── favicon.svg
├── src/
│   ├── config/
│   │   ├── modes/
│   │   │   ├── classic.json      # Classic Monopoly theme
│   │   │   ├── fantasy.json      # Fantasy Kingdom theme
│   │   │   └── city.json         # Metro City theme
│   │   ├── configSchema.ts       # TypeScript types for configs
│   │   └── configLoader.ts       # Config loading utilities
│   ├── game/
│   │   ├── GameState.ts          # Game state types
│   │   ├── GameEngine.ts         # Core game logic
│   │   └── Rules.ts              # Game rules and calculations
│   ├── ui/
│   │   ├── Board3D.tsx           # 3D board component
│   │   ├── HUD.tsx               # Top bar with game info
│   │   ├── PlayerPanel.tsx       # Player list and event log
│   │   ├── GameModals.tsx        # Interactive decision modals
│   │   └── Dice.tsx              # Animated dice component
│   ├── App.tsx                   # Main app component
│   ├── App.css                   # Global styles
│   └── main.tsx                  # Entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm (or yarn/pnpm)
- A modern web browser

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd monopoly
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The game will open in your browser at `http://localhost:3000`

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## How to Play

### Starting a Game

1. Click "New Game" from the main menu
2. Select a game mode (Classic, Fantasy Kingdom, or Metro City)
3. Choose the number of players (2-6)
4. Enter player names
5. Click "Start Game"

### Gameplay

**Your Turn:**
1. Roll the dice
2. Your token moves automatically
3. Respond to the tile you land on:
   - **Unowned Property**: Buy or pass
   - **Owned Property**: Pay rent to the owner
   - **Tax Tiles**: Pay the required tax
   - **Chance/Community Cards**: Draw and apply card effects
   - **Go**: Collect money when passing
   - **Jail**: Roll doubles, pay fine, or use a Get Out of Jail Free card

**Managing Properties:**
- After landing and resolving, you can build houses/hotels on properties where you own the full color set
- Building must be done evenly across the color set
- Click "End Turn" when finished

**Winning:**
- Be the last player standing (all others bankrupt)
- Or have the most money when the turn limit is reached (if configured)

### Game Modes

**Classic Edition**
- Traditional Monopoly properties and street names
- Starting balance: $1,500
- Pass GO: $200

**Fantasy Kingdom**
- Medieval fantasy-themed locations
- Starting balance: 2,000 gold coins
- Pass Kingdom Gates: 300 gold coins

**Metro City**
- Modern city neighborhoods and districts
- Starting balance: 2,500 credits
- Pass City Hall: 250 credits

## Customizing Game Modes

You can create your own game modes by adding new JSON files to `src/config/modes/`.

### Config Structure

```typescript
{
  "id": "custom-mode",
  "displayName": "My Custom Mode",
  "theme": {
    "boardName": "Custom Board",
    "primaryColor": "#1a472a",
    "secondaryColor": "#c8102e",
    "backgroundColor": "#e8f4ea",
    "accentColor": "#ffd700"
  },
  "currency": {
    "symbol": "$",
    "name": "dollars",
    "startingBalance": 1500,
    "passGoAmount": 200
  },
  "board": {
    "tiles": [
      // 40 tiles total, positions 0-39
      {
        "id": "go",
        "type": "go",
        "name": "GO",
        "position": 0
      },
      {
        "id": "property1",
        "type": "property",
        "name": "Mediterranean Avenue",
        "colorGroup": "brown",
        "position": 1,
        "price": 60,
        "baseRent": 2
      }
      // ... more tiles
    ]
  },
  "rules": {
    "maxPlayers": 6,
    "jailFine": 50,
    "housesPerPropertySet": 4,
    "hotelsAllowed": true,
    "houseCostMultiplier": 50,
    "rentMultipliers": {
      "fullSetOwned": 2,
      "withHouses": [5, 10, 15, 20],
      "withHotel": 25
    }
  },
  "cards": {
    "chance": [ /* card objects */ ],
    "community": [ /* card objects */ ]
  }
}
```

After creating a new config file, import it in `src/config/configLoader.ts`.

## Deploying to GitHub Pages

### Option 1: Using npm script (Recommended)

1. Update `vite.config.ts` with your repository name:
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ...
});
```

2. Run the deploy command:
```bash
npm run deploy
```

This will build the project and push it to the `gh-pages` branch.

### Option 2: Manual GitHub Pages Setup

1. Build the project:
```bash
npm run build
```

2. Push the `dist` folder to GitHub:
```bash
git add dist -f
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages
```

3. In your GitHub repository settings:
   - Go to Settings > Pages
   - Select "gh-pages" branch as the source
   - Click Save

Your game will be available at `https://yourusername.github.io/your-repo-name/`

### Option 3: GitHub Actions (Automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Architecture

### Game Engine

The game logic is separated from the UI in pure TypeScript functions:

- **GameEngine.ts**: Core functions like `rollDice()`, `movePlayer()`, `buyProperty()`, etc.
- **GameState.ts**: Type definitions for the complete game state
- **Rules.ts**: Game rule calculations (rent, building requirements, etc.)

This separation makes the code:
- Easy to test
- Easy to understand
- Easy to modify rules
- Potentially reusable for different UIs

### UI Components

React components handle rendering and user interaction:

- **App.tsx**: Main app with menu, setup, and game screens
- **Board3D.tsx**: 3D board rendering with CSS transforms
- **GameModals.tsx**: Decision prompts and interactions
- **HUD.tsx**: Top bar with current player and phase info
- **PlayerPanel.tsx**: Player stats and event log
- **Dice.tsx**: Animated dice display

### State Management

Game state is managed at the App level and passed down to components. State updates flow through pure functions in the game engine, ensuring predictable behavior.

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Older browsers may not support some CSS features (3D transforms, custom properties).

## Performance

The game is optimized for smooth performance:
- Minimal re-renders using React best practices
- CSS animations for hardware acceleration
- Efficient state updates
- Small bundle size (~200KB gzipped)

## Known Limitations

- No AI players (all human, pass-and-play)
- No trading between players
- No property auctions
- No mortgage system
- Turn limit is optional but not enforced in UI

These features could be added in future updates.

## Contributing

Contributions are welcome! Some ideas for improvements:

- Add AI players with difficulty levels
- Implement player trading
- Add property auctions
- Add mortgage/unmortgage functionality
- Add sound effects and music
- Add more game modes
- Improve mobile/touch support
- Add multiplayer over network

## License

This project is open source and available under the MIT License.

## Credits

Created as a demonstration of modern web game development with React, TypeScript, and CSS 3D transforms.

Inspired by the classic Monopoly board game. This is a fan project and is not affiliated with or endorsed by Hasbro or any official Monopoly products.

---

Enjoy playing! 🎲🏠🏨
