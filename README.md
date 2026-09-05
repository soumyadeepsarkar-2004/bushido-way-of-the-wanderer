# BUSHIDO: Way of the Wanderer

> *3D Action RPG — Gather, Craft, Fight, Evolve. Become a Legendary Samurai in an Infinite Wilderness.*

![BUSHIDO Banner](https://img.shields.io/badge/BUSHIDO-Live-red?style=for-the-badge)

## Quick Start

```bash
npm install
npm run dev        # Development server at localhost:3000
npm run build      # Production build
npm run preview    # Preview production build
```

## Features

- **3D Open World** — Infinite procedural wilderness with biomes
- **Combat System** — 3-hit katana combos, parry, dodge rolls, slide
- **Destiny Paths** — 4 specialized builds (Flame, Thunder, Spirit, Shadow)
- **Alchemy** — 4 scroll formulations to craft powerful items
- **Store & Blacksmith** — Craft weapons, buy supplies
- **Weather System** — Cherry blossoms, rain, mist, clear skies
- **Enemy Types** — BushLurkers, Ronin, Oni, Ghosts
- **Minimap & Radar** — Track enemies and resources
- **Save/Load** — F5/F9 persistent progress
- **PWA Support** — Installable offline-capable app

## Tech Stack

- **Three.js** — 3D rendering
- **Vite** — Build tool & dev server
- **ES Modules** — Module system
- **Vanilla CSS** — Styling (no framework)
- **Google Fonts** — Cinzel, Noto Serif JP, Rajdhani

## Deploy

The game is configured for **[Vercel](https://vercel.com)** free tier deployment:

```bash
npx vercel --prod
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full setup instructions.

## Controls

| Key | Action |
|-----|--------|
| WASD | Move / Sprint |
| Space | Dodge Roll |
| LMB | 3-Hit Combo |
| RMB | Parry / Block |
| Q/R/F/T | Abilities |
| E | Interact / Forage |
| T | Shuriken Throw |
| I/C/B/K | Inventory/Crafting/Store/Skills |
| L | Destiny/Alchemy |
| F5/F9 | Save/Load |

## Architecture

```
src/
├── main.js              # BushidoGame class — wires all subsystems
├── engine/
│   ├── Renderer.js      # Three.js + post-processing bloom
│   ├── CameraController.js  # Lock-on, screen shake
│   ├── Lighting.js      # Dynamic lighting
│   ├── WeatherSystem.js # Biome fog + weather cycling
│   └── AudioSystem.js   # All sound effects
├── entities/
│   ├── Player.js        # Movement, stats, abilities
│   ├── CombatSystem.js  # Hit detection, parry timing
│   ├── EnemyManager.js  # Spawning, AI, death
│   ├── ParticleFX.js    # Object-pooled particles
│   ├── NPCManager.js    # 3 NPCs with dialog
│   └── ProjectileManager.js # Shuriken/bullet physics
├── systems/
│   ├── ExperienceSystem.js
│   ├── AbilitiesSystem.js
│   ├── StreakSystem.js
│   ├── InventorySystem.js
│   ├── CraftingSystem.js
│   ├── StoreSystem.js
│   ├── DestinySystem.js
│   ├── AlchemySystem.js
│   └── SaveSystem.js
├── ui/
│   ├── HUD.js           # All UI overlays
│   ├── ModalManager.js  # Dialog/trap focus
│   ├── DialogUI.js      # NPC conversation
│   └── RadarUI.js       # Minimap
└── world/
    ├── WorldManager.js  # Procedural world + terrain
    ├── TerrainGenerator.js
    └── ProtectionZone.js # Relic defense events
```

## License

MIT
