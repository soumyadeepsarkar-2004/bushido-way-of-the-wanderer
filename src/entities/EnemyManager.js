import * as THREE from 'three';
import { soundManager } from '../engine/AudioSystem.js';

export class EnemyManager {
  constructor(scene, particleFX) {
    this.scene = scene;
    this.fx = particleFX;
    this.enemies = [];
    this.spawnTimer = 0;
    this.maxEnemies = 14;
  }

  spawnEnemy(type, position) {
    let enemy;
    if (type === 'lurker') {
      enemy = new BushLurker(this.scene, position);
    } else if (type === 'ghost') {
      enemy = new YokaiGhost(this.scene, position);
    } else if (type === 'ronin') {
      enemy = new CorruptedRonin(this.scene, position);
    } else if (type === 'oni') {
      enemy = new OniBrute(this.scene, position);
    } else {
      enemy = new BushLurker(this.scene, position);
    }

    this.enemies.push(enemy);
    return enemy;
  }

  update(delta, player, terrainHeightAt, onPlayerDamaged, hasBuff = () => false) {
    // Check enemy spawns around player
    this.spawnTimer += delta;
    if (this.spawnTimer > 4.5 && this.enemies.length < this.maxEnemies) {
      this.spawnTimer = 0;
      this.spawnRandomNearby(player.position, terrainHeightAt);
    }

    let combatActive = false;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (enemy.isDead) {
        if (enemy.deathTimer > 1.2) {
          this.scene.remove(enemy.mesh);
          this.enemies.splice(i, 1);
          continue;
        }
        // Death feedback: emit spirit particles + sound on first death frame
        if (enemy.deathTimer <= delta + 0.01) {
          this.fx.createSpiritSmoke(enemy.mesh.position.clone());
          soundManager.playEnemyDeath(enemy.type);
        }
        enemy.updateDeath(delta);
        continue;
      }

      // Proximity check to player
      const dist = enemy.mesh.position.distanceTo(player.position);
      if (dist < 26) {
        combatActive = true;
      }

      // Despawn if player ran too far away (> 110m) — boss is EXEMPT
      if (dist > 110 && enemy.type !== 'boss') {
        this.scene.remove(enemy.mesh);
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.update(delta, player, terrainHeightAt, (dmg, isParryable) => {
        // Ghost immunity: spirit buff negates ghost attacks
        if (enemy.type === 'ghost' && hasBuff('spirit')) return;

        // Enemy attacks player
        const hitResult = player.takeDamage(dmg);

        if (hitResult.parried) {
          // Deflected! Stun enemy and emit sparks
          this.fx.createSparks(player.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 30);
          enemy.applyStun(1.8);
          if (onPlayerDamaged) {
            onPlayerDamaged({ parried: true, enemy });
          }
        } else if (!hitResult.dodged && hitResult.damageDealt > 0) {
          // Player takes damage & triggers XP LOSS!
          this.fx.createBloodSplatter(player.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 15);
          if (onPlayerDamaged) {
            onPlayerDamaged({
              damage: hitResult.damageDealt,
              enemy,
              parried: false,
              isDead: hitResult.isDead
            });
          }
        }
      });
    }

    // Dynamic music intensity based on proximity to enemies
    soundManager.setCombatIntensity(combatActive ? 0.9 : 0.0);
  }

  spawnRandomNearby(playerPos, terrainHeightAt) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 25;
    const x = playerPos.x + Math.cos(angle) * dist;
    const z = playerPos.z + Math.sin(angle) * dist;
    const y = terrainHeightAt(x, z);

    const types = ['lurker', 'ghost', 'ronin', 'oni'];
    const weights = [0.4, 0.25, 0.25, 0.1];
    let r = Math.random();
    let selectedType = 'lurker';

    for (let i = 0; i < types.length; i++) {
      if (r < weights[i]) {
        selectedType = types[i];
        break;
      }
      r -= weights[i];
    }

    this.spawnEnemy(selectedType, new THREE.Vector3(x, y, z));
  }

  /**
   * Spawn enemy at exact world position — used by BossOniWarlord minion summon
   */
  spawnAt(position, typeName = 'BushLurker') {
    // Map class name string to internal type key
    const typeMap = { BushLurker: 'lurker', YokaiGhost: 'ghost', CorruptedRonin: 'ronin', OniBrute: 'oni' };
    const typeKey = typeMap[typeName] || 'lurker';
    return this.spawnEnemy(typeKey, position);
  }
}



// ------------------------------------------------------------------
// 1. BUSH LURKER: Camouflaged predator hiding in grass, leaping ambush
// ------------------------------------------------------------------
class BushLurker {
  constructor(scene, pos) {
    this.type = 'lurker';
    this.name = 'Shadow Stalker';
    this.maxHp = 50;
    this.hp = 50;
    this.attackDamage = 18;
    this.speed = 7.0;
    this.isDead = false;
    this.deathTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;
    this.attackCooldown = 0;
    this.isLurking = true; // Hidden until player comes close

    // 3D Model
    this.mesh = new THREE.Group();
    this.mesh.position.copy(pos);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b281d, roughness: 0.8 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), bodyMat);
    body.position.y = 0.35;
    body.castShadow = true;
    this.mesh.add(body);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.6, 6), bodyMat);
    head.rotation.x = -Math.PI / 2;
    head.position.set(0, 0.45, -0.7);
    this.mesh.add(head);

    // Glowing menacing red eyes
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
    eye1.position.set(0.14, 0.48, -0.85);
    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
    eye2.position.set(-0.14, 0.48, -0.85);
    this.mesh.add(eye1, eye2);

    scene.add(this.mesh);
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.isLurking = false;
    if (this.hp <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  applyStun(duration) {
    this.isStunned = true;
    this.stunTimer = duration;
  }

  updateDeath(delta) {
    this.deathTimer += delta;
    this.mesh.rotation.z = Math.min(Math.PI / 2, this.deathTimer * 3.0);
    this.mesh.scale.subScalar(delta * 0.4);
  }

  update(delta, player, terrainHeightAt, onAttack) {
    if (this.isStunned) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) this.isStunned = false;
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    const toPlayer = new THREE.Vector3().subVectors(player.position, this.mesh.position);
    const dist = toPlayer.length();

    // Ambush trigger — lurkers detect players, but shadow buff prevents detection
    if (this.isLurking) {
      if (dist < 14 && !hasBuff('shadow')) {
        this.isLurking = false; // ambush pounce!
      } else {
        return; // stay silent and hidden
      }
    }

    // Orient towards player
    const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, delta * 8.0);

    // Leap attack if close
    if (dist < 2.5 && this.attackCooldown <= 0) {
      this.attackCooldown = 1.6;
      onAttack(this.attackDamage, true);
    } else if (dist > 1.8) {
      // Charge forward
      toPlayer.y = 0;
      toPlayer.normalize();
      this.mesh.position.addScaledVector(toPlayer, this.speed * delta);
      this.mesh.position.y = terrainHeightAt(this.mesh.position.x, this.mesh.position.z);
    }
  }
}

// ------------------------------------------------------------------
// 2. YŌKAI GHOST: Ethereal onryō spirit, floating & phasing
// ------------------------------------------------------------------
class YokaiGhost {
  constructor(scene, pos) {
    this.type = 'ghost';
    this.name = 'Cursed Onryō';
    this.maxHp = 65;
    this.hp = 65;
    this.attackDamage = 22;
    this.speed = 4.5;
    this.isDead = false;
    this.deathTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;
    this.attackCooldown = 0;
    this.floatTimer = Math.random() * Math.PI;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(pos);

    // Ethereal glowing ghost veil
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x80deea,
      emissive: 0x00bcd4,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.75,
      roughness: 0.2
    });

    const cowl = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 8, 1, true), ghostMat);
    cowl.position.y = 1.2;
    cowl.rotation.x = Math.PI;
    this.mesh.add(cowl);

    const spiritOrb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), ghostMat);
    spiritOrb.position.y = 1.7;
    this.mesh.add(spiritOrb);

    // Spirit Light
    const light = new THREE.PointLight(0x00e5ff, 1.2, 8);
    light.position.y = 1.5;
    this.mesh.add(light);

    scene.add(this.mesh);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  applyStun(duration) {
    this.isStunned = true;
    this.stunTimer = duration;
  }

  updateDeath(delta) {
    this.deathTimer += delta;
    this.mesh.position.y += delta * 2.0;
    this.mesh.children.forEach(c => {
      if (c.material) c.material.opacity = Math.max(0, 1.0 - this.deathTimer);
    });
  }

  update(delta, player, terrainHeightAt, onAttack) {
    this.floatTimer += delta * 3.0;

    if (this.isStunned) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) this.isStunned = false;
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    const toPlayer = new THREE.Vector3().subVectors(player.position, this.mesh.position);
    const dist = toPlayer.length();

    // Smooth hover above ground
    const groundY = terrainHeightAt(this.mesh.position.x, this.mesh.position.z);
    this.mesh.position.y = groundY + 1.2 + Math.sin(this.floatTimer) * 0.4;

    const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
    this.mesh.rotation.y = targetAngle;

    if (dist < 3.2 && this.attackCooldown <= 0) {
      this.attackCooldown = 2.2;
      onAttack(this.attackDamage, true);
    } else if (dist > 2.2) {
      toPlayer.y = 0;
      toPlayer.normalize();
      this.mesh.position.addScaledVector(toPlayer, this.speed * delta);
    }
  }
}

// ------------------------------------------------------------------
// 3. CORRUPTED RONIN: Humanoid duelist with sword combos
// ------------------------------------------------------------------
class CorruptedRonin {
  constructor(scene, pos) {
    this.type = 'ronin';
    this.name = 'Corrupted Ronin';
    this.maxHp = 90;
    this.hp = 90;
    this.attackDamage = 28;
    this.speed = 5.5;
    this.isDead = false;
    this.deathTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;
    this.attackCooldown = 0;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(pos);

    const darkClothMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.8 });
    const strawHatMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.85, roughness: 0.2 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), darkClothMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    this.mesh.add(torso);

    // Kasa Straw Hat
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.25, 8), strawHatMat);
    hat.position.y = 1.65;
    hat.castShadow = true;
    this.mesh.add(hat);

    // Katana
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, 0.08), bladeMat);
    blade.position.set(0.4, 0.8, 0.35);
    blade.rotation.x = Math.PI / 4;
    this.mesh.add(blade);

    scene.add(this.mesh);
  }

  takeDamage(amount) {
    // 25% chance ronin blocks or parries
    if (Math.random() < 0.25 && !this.isStunned) {
      soundManager.playParry();
      return false; // blocked
    }
    this.hp -= amount;
    if (this.hp <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  applyStun(duration) {
    this.isStunned = true;
    this.stunTimer = duration;
  }

  updateDeath(delta) {
    this.deathTimer += delta;
    this.mesh.rotation.x = Math.min(Math.PI / 2, this.deathTimer * 3.0);
    this.mesh.scale.subScalar(delta * 0.3);
  }

  update(delta, player, terrainHeightAt, onAttack) {
    if (this.isStunned) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) this.isStunned = false;
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    const toPlayer = new THREE.Vector3().subVectors(player.position, this.mesh.position);
    const dist = toPlayer.length();

    this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

    if (dist < 2.8 && this.attackCooldown <= 0) {
      this.attackCooldown = 1.8;
      onAttack(this.attackDamage, true);
    } else if (dist > 2.0) {
      toPlayer.y = 0;
      toPlayer.normalize();
      this.mesh.position.addScaledVector(toPlayer, this.speed * delta);
      this.mesh.position.y = terrainHeightAt(this.mesh.position.x, this.mesh.position.z);
    }
  }
}

// ------------------------------------------------------------------
// 4. ONI BRUTE: Giant red demon with spiked Kanabo club & shockwaves
// ------------------------------------------------------------------
class OniBrute {
  constructor(scene, pos) {
    this.type = 'oni';
    this.name = 'Crimson Oni';
    this.maxHp = 220;
    this.hp = 220;
    this.attackDamage = 45;
    this.speed = 3.6;
    this.isDead = false;
    this.deathTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;
    this.attackCooldown = 0;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(pos);
    this.mesh.scale.set(1.6, 1.6, 1.6); // Colossal size

    const oniSkinMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.7 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, metalness: 0.6 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.3 });

    // Bulky muscular Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.65), oniSkinMat);
    torso.position.y = 1.2;
    torso.castShadow = true;
    this.mesh.add(torso);

    // Head with 2 golden horns
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), oniSkinMat);
    head.position.y = 2.0;
    this.mesh.add(head);

    const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 6), hornMat);
    horn1.position.set(0.22, 2.45, 0.1);
    horn1.rotation.z = -0.3;
    const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 6), hornMat);
    horn2.position.set(-0.22, 2.45, 0.1);
    horn2.rotation.z = 0.3;
    this.mesh.add(horn1, horn2);

    // Heavy Spiked Kanabo Club
    const club = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 2.2, 8), ironMat);
    club.position.set(0.7, 1.2, 0.4);
    club.rotation.x = Math.PI / 4;
    club.castShadow = true;
    this.mesh.add(club);

    scene.add(this.mesh);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  applyStun(duration) {
    this.isStunned = true;
    this.stunTimer = duration * 0.5; // Oni resists stun duration
  }

  updateDeath(delta) {
    this.deathTimer += delta;
    this.mesh.rotation.x = Math.min(Math.PI / 2, this.deathTimer * 2.0);
    this.mesh.scale.subScalar(delta * 0.4);
  }

  update(delta, player, terrainHeightAt, onAttack) {
    if (this.isStunned) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) this.isStunned = false;
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    const toPlayer = new THREE.Vector3().subVectors(player.position, this.mesh.position);
    const dist = toPlayer.length();

    this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

    if (dist < 4.2 && this.attackCooldown <= 0) {
      this.attackCooldown = 2.6;
      // Heavy ground pound shockwave (unblockable unless dodged)
      onAttack(this.attackDamage, false);
    } else if (dist > 3.2) {
      toPlayer.y = 0;
      toPlayer.normalize();
      this.mesh.position.addScaledVector(toPlayer, this.speed * delta);
      this.mesh.position.y = terrainHeightAt(this.mesh.position.x, this.mesh.position.z);
    }
  }
}
