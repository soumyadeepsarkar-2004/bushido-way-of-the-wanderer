import * as THREE from 'three';

export class AnimationController {
  constructor(characterModel) {
    this.model = characterModel;
    this.currentState = 'idle'; // 'idle', 'walk', 'run', 'attack1', 'attack2', 'attack3', 'parry', 'dodge', 'hurt'
    this.animTime = 0;
    this.attackComboStep = 0;
    this.isAttacking = false;
    this.isParrying = false;
    this.isDodging = false;
    this.isHurt = false;

    this.attackDuration = 0.35;
    this.dodgeDuration = 0.4;
  }

  playAttack(step = 1) {
    if (this.isDodging) return false;
    this.currentState = `attack${step}`;
    this.animTime = 0;
    this.attackComboStep = step;
    this.isAttacking = true;
    return true;
  }

  playParry(active = true) {
    if (this.isDodging || this.isAttacking) return;
    this.isParrying = active;
    if (active) {
      this.currentState = 'parry';
    } else if (this.currentState === 'parry') {
      this.currentState = 'idle';
    }
  }

  playDodge() {
    if (this.isDodging) return false;
    this.currentState = 'dodge';
    this.animTime = 0;
    this.isDodging = true;
    this.isAttacking = false;
    this.isParrying = false;
    return true;
  }

  playHurt() {
    this.currentState = 'hurt';
    this.animTime = 0;
    this.isHurt = true;
    this.isAttacking = false;
    this.isParrying = false;
  }

  update(delta, speed = 0, isSprinting = false) {
    this.animTime += delta;
    const joints = this.model.joints;
    if (!joints.torso) return;

    // Reset base rotations
    const t = this.animTime;

    if (this.isDodging) {
      // 360 degree combat dive roll
      const progress = Math.min(1.0, t / this.dodgeDuration);
      joints.torso.rotation.x = progress * Math.PI * 2;
      joints.torso.position.y = 0.45 + Math.sin(progress * Math.PI) * 0.4;

      joints.leftArm.rotation.x = -1.2;
      joints.rightArm.rotation.x = -1.2;
      joints.leftLeg.rotation.x = 0.8;
      joints.rightLeg.rotation.x = 0.8;

      if (progress >= 1.0) {
        this.isDodging = false;
        joints.torso.rotation.x = 0;
        joints.torso.position.y = 0.9;
        this.currentState = speed > 0.1 ? 'run' : 'idle';
      }
      return;
    }

    if (this.isHurt) {
      // Stagger backward
      joints.torso.rotation.x = -0.35;
      joints.head.rotation.x = -0.25;
      joints.leftArm.rotation.x = 0.4;
      joints.rightArm.rotation.x = 0.4;

      if (t > 0.28) {
        this.isHurt = false;
        joints.torso.rotation.x = 0;
        joints.head.rotation.x = 0;
        this.currentState = 'idle';
      }
      return;
    }

    if (this.isAttacking) {
      const duration = this.attackDuration;
      const p = Math.min(1.0, t / duration);

      if (this.currentState === 'attack1') {
        // Horizontal Katana Slash Right -> Left
        joints.torso.rotation.y = THREE.MathUtils.lerp(-0.6, 0.7, p);
        joints.rightArm.rotation.x = THREE.MathUtils.lerp(-0.2, -1.5, Math.sin(p * Math.PI));
        joints.rightArm.rotation.z = THREE.MathUtils.lerp(0.8, -0.6, p);
        joints.leftArm.rotation.x = 0.2;
      } else if (this.currentState === 'attack2') {
        // Reverse Upward Diagonal Slash
        joints.torso.rotation.y = THREE.MathUtils.lerp(0.5, -0.7, p);
        joints.rightArm.rotation.x = THREE.MathUtils.lerp(0.5, -1.8, p);
        joints.rightArm.rotation.z = THREE.MathUtils.lerp(-0.5, 0.7, p);
      } else if (this.currentState === 'attack3') {
        // Overhead Heavy Cleave (Jumps slightly)
        joints.torso.position.y = 0.9 + Math.sin(p * Math.PI) * 0.35;
        joints.torso.rotation.x = THREE.MathUtils.lerp(-0.4, 0.6, p);
        joints.rightArm.rotation.x = THREE.MathUtils.lerp(-2.8, -0.3, p);
        joints.leftArm.rotation.x = THREE.MathUtils.lerp(-2.8, -0.3, p);
      }

      if (p >= 1.0) {
        this.isAttacking = false;
        joints.torso.rotation.set(0, 0, 0);
        joints.torso.position.y = 0.9;
        this.currentState = speed > 0.1 ? 'run' : 'idle';
      }
      return;
    }

    if (this.isParrying) {
      // Defensive ready block: 2 hands forward guarding with blade
      joints.torso.rotation.y = 0.3;
      joints.rightArm.rotation.x = -1.35;
      joints.rightArm.rotation.z = -0.5;
      joints.leftArm.rotation.x = -1.1;
      joints.leftArm.rotation.z = 0.6;
      return;
    }

    // Locomotion: Run vs Idle
    if (speed > 0.1) {
      const runFreq = isSprinting ? 14 : 9;
      const legAngle = Math.sin(t * runFreq) * (isSprinting ? 0.85 : 0.55);
      const armAngle = -Math.sin(t * runFreq) * (isSprinting ? 0.75 : 0.45);

      // Torso lean into sprint
      joints.torso.rotation.x = isSprinting ? 0.25 : 0.1;
      joints.torso.position.y = 0.9 + Math.abs(Math.sin(t * runFreq)) * 0.08;

      joints.leftLeg.rotation.x = legAngle;
      joints.rightLeg.rotation.x = -legAngle;

      joints.leftArm.rotation.x = armAngle;
      // Right arm rests or swings slightly with weapon
      joints.rightArm.rotation.x = -armAngle * 0.6 - 0.2;
      joints.rightArm.rotation.z = 0.15;
    } else {
      // Idle Breathing
      const breath = Math.sin(t * 2.2);
      joints.torso.position.y = 0.9 + breath * 0.015;
      joints.torso.rotation.x = 0;
      joints.torso.rotation.y = 0;

      joints.leftLeg.rotation.x = 0;
      joints.rightLeg.rotation.x = 0;

      // Relaxed stance: hand rests casually near hip scabbard
      joints.leftArm.rotation.x = -0.15 + breath * 0.02;
      joints.rightArm.rotation.x = -0.15 - breath * 0.02;
      joints.rightArm.rotation.z = 0.1;
    }
  }
}
