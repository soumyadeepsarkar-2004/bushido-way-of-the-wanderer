# BUSHIDO: Way of the Wanderer — Agent Notes

## Project Overview
3D action RPG built with Vite + Three.js. 47 modules, ~613KB bundle. ES Modules, vanilla CSS, Google Fonts.

## Build
```
npm run build   # Vite build — passes cleanly
```

## Architecture
`src/main.js` — `BushidoGame` class wires all subsystems. `animate()` loop drives updates in order.

Key directories:
- `src/engine/` — Renderer, CameraController, Lighting, WeatherSystem, AudioSystem
- `src/entities/` — Player, CombatSystem, EnemyManager, ParticleFX, NPCManager, ProjectileManager
- `src/systems/` — ExperienceSystem, AbilitiesSystem, StreakSystem, InventorySystem, CraftingSystem, StoreSystem, DestinySystem, AlchemySystem, SaveSystem
- `src/ui/` — HUD, ModalManager, DialogUI, RadarUI
- `src/world/` — WorldManager, TerrainGenerator, ProtectionZone, ObjectPool
- `src/entities/enemies/` — Enemy types + BossOniWarlord (unused)

## Controls
- WASD: Move | Shift: Sprint | Space: Slide
- LMB: Attack combo | RMB: Parry | T: Shuriken throw | E: Interact NPC
- L: Destiny/Alchemy | I: Inventory | C: Crafting | B: Store | K: Skills
- F5: Save | F9: Load

## AudioSystem Methods
`playHitImpact`, `playShuriken`, `playNPCDialog`, `playLowHpWarning`, `playComboMilestone`, `playStorePurchase`, `playLevelUp`, `playThunderAbility`, `playFlameAbility`, `playSpiritAbility`, `playShadowAbility`, `playEnemyDeath`, `playSwordSwing`, `playStep`, `playThunderStorm`, `setCombatIntensity`

## Key Patterns
- Delta-based timers only (no setTimeout for game logic)
- `prefers-reduced-motion` CSS media query applied
- Object pooling for particles
- Temp vector pooling in CameraController and CombatSystem
- Focus trapping in Modals (Tab/Shift+Tab cycle)
- NPCs spawn at (12,0,12), (-14,0,10), (10,0,-14)
- `terrainHeightAt(x, z)` → `world.getHeight(x, z)`

## Dead / Unused Code
- `src/entities/enemies/BossOniWarlord.js` — never spawned
- `src/ui/DialogUI.js` — now wired via NPCManager (was dead, now active)
