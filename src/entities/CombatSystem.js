import * as THREE from 'three';
import { soundManager } from '../engine/AudioSystem.js';

export class CombatSystem {
  constructor(player, cameraController, particleFX) {
    this.player = player;
    this.camera = cameraController;
    this.fx = particleFX;

    this.comboStep = 1;
    this.comboTimer = 0;
    this.comboWindow = 0.65; // Seconds to chain next strike
    this.canAttack = true;

    this.parryActive = false;
    this.parryTimer = 0;
    this.parryWindow = 0.35;
    this.hitStopTimer = 0;
    this._forward = new THREE.Vector3();
    this._toEnemy = new THREE.Vector3();
  }

  triggerAttack(hasFlameBuff = false, hasThunderBuff = false, damageMultiplier = 1.0) {
    if (!this.canAttack || this.player.anim.isDodging || this.player.anim.isHurt) {
      return false;
    }

    if (this.player.stamina < 12) {
      return false;
    }

    this.player.stamina -= 12;

    // Chain combos: 1 -> 2 -> 3 -> 1
    const step = this.comboStep;
    this.player.anim.playAttack(step);

    const isHeavy = step === 3;
    soundManager.playSlash(isHeavy);

    // Spawn glowing slash arc FX
    const slashPos = this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const slashRot = this.player.mesh.rotation.clone();
    if (step === 1) slashRot.z = 0.2;
    if (step === 2) slashRot.z = -0.4;
    if (step === 3) slashRot.x = 0.8;

    let slashColor = 0xffffff;
    if (hasFlameBuff) slashColor = 0xff5722;
    if (hasThunderBuff) slashColor = 0x00e5ff;

    this.fx.createSlashArc(slashPos, slashRot, slashColor, isHeavy ? 1.4 : 1.0);

    // Advance combo step
    this.comboStep = 1;
    this.comboTimer = 0;
    this.canAttack = true;
    this.cooldownTimer = 0;
    this.cooldownMax = 0.22;

    // Reset attack cooldown
    this.cooldownTimer = isHeavy ? 0.32 : 0.22;

    return {
      step,
      isHeavy,
      baseDamage: this.player.baseDamage * damageMultiplier * (isHeavy ? 1.8 : 1.0) * (hasFlameBuff ? 1.4 : 1.0)
    };
  }

  startParry() {
    if (this.player.anim.isDodging || this.player.anim.isAttacking) return false;
    this.player.anim.playParry(true);
    this.parryActive = true;
    this.parryTimer = this.parryWindow;
    this.player.anim.isParrying = true;
    return true;
  }

  stopParry() {
    this.player.anim.playParry(false);
    this.player.anim.isParrying = false;
    this.parryActive = false;
    this.parryTimer = 0;
  }

  checkPlayerHitOnEnemy(enemy, attackData) {
    if (!enemy || enemy.isDead) return false;

    // Calculate reach distance and frontal cone angle
    const playerPos = this.player.position;
    const enemyPos = enemy.mesh.position;
    const dist = playerPos.distanceTo(enemyPos);

    const reach = attackData.isHeavy ? 3.8 : 2.9;
    if (dist > reach) return false;

    // Check if enemy is in front of the player (within ~110 degree arc)
    const forward = this._forward.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotationY);
    const toEnemy = this._toEnemy.subVectors(enemyPos, playerPos).normalize();
    const dot = forward.dot(toEnemy);

    if (dot > 0.2) {
      // Hit lands!
      const finalDmg = Math.round(attackData.baseDamage + (Math.random() * 6 - 3));
      const killed = enemy.takeDamage(finalDmg);

      // Audio & Visual juice
      soundManager.playHitImpact();
      this.fx.createBloodSplatter(enemyPos.clone().add(new THREE.Vector3(0, 1.2, 0)));
      this.camera.addTrauma(attackData.isHeavy ? 0.45 : 0.25);

      // Micro hit-stop for visceral combat feel
      this.hitStopTimer = 0.045;

      return { hit: true, damage: finalDmg, killed };
    }

    return false;
  }

  update(delta) {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= delta;
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboStep = 1; // reset combo chain to slash 1
      }
    }

    if (this.parryTimer > 0) {
      this.parryTimer -= delta;
      if (this.parryTimer <= 0) {
        this.player.anim.isParrying = false;
        this.parryActive = false;
      }
    }

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
      if (this.cooldownTimer <= 0) {
        this.canAttack = true;
      }
    }
  }

  isHitStopped() {
    return this.hitStopTimer > 0;
  }
}
