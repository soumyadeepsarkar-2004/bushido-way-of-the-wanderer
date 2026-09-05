import * as THREE from 'three';
import { CharacterModel } from './CharacterModel.js';
import { AnimationController } from './AnimationController.js';
import { soundManager } from '../engine/AudioSystem.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    this.model = new CharacterModel();
    this.mesh = this.model.group;
    this.scene.add(this.mesh);

    this.anim = new AnimationController(this.model);

    // Physical Position & Velocity
    this.position = this.mesh.position;
    this.velocity = new THREE.Vector3();
    this.moveDir = new THREE.Vector3();
    this.rotationY = 0;

    // Attributes & Stats
    this.maxHp = 100;
    this.hp = 100;
    this.maxStamina = 100;
    this.stamina = 100;

    this.level = 1;
    this.stageTitle = 'The Kid';

    this.walkSpeed = 4.5;
    this.sprintSpeed = 8.5;
    this.slideSpeed = 12.0;

    this.isSprinting = false;
    this.isSliding = false;
    this.isGrounded = true;
    this.slideTimer = 0;
    this.footstepTimer = 0;

    this.totalDistance = 0;

    // Defense & Weapon stats
    this.baseDamage = 25;
    this.damageReduction = 0.0; // 0.0 to 0.75
    this.equippedArmor = 'none';
    this.equippedWeapon = 'katana';

    // Invulnerability window (during dodge)
    this.isInvulnerable = false;
    this.invulnTimer = 0;
    this._speedVec = new THREE.Vector2();
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }

  takeDamage(amount) {
    if (this.isInvulnerable || this.anim.isDodging) {
      return { damageDealt: 0, dodged: true };
    }

    // Check if actively parrying/blocking
    if (this.anim.isParrying) {
      soundManager.playParry();
      this.stamina = Math.max(0, this.stamina - 15);
      return { damageDealt: 0, parried: true };
    }

    // Apply armor damage reduction
    const finalDamage = Math.max(1, Math.round(amount * (1.0 - this.damageReduction)));
    this.hp = Math.max(0, this.hp - finalDamage);

    soundManager.playHitImpact();
    this.anim.playHurt();

    if (this.hp <= 0) {
      this.isDead = true;
      this.anim.playHurt();
    }

    return { damageDealt: finalDamage, parried: false, dodged: false, isDead: this.hp <= 0 };
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  restoreStamina(amount) {
    this.stamina = Math.min(this.maxStamina, this.stamina + amount);
  }

  dodge() {
    if (this.stamina < 20 || this.anim.isDodging) return false;
    this.stamina -= 20;
    this.anim.playDodge();
    soundManager.playDodge();
    this.isInvulnerable = true;
    this.invulnTimer = 0.35;

    // Boost forward burst
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
    this.velocity.copy(forward).multiplyScalar(14.0);
    return true;
  }

  slide() {
    if (this.stamina < 10 || this.anim.isDodging) return false;
    this.stamina -= 10;
    this.anim.playDodge();
    soundManager.playDodge();
    this.isInvulnerable = true;
    this.invulnTimer = 0.35;
    this.isSliding = true;

    // Fast horizontal slide along camera forward
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
    this.velocity.copy(forward).multiplyScalar(this.slideSpeed);
    return true;
  }

  setEvolutionStage(level) {
    this.level = level;
    let oldTitle = this.stageTitle;

    if (level < 5) {
      this.model.setStage('kid');
      this.stageTitle = 'The Kid';
      this.maxHp = 100;
      this.maxStamina = 100;
    } else if (level < 10) {
      this.model.setStage('ronin');
      this.stageTitle = 'Wandering Ronin';
      this.maxHp = 150;
      this.maxStamina = 130;
    } else {
      this.model.setStage('samurai');
      this.stageTitle = 'Samurai Lord';
      this.maxHp = 220;
      this.maxStamina = 180;
    }

    return oldTitle !== this.stageTitle;
  }

  setArmor(armorType) {
    this.equippedArmor = armorType;
    this.model.setArmor(armorType);

    if (armorType === 'leather') {
      this.damageReduction = 0.20;
    } else if (armorType === 'iron') {
      this.damageReduction = 0.40;
    } else if (armorType === 'gold') {
      this.damageReduction = 0.55;
    } else if (armorType === 'diamond') {
      this.damageReduction = 0.75;
    } else {
      this.damageReduction = 0.0;
    }
  }

  setWeapon(weaponType) {
    this.equippedWeapon = weaponType;
    if (weaponType === 'katana') this.baseDamage = 25;
    if (weaponType === 'nodachi') this.baseDamage = 45;
    if (weaponType === 'sunBlade') this.baseDamage = 70;
  }

  update(delta, input, cameraForward, cameraRight, terrainHeightAt, hasThunderBuff = false, speedMultiplier = 1.0, surfaceType = 'grass') {
    // Invulnerability timer decay
    if (this.invulnTimer > 0) {
      this.invulnTimer -= delta;
      if (this.invulnTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Stamina Regeneration
    if (!this.isSprinting && !this.anim.isDodging) {
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 24.0);
    }

    // Movement Direction calculation
    this.moveDir.set(0, 0, 0);
    if (input.forward) this.moveDir.add(cameraForward);
    if (input.backward) this.moveDir.sub(cameraForward);
    if (input.right) this.moveDir.add(cameraRight);
    if (input.left) this.moveDir.sub(cameraRight);

    const isMoving = this.moveDir.lengthSq() > 0.01;
    if (isMoving) {
      this.moveDir.normalize();
    }

    // Sprint & Slide input
    this.isSprinting = input.sprint && isMoving && this.stamina > 5;
    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - delta * 15.0);
    }

    // Speed modifiers
    let currentMaxSpeed = this.walkSpeed * speedMultiplier;
    if (this.isSprinting) currentMaxSpeed = this.sprintSpeed * speedMultiplier;
    if (hasThunderBuff) currentMaxSpeed *= 1.55;

    // Movement physics & rotation
    if (!this.anim.isDodging) {
      if (isMoving) {
        const targetRot = Math.atan2(this.moveDir.x, this.moveDir.z);
        // Smooth rotation angle interpolation
        let diff = targetRot - this.rotationY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.rotationY += diff * Math.min(1.0, delta * 14.0);

        this.velocity.x = this.moveDir.x * currentMaxSpeed;
        this.velocity.z = this.moveDir.z * currentMaxSpeed;

// Footsteps
    this.footstepTimer += delta * (this.isSprinting ? 2.8 : 1.7);
    if (this.footstepTimer > 1.0) {
      soundManager.playFootstep(surfaceType);
      this.footstepTimer = 0;
    }

        this.totalDistance += this.velocity.length() * delta;
      } else {
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, delta * 12.0);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, delta * 12.0);
      }
    } else {
      // Slow friction during dodge
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, delta * 4.0);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, delta * 4.0);
    }

    // Apply translation
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Snap to terrain height + smooth slope
    if (terrainHeightAt) {
      const targetY = terrainHeightAt(this.position.x, this.position.z);
      this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, Math.min(1.0, delta * 25.0));
    }

    this.mesh.rotation.y = this.rotationY;

    // Update animations
    const currentSpeed = this._speedVec.set(this.velocity.x, this.velocity.z).length();
    this.anim.update(delta, currentSpeed, this.isSprinting);
  }
}
