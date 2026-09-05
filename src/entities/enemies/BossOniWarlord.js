import * as THREE from 'three';

/**
 * BossOniWarlord — Epic multi-phase boss enemy
 * 600 HP, 3 attack phases, minion summoning, cinematic finisher
 */
export class BossOniWarlord {
  constructor(scene, position, enemyManager, fx, soundManager) {
    this.scene = scene;
    this.enemyManager = enemyManager;
    this.fx = fx;
    this.soundManager = soundManager;

    this.maxHp = 600;
    this.hp = 600;
    this.type = 'boss';
    this.name = 'Oni Warlord Kuraokami';
    this.isDead = false;
    this.hitRadius = 2.5;

    this.phase = 1;
    this.minionsSummoned = false;

    this.state = 'roam';
    this.stateTimer = 0;
    this.attackCooldown = 0;
    this.chargeCooldown = 0;
    this.chargeDir = new THREE.Vector3();
    this.hasDoneIntro = false;
    this.deathLoot = null;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this._buildModel();
    scene.add(this.group);
    this.mesh = this.group;
  }

  _mat(color, metalness = 0, roughness = 0.8, emissive = 0) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity: emissive ? 0.4 : 0 });
  }

  _buildModel() {
    const darkRed = this._mat(0x6a0000, 0.1, 0.9);
    const hornMat = this._mat(0x1a1a1a, 0.3, 0.5);
    const goldMat = this._mat(0xd4af37, 0.9, 0.2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });

    const bodyGeo = new THREE.BoxGeometry(1.4, 1.6, 0.9);
    this.bodyMesh = new THREE.Mesh(bodyGeo, darkRed);
    this.bodyMesh.position.y = 1.2;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    const headGeo = new THREE.BoxGeometry(0.85, 0.85, 0.75);
    this.headMesh = new THREE.Mesh(headGeo, darkRed);
    this.headMesh.position.y = 2.35;
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    for (const side of [-1, 1]) {
      const hornGeo = new THREE.ConeGeometry(0.1, 0.7, 6);
      const horn = new THREE.Mesh(hornGeo, hornMat);
      horn.position.set(side * 0.3, 2.85, 0);
      horn.rotation.z = side * -0.3;
      horn.castShadow = true;
      this.group.add(horn);
    }

    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(side * 0.22, 2.4, 0.38);
      this.group.add(eye);
    }

    for (const side of [-1, 1]) {
      const armGeo = new THREE.BoxGeometry(0.45, 1.4, 0.42);
      const arm = new THREE.Mesh(armGeo, darkRed);
      arm.position.set(side * 0.98, 1.1, 0);
      arm.castShadow = true;
      this.group.add(arm);
    }

    for (const side of [-1, 1]) {
      const legGeo = new THREE.BoxGeometry(0.5, 1.2, 0.48);
      const leg = new THREE.Mesh(legGeo, darkRed);
      leg.position.set(side * 0.38, -0.05, 0);
      leg.castShadow = true;
      this.group.add(leg);
    }

    const clubGeo = new THREE.BoxGeometry(0.22, 2.0, 0.22);
    const club = new THREE.Mesh(clubGeo, hornMat);
    club.position.set(1.22, 1.2, 0.3);
    club.rotation.z = -0.25;
    club.castShadow = true;
    this.group.add(club);

    const spikeGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const spikeMat = this._mat(0x333333, 0.7, 0.2);
    const spike = new THREE.Mesh(spikeGeo, spikeMat);
    spike.position.set(1.35, 2.25, 0.35);
    spike.scale.y = 1.3;
    this.group.add(spike);

    for (const side of [-1, 1]) {
      const padGeo = new THREE.BoxGeometry(0.35, 0.28, 0.55);
      const pad = new THREE.Mesh(padGeo, goldMat);
      pad.position.set(side * 0.88, 1.85, 0);
      pad.castShadow = true;
      this.group.add(pad);
    }

    this.group.scale.set(2.5, 2.5, 2.5);

    this.auraLight = new THREE.PointLight(0xff2200, 3.0, 12);
    this.auraLight.position.set(0, 2, 0);
    this.group.add(this.auraLight);
  }

  _getPhase() {
    const pct = this.hp / this.maxHp;
    if (pct > 0.5) return 1;
    if (pct > 0.25) return 2;
    return 3;
  }

  update(delta, player, terrainHeightFn, onEventCallback) {
    if (this.isDead) return;

    const playerPos = player.position.clone();
    const myPos = this.group.position;
    const dist = myPos.distanceTo(playerPos);

    const newPhase = this._getPhase();
    if (newPhase > this.phase) {
      this.phase = newPhase;
      this._onPhaseTransition(player);
    }

    if (!this.minionsSummoned && this.hp < this.maxHp * 0.5) {
      this._summonMinions(terrainHeightFn);
      this.minionsSummoned = true;
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.chargeCooldown = Math.max(0, this.chargeCooldown - delta);
    this.stateTimer -= delta;

    this.auraLight.intensity = 2.5 + Math.sin(Date.now() * 0.004) * 1.5;
    if (this.phase === 3) this.auraLight.color.setHex(0xaa00ff);

    const t = Date.now() * 0.002;
    myPos.y = terrainHeightFn(myPos.x, myPos.z) + Math.abs(Math.sin(t * (this.phase === 3 ? 2.5 : 1.5))) * 0.12;

    if (this.state === 'stunned') {
      if (this.stateTimer <= 0) this.state = 'roam';
      return;
    }

    if (this.state === 'roam') {
      const speed = this.phase === 1 ? 3.5 : (this.phase === 2 ? 5.0 : 7.0);
      const dir = new THREE.Vector3().subVectors(playerPos, myPos).normalize();
      myPos.x += dir.x * speed * delta;
      myPos.z += dir.z * speed * delta;
      this.group.lookAt(playerPos.x, myPos.y, playerPos.z);

      if (dist < 6 && this.attackCooldown <= 0) {
        const roll = Math.random();
        if (roll < 0.4 && this.chargeCooldown <= 0) {
          this._startCharge(playerPos);
        } else {
          this._startSlam(player, onEventCallback);
        }
      }

      if (this.phase >= 2 && dist < 10 && this.attackCooldown <= 0 && Math.random() < 0.02) {
        this._doShockwave(player, onEventCallback);
      }
    } else if (this.state === 'charge') {
      const speed = 14 * (this.phase === 3 ? 1.5 : 1.0);
      myPos.x += this.chargeDir.x * speed * delta;
      myPos.z += this.chargeDir.z * speed * delta;
      myPos.y = terrainHeightFn(myPos.x, myPos.z);

      if (this.stateTimer <= 0 || myPos.distanceTo(playerPos) < 2.2) {
        this.state = 'roam';
        if (myPos.distanceTo(playerPos) < 3.5) {
          this._impactDamage(player, 55, onEventCallback);
          this.fx.createSparks(myPos.clone(), 40);
        }
      }
    } else if (this.state === 'slam') {
      if (this.stateTimer <= 0) {
        this.state = 'roam';
        this.attackCooldown = this.phase === 3 ? 1.2 : 2.0;
      }
    }
  }

  _startCharge(targetPos) {
    this.state = 'charge';
    this.chargeDir = new THREE.Vector3().subVectors(targetPos, this.group.position).normalize();
    this.stateTimer = 0.9;
    this.chargeCooldown = 5.0;
    if (this.soundManager) this.soundManager.playBossRoar?.();
  }

  _startSlam(player, onEventCallback) {
    this.state = 'slam';
    this.stateTimer = 0.5;
    this.attackCooldown = this.phase === 3 ? 1.0 : 2.5;
    const dist = this.group.position.distanceTo(player.position);
    if (dist < 5.5) {
      const dmg = this.phase === 1 ? 25 : (this.phase === 2 ? 40 : 55);
      this._impactDamage(player, dmg, onEventCallback);
    }
    this.fx.createSparks(this.group.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 40);
  }

  _doShockwave(player, onEventCallback) {
    this.attackCooldown = 3.0;
    const dist = this.group.position.distanceTo(player.position);
    if (dist < 8) this._impactDamage(player, 30, onEventCallback);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const pos = this.group.position.clone().add(new THREE.Vector3(Math.cos(angle) * 4, 0.5, Math.sin(angle) * 4));
      this.fx.createSparks(pos, 15);
    }
  }

  _impactDamage(player, amount, onEventCallback) {
    if (player.isInvincible || player.isDodging) return;
    if (player.isParrying) {
      onEventCallback?.({ parried: true });
    } else {
      player.takeDamage(amount);
      onEventCallback?.({ damage: amount });
    }
  }

  _onPhaseTransition() {
    if (this.soundManager) this.soundManager.playBossRoar?.();
    this.bodyMesh.material = new THREE.MeshStandardMaterial({
      color: this.phase === 2 ? 0x880000 : 0x550033,
      emissive: this.phase === 2 ? 0x440000 : 0x220011,
      emissiveIntensity: 0.6,
      metalness: 0.2,
      roughness: 0.7
    });
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const pos = this.group.position.clone().add(new THREE.Vector3(Math.cos(angle) * 6, 1, Math.sin(angle) * 6));
      this.fx.createSparks(pos, 30);
    }
  }

  _summonMinions(terrainHeightFn) {
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const offset = new THREE.Vector3(Math.cos(angle) * 6, 0, Math.sin(angle) * 6);
      const spawnPos = this.group.position.clone().add(offset);
      spawnPos.y = terrainHeightFn(spawnPos.x, spawnPos.z);
      this.enemyManager.spawnAt?.(spawnPos, 'BushLurker');
    }
    if (this.soundManager) this.soundManager.playBossRoar?.();
    this.fx.createSparks(this.group.position.clone().add(new THREE.Vector3(0, 3, 0)), 60);
  }

  takeDamage(amount) {
    if (this.isDead) return false;
    this.hp = Math.max(0, this.hp - amount);

    const origEmissive = this.bodyMesh.material.emissiveIntensity;
    this.bodyMesh.material.emissiveIntensity = 1.0;
    setTimeout(() => {
      if (this.bodyMesh?.material) this.bodyMesh.material.emissiveIntensity = origEmissive;
    }, 80);

    const shake = 0.15;
    this.group.position.x += (Math.random() - 0.5) * shake;
    this.group.position.z += (Math.random() - 0.5) * shake;

    if (this.hp <= 0) {
      this._doCinematicDeath();
      return true;
    }
    if (amount >= 40) { this.state = 'stunned'; this.stateTimer = 0.4; }
    return false;
  }

  _doCinematicDeath() {
    this.isDead = true;
    this.deathLoot = { diamond: 5, gold: 20, xp: 500, legendaryBlueprint: true };

    let burst = 0;
    const burstInterval = setInterval(() => {
      if (burst >= 8) {
        clearInterval(burstInterval);
        this.scene.remove(this.group);
        return;
      }
      const offset = new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 4, (Math.random() - 0.5) * 5);
      this.fx.createSparks(this.group.position.clone().add(offset), 50);
      burst++;
    }, 200);
  }

  getDrops() { return this.deathLoot || {}; }
  dispose() { this.scene.remove(this.group); }
}
