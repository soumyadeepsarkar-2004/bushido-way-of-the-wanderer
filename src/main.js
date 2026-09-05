import * as THREE from 'three';
import { EngineRenderer } from './engine/Renderer.js';
import { CameraController } from './engine/CameraController.js';
import { LightingManager } from './engine/Lighting.js';
import { WeatherSystem } from './engine/WeatherSystem.js';
import { soundManager } from './engine/AudioSystem.js';

import { WorldManager } from './world/WorldManager.js';
import { ProtectionZone } from './world/ProtectionZone.js';

import { Player } from './entities/Player.js';
import { CombatSystem } from './entities/CombatSystem.js';
import { EnemyManager } from './entities/EnemyManager.js';
import { ParticleFX } from './entities/ParticleFX.js';
import { NPCManager } from './entities/NPCManager.js';
import { ProjectileManager } from './entities/ProjectileManager.js';

import { ExperienceSystem } from './systems/ExperienceSystem.js';
import { AbilitiesSystem } from './systems/AbilitiesSystem.js';
import { StreakSystem } from './systems/StreakSystem.js';
import { InventorySystem } from './systems/InventorySystem.js';
import { CraftingSystem } from './systems/CraftingSystem.js';
import { StoreSystem } from './systems/StoreSystem.js';
import { DestinySystem } from './systems/DestinySystem.js';
import { AlchemySystem } from './systems/AlchemySystem.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { DialogUI } from './ui/DialogUI.js';

import { HUD } from './ui/HUD.js';
import { ModalManager } from './ui/Modals.js';
import { RadarUI } from './ui/RadarUI.js';

class BushidoGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.startScreen = document.getElementById('start-screen');
    this.startBtn = document.getElementById('start-game-btn');
    this.crosshair = document.getElementById('crosshair');

    // Engine Core
    this.renderer = new EngineRenderer(this.canvas);
    this.scene = this.renderer.scene;
    this.cameraCtrl = new CameraController(this.canvas);
    this.renderer.setCamera(this.cameraCtrl.camera);
    this.lighting = new LightingManager(this.scene);
    this.weather = new WeatherSystem(this.scene, this.renderer);
    this.fx = new ParticleFX(this.scene);

    // World
    this.world = new WorldManager(this.scene);

    // Player & Combat
    this.player = new Player(this.scene);
    this.combat = new CombatSystem(this.player, this.cameraCtrl, this.fx);
    this.enemies = new EnemyManager(this.scene, this.fx);

    // Gameplay Systems
    this.streak = new StreakSystem();
    this.exp = new ExperienceSystem(this.player);
    this.abilities = new AbilitiesSystem(this.player);
    this.inventory = new InventorySystem(this.player);
    this.crafting = new CraftingSystem(this.inventory);
    this.store = new StoreSystem(this.inventory);
    this.destiny = new DestinySystem(this.player);
    this.alchemy = new AlchemySystem(this.abilities, this.inventory, this.exp);
    this.save = new SaveSystem({ exp: this.exp, inventory: this.inventory, destiny: this.destiny, streak: this.streak, alchemy: this.alchemy, player: this.player });
    this.protection = new ProtectionZone(this.scene, this.enemies, this.exp, this.inventory);

    // UI
    this.hud = new HUD();
    this.modals = new ModalManager(this.inventory, this.crafting, this.store, this.exp, this.destiny, this.alchemy);
    this.dialogUI = new DialogUI();
    this.radar = new RadarUI();

    // NPCs & Projectiles
    this.npcs = new NPCManager(this.scene, this.dialogUI, this.inventory, this.exp, this.hud, soundManager);
    this.projectiles = new ProjectileManager(this.scene, this.fx);

    this.npcs.spawnNPC('chiyo', new THREE.Vector3(12, 0, 12));
    this.npcs.spawnNPC('genkaku', new THREE.Vector3(-14, 0, 10));
    this.npcs.spawnNPC('muramasa', new THREE.Vector3(10, 0, -14));

    // Input state
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false
    };

    this.isPlaying = false;
    this.clock = new THREE.Clock();
    this.nearestInteractive = null;

    this.setupWiring();
    this.setupControls();
  }

  setupWiring() {
    // EXP Alert callback
    this.exp.setCallbacks(
      (alertData) => this.hud.showAlert(alertData),
      (level, title) => {
        // Level up trigger — dramatic effects
        this.cameraCtrl.addTrauma(0.8);
        soundManager.setCombatIntensity(1.0);
        this.hud.showAlert({
          title: `⚔️ LEVEL ${level} — ${title}`,
          subtitle: 'Your power has ascended!',
          type: 'xp-gain'
        });
      }
    );

    // Relic defense event updates
    this.protection.setCallback((data) => {
      this.hud.showAlert({
        title: data.title,
        subtitle: data.subtitle,
        type: 'relic-defense'
      });
    });

    // Start button
    this.startBtn.addEventListener('click', () => {
      soundManager.init();
      this.startScreen.style.display = 'none';
      this.isPlaying = true;
      this.canvas.requestPointerLock();

      this.hud.showAlert({
        title: '⛩️ WAY OF BUSHIDO BEGUN',
        subtitle: 'Run and explore the infinite wild. Train your skills and forge your destiny!',
        type: 'xp-gain'
      });
    });
  }

  setupControls() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (!this.isPlaying) return;

      // Modals toggle
      if (e.key === 'i' || e.key === 'I') {
        this.modals.isOpen() ? this.modals.close() : this.modals.open('inventory');
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        this.modals.isOpen() ? this.modals.close() : this.modals.open('crafting');
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        this.modals.isOpen() ? this.modals.close() : this.modals.open('store');
        return;
      }
if (e.key === 'k' || e.key === 'K') {
          this.modals.isOpen() ? this.modals.close() : this.modals.open('skills');
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          if (this.modals.isOpen()) { this.modals.close(); return; }
          // Cycle between destiny & alchemy modals
          this.modals.currentModal === 'destiny' ? this.modals.open('alchemy') : this.modals.open('destiny');
          return;
        }
if (e.key === 'F5' || e.key === 'f5') {
           this.save.load();
           this.hud.showAlert({ title: '💾 Save Loaded', subtitle: 'Your journey continues from last checkpoint.', type: 'xp-gain' });
           return;
         }
         if (e.key === 'F9' || e.key === 'f9') {
           this.save.save();
           this.hud.showAlert({ title: '💾 Game Saved', subtitle: 'Progress persisted to local storage.', type: 'xp-gain' });
           return;
         }
         if (e.key === 'e' || e.key === 'E') {
           this._tryInteractNPC();
           return;
         }
         if (e.key === 't' || e.key === 'T') {
           this._fireShuriken();
           return;
         }

       if (this.modals.isOpen()) return;

      // Movement
      if (e.code === 'KeyW') this.input.forward = true;
      if (e.code === 'KeyS') this.input.backward = true;
      if (e.code === 'KeyA') this.input.left = true;
      if (e.code === 'KeyD') this.input.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.sprint = true;

      // Dodge Roll / Slide
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.input.sprint) {
          this.player.slide();
        } else {
          this.player.dodge();
        }
      }

      // Abilities (Q, R, F, T)
      if (e.code === 'KeyQ') this.abilities.triggerAbility('thunder');
      if (e.code === 'KeyR') this.abilities.triggerAbility('flame');
      if (e.code === 'KeyF') this.abilities.triggerAbility('spirit');
      if (e.code === 'KeyT') this.abilities.triggerAbility('shadow');

      // Interaction (E)
      if (e.code === 'KeyE') {
        this.handleInteraction();
      }

      // Lock-on Target (Tab)
      if (e.code === 'Tab') {
        e.preventDefault();
        this.toggleLockOn();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW') this.input.forward = false;
      if (e.code === 'KeyS') this.input.backward = false;
      if (e.code === 'KeyA') this.input.left = false;
      if (e.code === 'KeyD') this.input.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.sprint = false;
    });

    // Mouse buttons (LMB = Attack, RMB = Parry/Block)
    window.addEventListener('mousedown', (e) => {
      if (!this.isPlaying || this.modals.isOpen()) return;

      if (e.button === 0) {
        // Left Click: Attack combo
        const attackData = this.combat.triggerAttack(
          this.abilities.hasBuff('flame'),
          this.abilities.hasBuff('thunder'),
          this.destiny.getDamageMultiplier()
        );

        if (attackData) {
          // Check hits against active enemies
          for (const enemy of this.enemies.enemies) {
            const hitInfo = this.combat.checkPlayerHitOnEnemy(enemy, attackData);
            if (hitInfo && hitInfo.hit) {
              // Add to streak!
              this.streak.addStreak(1);
              // Combo milestone sounds
              if (this.streak.currentStreak === 5 || this.streak.currentStreak === 10 || this.streak.currentStreak === 15) {
                soundManager.playComboMilestone(this.streak.currentStreak);
              }
              // Recover lost focus XP if player was recently damaged!
              this.exp.onPlayerCounterHit();

              // If killed enemy
              if (hitInfo.killed) {
                const xpGain = enemy.type === 'oni' ? 80 : (enemy.type === 'ronin' ? 45 : 30);
                this.exp.addXP(xpGain, this.streak.getMultiplier(), `Defeated ${enemy.name}`);
                this.inventory.addResource('gold', enemy.type === 'oni' ? 5 : 1);
              }
              break;
            }
          }
        }
      } else if (e.button === 2) {
        // Right Click: Parry Deflect
        this.combat.startParry();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.combat.stopParry();
      }
    });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleInteraction() {
    if (!this.nearestInteractive) return;
    const obj = this.nearestInteractive;

    if (obj.userData.isForageable) {
      // Forage wild food
      soundManager.playHarvest();
      this.inventory.addResource(obj.userData.type, 1);
      this.exp.addXP(10, 1.0, 'Wild Foraging');
      this.hud.showAlert({
        title: '🌿 WILD HARVEST',
        subtitle: `Gathered ${obj.userData.type.toUpperCase()} from forest! +10 XP`,
        type: 'xp-gain'
      });
      // Remove bush
      obj.parent.remove(obj);
      this.nearestInteractive = null;
    } else if (obj.userData.isMineable) {
      // Mine ore rock
      soundManager.playHitImpact();
      obj.userData.hp--;
      this.fx.createSparks(obj.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 20);

      if (obj.userData.hp <= 0) {
        const oreType = obj.userData.oreType;
        this.inventory.addResource(oreType, 2);
        this.exp.addXP(oreType === 'diamond' ? 60 : 25, 1.0, 'Mining Ore');
        this.hud.showAlert({
          title: '⛏️ ORE EXTRACTED',
          subtitle: `Mined 2x ${oreType.toUpperCase()}! Used for Master Forge.`,
          type: 'xp-gain'
        });
        obj.parent.remove(obj);
        this.nearestInteractive = null;
      }
} else if (obj.userData.isRelicShrine && obj.userData.relicActive) {
       // Start Defend the Relic event!
       this.protection.startDefenseEvent(obj);
     }
   }

   _tryInteractNPC() {
     const nearest = this.npcs.getInteractiveObjects().find(obj => {
       const dist = obj.position.distanceTo(this.player.position);
       return dist < 5;
     });
if (nearest) {
        this.npcs.interact(nearest.userData.npcId);
      }
    }

    _fireShuriken() {
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.mesh.quaternion);
      const origin = this.player.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
      this.projectiles.spawnShuriken(origin, fwd, this.abilities.hasBuff('thunder') ? 50 : 35);
    }

    toggleLockOn() {
    if (this.cameraCtrl.lockedTarget) {
      this.cameraCtrl.setLockTarget(null);
      this.crosshair.classList.remove('locked-on');
    } else {
      // Find nearest living enemy within 25m
      let nearest = null;
      let minDist = 25;
      for (const e of this.enemies.enemies) {
        if (!e.isDead) {
          const d = this.player.position.distanceTo(e.mesh.position);
          if (d < minDist) {
            minDist = d;
            nearest = e;
          }
        }
      }
      if (nearest) {
        this.cameraCtrl.setLockTarget(nearest);
        this.crosshair.classList.add('locked-on');
        // Snap player rotation to face locked target
        const toEnemy = new THREE.Vector3().subVectors(nearest.mesh.position, this.player.position);
        toEnemy.y = 0;
        if (toEnemy.lengthSq() > 0.01) {
          toEnemy.normalize();
          this.player.rotationY = Math.atan2(toEnemy.x, toEnemy.z);
        }
      }
    }
  }

  init() {
    // Initial player ground placement
    const startY = this.world.getHeight(0, 0);
    this.player.setPosition(0, startY, 0);
    this.world.init(this.player.position);

    // Initial enemies
    for (let i = 0; i < 4; i++) {
      this.enemies.spawnRandomNearby(this.player.position, (x, z) => this.world.getHeight(x, z));
    }

    // Start render loop
    this.animate();

    // Register Service Worker for offline caching
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
          console.log('SW registered:', reg.scope);
        }).catch((err) => {
          console.log('SW registration failed:', err);
        });
      });
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = Math.min(0.1, this.clock.getDelta());

    if (!this.isPlaying) {
      this.renderer.render(this.cameraCtrl.camera);
      return;
    }

    // Hit-stop: freeze player/enemy movement but keep rendering & HUD
    const terrainHeightAt = (x, z) => this.world.getHeight(x, z);
    const isHitStopped = this.combat.isHitStopped();
    let distRan = 0;
    if (isHitStopped) {
      this.combat.update(delta);
    } else {
      // 1. Update Player (frozen during hit-stop)
      const camForward = this.cameraCtrl.getForwardVector();
      const camRight = this.cameraCtrl.getRightVector();
      const hasThunder = this.abilities.hasBuff('thunder');

      const prevDist = this.player.totalDistance;
      const biome = this.world.getBiome(this.player.position.x, this.player.position.z);
      const surfaceType = biome.id === 'ROCKY_PEAKS' ? 'stone' : 'grass';
      const speedMult = this.destiny.getSpeedMultiplier();
      this.player.update(delta, this.input, camForward, camRight, terrainHeightAt, hasThunder, speedMult, surfaceType);
      distRan = this.player.totalDistance - prevDist;

      // 2. Update Camera & Lighting & Weather (biome drives fog color)
      this.cameraCtrl.update(delta, this.player.position, terrainHeightAt);
      this.lighting.update(delta, this.player.position);
      this.weather.update(delta, this.player.position, biome);

      // 3. Update Infinite World
      this.world.update(this.player.position);
    }

    // 4. Update Combat & Enemies (enemies frozen during hit-stop)
    if (!isHitStopped) this.combat.update(delta);
    if (!isHitStopped) this.enemies.update(delta, this.player, terrainHeightAt, (event) => {
      if (event.parried) {
        // Perfect parry!
        this.streak.addStreak(1);
        this.cameraCtrl.addTrauma(0.3);
      } else if (event.damage) {
        // Player damaged -> PENALIZE XP LOSS!
        this.exp.penalizeXPLoss(event.damage);
        this.streak.resetStreak();
        const dirToEnemy = new THREE.Vector3().subVectors(event.enemy.mesh.position, this.player.position);
        this.cameraCtrl.addTrauma(0.5, dirToEnemy);
        this.hud.showDamageFlash();
        this.hud.showFloatingDamage(event.damage);
      }
      if (event.isDead) {
        this.isPlaying = false;
        this.hud.showGameOver();
      }
    }, this.abilities.hasBuff.bind(this.abilities));

    // 5. Update Systems
    this.streak.update(delta);
    this.abilities.update(delta);
    this.exp.update(delta, distRan);
    this.fx.update(delta);
    this.protection.update(delta);

    // 6. Interaction Proximity Detection
    this.nearestInteractive = this.world.getNearestInteractive(this.player.position, 3.2);
    if (this.nearestInteractive) {
      let prompt = 'Harvest';
      if (this.nearestInteractive.userData.isMineable) {
        prompt = `Mine ${this.nearestInteractive.userData.oreType.toUpperCase()} Ore`;
      } else if (this.nearestInteractive.userData.isForageable) {
        prompt = `Forage Wild ${this.nearestInteractive.userData.type.toUpperCase()}`;
      } else if (this.nearestInteractive.userData.isRelicShrine) {
        prompt = 'Defend Ancient Sacred Relic';
      }
      this.hud.showInteractionPrompt(prompt);
    } else {
      this.hud.showInteractionPrompt(null);
    }

    // 7. Update HUD
    this.hud.updatePlayerStatus(this.player, this.exp.getProgress());
    this.hud.updateStreaks(this.streak);
    this.hud.updateResources(this.inventory);
    this.hud.updateAbilities(this.abilities);

    // 9. Update Enemy Health Bars
    this.hud.updateEnemyHealthBars(this.enemies.enemies);

    // 10. Update Minimap
    this.radar.update(
      this.player.position,
      this.player.rotationY,
      this.enemies.enemies,
      this.world.interactiveObjects,
      []
    );

    // 11. Update NPCs
    this.npcs.update(delta, this.player.position);

    // 12. Update Projectiles
    const terrainH = (x, z) => this.world.getHeight(x, z);
    this.projectiles.update(delta, this.enemies.enemies, terrainH, (evt) => {
      this.hud.showFloatingDamage(evt.damage);
      this.streak.addStreak(1);
    });

    // 13. Render
    this.renderer.render(this.cameraCtrl.camera);
  }
}

// Instantiate game on window load
window.addEventListener('DOMContentLoaded', () => {
  const game = new BushidoGame();
  game.init();
});
