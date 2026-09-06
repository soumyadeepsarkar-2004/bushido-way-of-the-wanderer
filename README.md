# BUSHIDO: Way of the Wanderer

> **3D Action RPG — Gather, Craft, Fight, Evolve. Become a Legendary Samurai in an Infinite Wilderness.**

<a href="https://bushido-way-of-the-wanderer.vercel.app" target="_blank">
  <img src="https://bushido-way-of-the-wanderer.vercel.app/og-banner.png" alt="BUSHIDO: Way of the Wanderer — gameplay" width="720">
</a>

**▶ Play Now (free):** https://bushido-way-of-the-wanderer.vercel.app

![Status: Live](https://img.shields.io/badge/status-live-brightgreen?style=flat-square)
![Deploy: Vercel](https://img.shields.io/badge/hosting-vercel-000000?style=flat-square)
![Runtime: Three.js](https://img.shields.io/badge/3d-three.js-000000?style=flat-square&logo=three.js)
![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## Quick Start

```bash
npm install
npm run dev        # Development server at localhost:3000
npm run build      # Production build
npm run preview    # Preview production build
```

---

## Features

- **Infinite 3D Open World** — procedural wilderness with biomes: Bamboo Grove, Sacred Sanctuary, Rocky Peaks
- **Combat** — 3-hit katana combos, parry/block timing, sprint, slide, shuriken throws
- **Destiny Paths** — 4 specializations: Flame, Thunder, Spirit, Shadow
- **Alchemy & Crafting** — 4 scroll formulations; forge weapons at the blacksmith
- **Living World** — enemies ambush from tall grass; forage berries, herbs & mushrooms; mine gold, iron & diamond
- **Dynamic Weather** — cherry-blossom petals, rain, mist, clear skies
- **Enemies** — BushLurkers, Corrupted Ronin, Oni Brutes, Yokai Ghosts
- **Companions & Events** — NPC dialog, "Defend the Relic" events
- **Progress** — XP/levels, streaks, inventory, F5 save / F9 load (localStorage)
- **PWA** — installable, offline-capable, works on mobile
- **Production-ready** — GA4 analytics, Sentry crash tracking, security headers, auto-deploy to Vercel

---

## Gameplay Tips

- **Wander smart** — berries give quick healing, herbs go into alchemy, mushrooms sell well.
- **Mine the glimmer** — gold fuels the blacksmith, diamond ore gives a big XP burst. Keep an eye on your Health Bar.
- **Ambush them first** — enemies hide in tall grass. Switch to radar when your health is low.
- **Parry = power** — time RMB right before a hit for a stagger window that lets you riposte freely.
- **Sprint + slide** — combo them to close distance on archers and ronins, and to dodge area attacks.
- **Pick a Destiny early** — Flame (burst damage), Thunder (mobility + buffs), Spirit (sustain), Shadow (stealth multis). Abilities upgrade with your level.
- **Save often** — F5 saves, F9 loads. Enemies respawn in new chunks; your gear and recipes persist.
- **Streak kills** — avoid taking hits between kills to build combo multipliers for bonus XP.

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Shift | Sprint |
| Space | Slide / Dodge Roll |
| LMB | Attack combo |
| RMB | Parry / Block |
| T | Shuriken throw |
| E | Interact / Forage / Mine / NPC |
| L | Destiny / Alchemy |
| I | Inventory |
| C | Crafting |
| B | Store |
| K | Skills |
| F5 / F9 | Save / Load |

## Tech Stack

- **Three.js** — 3D rendering with instanced world meshes (90% fewer draw calls vs individual objects)
- **Vite** — dev server, ESM bundling, oxc minification
- **Vanilla JS (ES Modules) + vanilla CSS** — zero framework overhead
- **Vercel** — free-tier hosting, TLS, CDN, auto-deploy on push
- **Google Analytics 4 + Sentry** — anonymous usage data + crash reporting
- **Google Fonts** — Cinzel, Noto Serif JP, Rajdhani

## Deploy

The game is wired for **Vercel** auto-deploy — every push to GitHub `main` ships to:

**https://bushido-way-of-the-wanderer.vercel.app**

```bash
git push origin main   # → auto-deploys
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for manual setup.

## Architecture

```
src/
├── main.js              # BushidoGame class — wires all subsystems
├── engine/
│   ├── Renderer.js      # Three.js + post-processing bloom
│   ├── CameraController.js  # Lock-on, screen shake, pooled vectors
│   ├── Lighting.js      # Dynamic lighting
│   ├── WeatherSystem.js # Biome fog + weather cycling
│   └── AudioSystem.js   # All sound effects
├── entities/
│   ├── Player.js        # Movement, stats, abilities, pooled vectors
│   ├── CombatSystem.js  # Hit detection, parry timing
│   ├── EnemyManager.js  # Spawning, AI, death, pooled vectors
│   ├── ParticleFX.js    # Object-pooled particles
│   ├── NPCManager.js    # 3 NPCs with dialog
│   └── ProjectileManager.js # Shuriken/bullet physics, pooled vectors
├── systems/
│   ├── ExperienceSystem.js / AbilitiesSystem.js
│   ├── StreakSystem.js / InventorySystem.js
│   ├── CraftingSystem.js / StoreSystem.js
│   ├── DestinySystem.js / AlchemySystem.js / SaveSystem.js
├── ui/
│   ├── HUD.js / ModalManager.js / DialogUI.js / RadarUI.js
└── world/
    ├── WorldManager.js      # Procedural world + chunk streaming
    ├── WorldAssets.js       # Shared geometry/materials + InstancedMesh builders
    ├── TerrainGenerator.js / BiomeDefinitions.js
    ├── ProtectionZone.js    # Relic defense events
    └── (ObjectPool.js removed — superseded by WorldAssets instancing)
```

## License

MIT