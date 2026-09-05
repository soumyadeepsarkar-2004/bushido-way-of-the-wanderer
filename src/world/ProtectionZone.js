import * as THREE from 'three';

export class ProtectionZone {
  constructor(scene, enemyManager, expSystem, inventorySystem) {
    this.scene = scene;
    this.enemyManager = enemyManager;
    this.expSystem = expSystem;
    this.inventory = inventorySystem;

    this.activeShrine = null;
    this.isEventActive = false;
    this.relicHp = 100;
    this.waveNumber = 1;
    this.enemiesRemaining = 0;
    this.spawnInterval = 0;

    this.onEventUpdate = null; // callback to update HUD banner
  }

  setCallback(cb) {
    this.onEventUpdate = cb;
  }

  startDefenseEvent(shrine) {
    if (this.isEventActive) return;
    this.activeShrine = shrine;
    this.isEventActive = true;
    this.relicHp = 100;
    this.waveNumber = 1;
    this.enemiesRemaining = 5;

    // Spawn holy protection ward ring
    const ringGeo = new THREE.RingGeometry(5.5, 5.8, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.wardRing = new THREE.Mesh(ringGeo, ringMat);
    this.wardRing.position.copy(shrine.position);
    this.wardRing.position.y += 0.15;
    this.scene.add(this.wardRing);

    if (this.onEventUpdate) {
      this.onEventUpdate({
        active: true,
        title: '⚔️ DEFEND THE SACRED RELIC!',
        subtitle: `Wave ${this.waveNumber}: Slay incoming Yōkai before they breach the shrine!`,
        relicHp: this.relicHp,
        enemiesLeft: this.enemiesRemaining
      });
    }

    // Spawn first wave
    this.spawnWaveEnemies();
  }

  spawnWaveEnemies() {
    if (!this.activeShrine) return;
    const shrinePos = this.activeShrine.position;

    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4;
      const spawnPos = new THREE.Vector3(
        shrinePos.x + Math.cos(angle) * 18,
        shrinePos.y,
        shrinePos.z + Math.sin(angle) * 18
      );
      this.enemyManager.spawnEnemy(i % 2 === 0 ? 'ghost' : 'lurker', spawnPos);
    }
  }

  update(delta) {
    if (!this.isEventActive) return;

    if (this.wardRing) {
      this.wardRing.rotation.y += delta * 0.5;
    }

    // Check if enemies are dead
    const aliveAroundShrine = this.enemyManager.enemies.filter(e => {
      return !e.isDead && e.mesh.position.distanceTo(this.activeShrine.position) < 30;
    }).length;

    this.enemiesRemaining = aliveAroundShrine;

    if (this.enemiesRemaining === 0) {
      // Victory!
      this.completeDefense();
    }
  }

  completeDefense() {
    this.isEventActive = false;
    if (this.wardRing) {
      this.scene.remove(this.wardRing);
    }

    // Massive Rewards
    this.expSystem.addXP(150, 1.5, 'Relic Defense Victory');
    this.inventory.addResource('diamond', 2);
    this.inventory.addResource('gold', 8);

    if (this.onEventUpdate) {
      this.onEventUpdate({
        active: false,
        title: '🌟 RELIC SANCTIFIED!',
        subtitle: 'The demonic horde was repelled! Rewarded: +150 XP, 8 Gold & 2 Rare Diamonds!',
        type: 'relic-defense'
      });
    }
  }
}
