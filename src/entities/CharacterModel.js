import * as THREE from 'three';

export class CharacterModel {
  constructor() {
    this.group = new THREE.Group();

    // Visual evolutionary stage: 'kid' | 'ronin' | 'samurai'
    this.stage = 'kid';
    this.equippedArmor = 'none'; // 'none' | 'leather' | 'iron' | 'gold' | 'diamond'
    this.weaponType = 'katana';

    // Materials
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xd7a17a, roughness: 0.8 });
    this.hairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    this.clothMat = new THREE.MeshStandardMaterial({ color: 0x2b3844, roughness: 0.7 });
    this.accentMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.6 });
    this.steelMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.85, roughness: 0.2 });
    this.goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.25 });
    this.diamondMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00b0ff,
      emissiveIntensity: 0.4,
      metalness: 0.3,
      roughness: 0.1
    });

    this.joints = {};
    this.armorMeshes = [];

    this.buildCharacter();
  }

  buildCharacter() {
    // Clear existing
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }

    // Root Pelvis / Torso
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.9;
    this.group.add(torsoGroup);
    this.joints.torso = torsoGroup;

    // Torso Mesh (Kimono body)
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.7, 0.3);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.clothMat);
    torsoMesh.castShadow = true;
    torsoGroup.add(torsoMesh);

    // Obi (Belt Sash)
    const obiGeo = new THREE.BoxGeometry(0.58, 0.16, 0.32);
    const obiMesh = new THREE.Mesh(obiGeo, this.accentMat);
    obiMesh.position.y = -0.15;
    torsoGroup.add(obiMesh);

    // Neck & Head
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.55;
    torsoGroup.add(headGroup);
    this.joints.head = headGroup;

    const headGeo = new THREE.BoxGeometry(0.32, 0.34, 0.32);
    const headMesh = new THREE.Mesh(headGeo, this.skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Samurai Topknot Hair
    const hairGeo = new THREE.BoxGeometry(0.34, 0.12, 0.34);
    const hairMesh = new THREE.Mesh(hairGeo, this.hairMat);
    hairMesh.position.y = 0.18;
    headGroup.add(hairMesh);

    const topknotGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.22, 6);
    const topknot = new THREE.Mesh(topknotGeo, this.hairMat);
    topknot.position.set(0, 0.3, -0.08);
    topknot.rotation.x = -0.4;
    headGroup.add(topknot);

    // Limbs - Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.38, 0.28, 0);
    torsoGroup.add(leftArmGroup);
    this.joints.leftArm = leftArmGroup;

    const armGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    const leftArmMesh = new THREE.Mesh(armGeo, this.clothMat);
    leftArmMesh.position.y = -0.25;
    leftArmMesh.castShadow = true;
    leftArmGroup.add(leftArmMesh);

    // Limbs - Right Arm (Main Weapon Arm)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.38, 0.28, 0);
    torsoGroup.add(rightArmGroup);
    this.joints.rightArm = rightArmGroup;

    const rightArmMesh = new THREE.Mesh(armGeo, this.clothMat);
    rightArmMesh.position.y = -0.25;
    rightArmMesh.castShadow = true;
    rightArmGroup.add(rightArmMesh);

    // Right Hand / Weapon Attachment Socket
    const weaponSocket = new THREE.Group();
    weaponSocket.position.set(0, -0.55, 0.05);
    rightArmGroup.add(weaponSocket);
    this.joints.weaponSocket = weaponSocket;

    // Limbs - Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.16, -0.35, 0);
    torsoGroup.add(leftLegGroup);
    this.joints.leftLeg = leftLegGroup;

    const legGeo = new THREE.BoxGeometry(0.2, 0.65, 0.2);
    const leftLegMesh = new THREE.Mesh(legGeo, this.clothMat);
    leftLegMesh.position.y = -0.3;
    leftLegMesh.castShadow = true;
    leftLegGroup.add(leftLegMesh);

    // Limbs - Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.16, -0.35, 0);
    torsoGroup.add(rightLegGroup);
    this.joints.rightLeg = rightLegGroup;

    const rightLegMesh = new THREE.Mesh(legGeo, this.clothMat);
    rightLegMesh.position.y = -0.3;
    rightLegMesh.castShadow = true;
    rightLegGroup.add(rightLegMesh);

    // Weapon: Katana & Scabbard
    this.buildWeapon(weaponSocket, torsoGroup);

    // Matchlock Rifle strapped across back
    this.buildMatchlockRifle(torsoGroup);

    // Shuriken pouch on hip
    this.buildShurikenPouch(torsoGroup);

    // Aiming state
    this.isAiming = false;

    // Apply current stage & armor visual traits
    this.applyStageAndArmor();
  }

  buildWeapon(handSocket, hipGroup) {
    // Scabbard (Saya) on left hip
    const scabbardGeo = new THREE.BoxGeometry(0.08, 0.95, 0.06);
    const scabbardMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
    const scabbard = new THREE.Mesh(scabbardGeo, scabbardMat);
    scabbard.position.set(-0.34, -0.15, 0.05);
    scabbard.rotation.z = -0.35;
    scabbard.rotation.x = 0.2;
    hipGroup.add(scabbard);
    this.scabbard = scabbard;

    // Katana Blade in Hand Socket
    const katanaGroup = new THREE.Group();

    // Hilt / Tsuka
    const hiltGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.32, 8);
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.6 });
    const hilt = new THREE.Mesh(hiltGeo, hiltMat);
    hilt.position.y = 0.1;
    katanaGroup.add(hilt);

    // Tsuba (Guard)
    const tsubaGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.02, 10);
    const tsubaMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
    const tsuba = new THREE.Mesh(tsubaGeo, tsubaMat);
    tsuba.position.y = 0.26;
    katanaGroup.add(tsuba);

    // Steel Blade
    const bladeGeo = new THREE.BoxGeometry(0.035, 1.1, 0.08);
    const blade = new THREE.Mesh(bladeGeo, this.steelMat);
    blade.position.set(0, 0.82, -0.01);
    blade.castShadow = true;
    katanaGroup.add(blade);
    this.bladeMesh = blade;

    // Glowing Katana Aura (for elemental buffs)
    const auraGeo = new THREE.BoxGeometry(0.06, 1.12, 0.12);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.position.copy(blade.position);
    katanaGroup.add(auraMesh);
    this.katanaAura = auraMesh;

    // Default weapon orientation in hand
    katanaGroup.rotation.x = Math.PI / 2;
    katanaGroup.position.set(0, 0, 0.1);
    handSocket.add(katanaGroup);
    this.katana = katanaGroup;
  }

  buildMatchlockRifle(torsoGroup) {
    const rifleGroup = new THREE.Group();

    // Wooden stock
    const stockGeo = new THREE.BoxGeometry(0.08, 0.7, 0.06);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b3a2a, roughness: 0.9 });
    const stock = new THREE.Mesh(stockGeo, woodMat);
    stock.position.y = -0.2;
    rifleGroup.add(stock);

    // Barrel (brass/steel)
    const barrelGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.95, 8);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 });
    const barrel = new THREE.Mesh(barrelGeo, steelMat);
    barrel.position.y = 0.28;
    rifleGroup.add(barrel);

    // Brass lock mechanism
    const lockGeo = new THREE.BoxGeometry(0.05, 0.12, 0.04);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.7, roughness: 0.4 });
    const lock = new THREE.Mesh(lockGeo, brassMat);
    lock.position.set(0.06, 0.05, 0);
    rifleGroup.add(lock);

    // Strap to back diagonally
    rifleGroup.position.set(-0.28, 0.1, -0.22);
    rifleGroup.rotation.set(0.3, 0.1, -0.5); // diagonal across back
    torsoGroup.add(rifleGroup);
    this.matchlockRifle = rifleGroup;
  }

  buildShurikenPouch(torsoGroup) {
    const pouchGeo = new THREE.BoxGeometry(0.12, 0.1, 0.06);
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
    const pouch = new THREE.Mesh(pouchGeo, leatherMat);
    pouch.position.set(0.28, -0.25, 0.1);
    pouch.castShadow = true;
    torsoGroup.add(pouch);
    this.shurikenPouch = pouch;
  }

  setAiming(bool) {
    this.isAiming = bool;
    if (!this.matchlockRifle) return;
    if (bool) {
      // Bring rifle to 2-handed aiming position
      this.matchlockRifle.position.set(0.05, 0.4, 0.35);
      this.matchlockRifle.rotation.set(Math.PI / 2, 0, 0);
      // Lower katana
      if (this.katana) this.katana.visible = false;
    } else {
      // Back to strapped position
      this.matchlockRifle.position.set(-0.28, 0.1, -0.22);
      this.matchlockRifle.rotation.set(0.3, 0.1, -0.5);
      if (this.katana) this.katana.visible = true;
    }
  }

  setElementalAura(colorHex, opacity = 0.7) {
    if (!this.katanaAura) return;
    this.katanaAura.material.color.setHex(colorHex);
    this.katanaAura.material.opacity = opacity;
  }

  setStage(stage) {
    this.stage = stage; // 'kid' | 'ronin' | 'samurai'
    this.applyStageAndArmor();
  }

  setArmor(armorType) {
    this.equippedArmor = armorType; // 'leather' | 'iron' | 'gold' | 'diamond'
    this.applyStageAndArmor();
  }

  applyStageAndArmor() {
    // Clear old armor meshes
    this.armorMeshes.forEach(m => {
      if (m.parent) m.parent.remove(m);
    });
    this.armorMeshes = [];

    // Scale adjustments for age/growth
    if (this.stage === 'kid') {
      this.group.scale.set(0.78, 0.78, 0.78);
      this.clothMat.color.setHex(0x6d4c41); // rustic brown peasant tunic
    } else if (this.stage === 'ronin') {
      this.group.scale.set(0.95, 0.95, 0.95);
      this.clothMat.color.setHex(0x212121); // black ronin haori
    } else if (this.stage === 'samurai') {
      this.group.scale.set(1.05, 1.05, 1.05);
      this.clothMat.color.setHex(0x1a237e); // deep indigo lord kimono
    }

    // Determine armor material
    let armorMat = null;
    if (this.equippedArmor === 'leather') {
      armorMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    } else if (this.equippedArmor === 'iron') {
      armorMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8, roughness: 0.3 });
    } else if (this.equippedArmor === 'gold') {
      armorMat = this.goldMat;
    } else if (this.equippedArmor === 'diamond') {
      armorMat = this.diamondMat;
    }

    // Attach 3D armor plates if armor is equipped or stage is samurai
    if (armorMat || this.stage === 'samurai') {
      const activeMat = armorMat || new THREE.MeshStandardMaterial({ color: 0xb71c1c, metalness: 0.6, roughness: 0.4 });

      // 1. Sode (Shoulder Armor Plates)
      const sodeGeo = new THREE.BoxGeometry(0.24, 0.35, 0.08);
      const leftSode = new THREE.Mesh(sodeGeo, activeMat);
      leftSode.position.set(-0.12, -0.15, 0);
      leftSode.castShadow = true;
      this.joints.leftArm.add(leftSode);
      this.armorMeshes.push(leftSode);

      const rightSode = new THREE.Mesh(sodeGeo, activeMat);
      rightSode.position.set(0.12, -0.15, 0);
      rightSode.castShadow = true;
      this.joints.rightArm.add(rightSode);
      this.armorMeshes.push(rightSode);

      // 2. Do (Chestplate / Cuirass)
      const doGeo = new THREE.BoxGeometry(0.6, 0.45, 0.34);
      const doMesh = new THREE.Mesh(doGeo, activeMat);
      doMesh.position.y = 0.05;
      doMesh.castShadow = true;
      this.joints.torso.add(doMesh);
      this.armorMeshes.push(doMesh);

      // 3. Kabuto Helmet (if Samurai stage or high armor)
      if (this.stage === 'samurai' || this.equippedArmor === 'gold' || this.equippedArmor === 'diamond') {
        const kabutoGeo = new THREE.BoxGeometry(0.42, 0.22, 0.42);
        const kabuto = new THREE.Mesh(kabutoGeo, activeMat);
        kabuto.position.y = 0.2;
        kabuto.castShadow = true;
        this.joints.head.add(kabuto);
        this.armorMeshes.push(kabuto);

        // Golden Crescent Moon (Maedate crest)
        const moonGeo = new THREE.TorusGeometry(0.18, 0.03, 6, 12, Math.PI);
        const moon = new THREE.Mesh(moonGeo, this.goldMat);
        moon.position.set(0, 0.26, 0.22);
        moon.rotation.x = Math.PI / 2;
        this.joints.head.add(moon);
        this.armorMeshes.push(moon);
      }
    }
  }
}
