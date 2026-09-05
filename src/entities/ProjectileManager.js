import * as THREE from 'three';
import { soundManager } from '../engine/AudioSystem.js';

export class ProjectileManager {
  constructor(scene, particleFX) {
    this.scene = scene;
    this.fx = particleFX;
    this.projectiles = [];
  }

  spawnMatchlockBullet(origin, direction, damage = 95) {
    const geo = new THREE.SphereGeometry(0.12, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      velocity: direction.clone().normalize().multiplyScalar(90.0),
      damage,
      type: 'bullet',
      life: 1.5,
      maxLife: 1.5
    });
  }

  spawnShuriken(origin, direction, damage = 35) {
    const group = new THREE.Group();
    group.position.copy(origin);

    const mat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.9, roughness: 0.2 });
    // 4-pointed ninja star
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.08), mat);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.35), mat);
    group.add(b1, b2);

    this.scene.add(group);

    soundManager.playShuriken();

    this.projectiles.push({
      mesh: group,
      velocity: direction.clone().normalize().multiplyScalar(38.0),
      damage,
      type: 'shuriken',
      life: 2.0,
      maxLife: 2.0
    });
  }

  spawnTalisman(origin, direction, damage = 60) {
    const geo = new THREE.PlaneGeometry(0.25, 0.5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      velocity: direction.clone().normalize().multiplyScalar(30.0),
      damage,
      type: 'talisman',
      life: 2.5,
      maxLife: 2.5
    });
  }

  update(delta, enemies, terrainHeightAt, onEnemyHit) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry?.dispose();
        this.projectiles.splice(i, 1);
        continue;
      }

      // Movement
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Rotation for shurikens
      if (p.type === 'shuriken') {
        p.mesh.rotation.y += delta * 35.0;
      }

      // Check ground collision
      const groundH = terrainHeightAt(p.mesh.position.x, p.mesh.position.z);
      if (p.mesh.position.y <= groundH) {
        this.fx.createSparks(p.mesh.position, 10);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check enemy collisions
      let hitEnemy = false;
      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        const dist = p.mesh.position.distanceTo(enemy.mesh.position.clone().add(new THREE.Vector3(0, 1.0, 0)));
        const hitRadius = enemy.type === 'boss' || enemy.type === 'oni' ? 2.5 : 1.3;

        if (dist < hitRadius) {
          const killed = enemy.takeDamage(p.damage);
          hitEnemy = true;

          soundManager.playHitImpact();
          this.fx.createBloodSplatter(p.mesh.position, 18);
          this.fx.createSparks(p.mesh.position, 15);

          if (p.type === 'talisman') {
            this.fx.createTalismanBurst(p.mesh.position);
          }

          if (onEnemyHit) {
            onEnemyHit({ enemy, damage: p.damage, killed, projectileType: p.type });
          }
          break;
        }
      }

      if (hitEnemy) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }
}
