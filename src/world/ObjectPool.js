import * as THREE from 'three';

export class AssetBuilder {
  static createToriiGate() {
    const group = new THREE.Group();
    const vermilionMat = new THREE.MeshStandardMaterial({
      color: 0xb71c1c,
      roughness: 0.6,
      metalness: 0.1
    });
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
      metalness: 0.2
    });

    // Two main pillars
    const pillarGeo = new THREE.CylinderGeometry(0.35, 0.45, 7.5, 12);
    const p1 = new THREE.Mesh(pillarGeo, vermilionMat);
    p1.position.set(-3.2, 3.75, 0);
    p1.castShadow = true;
    p1.receiveShadow = true;

    const p2 = new THREE.Mesh(pillarGeo, vermilionMat);
    p2.position.set(3.2, 3.75, 0);
    p2.castShadow = true;
    p2.receiveShadow = true;
    group.add(p1, p2);

    // Kasagi (top curved horizontal beam)
    const topBeamGeo = new THREE.BoxGeometry(9.0, 0.55, 0.8);
    const topBeam = new THREE.Mesh(topBeamGeo, blackMat);
    topBeam.position.set(0, 7.4, 0);
    topBeam.castShadow = true;
    group.add(topBeam);

    // Nuki (secondary horizontal beam)
    const nukiGeo = new THREE.BoxGeometry(7.8, 0.4, 0.5);
    const nuki = new THREE.Mesh(nukiGeo, vermilionMat);
    nuki.position.set(0, 6.2, 0);
    nuki.castShadow = true;
    group.add(nuki);

    return group;
  }

  static createBambooStalk() {
    const group = new THREE.Group();
    const height = 8.0 + Math.random() * 5.0;
    const radius = 0.14 + Math.random() * 0.08;

    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x43a047,
      roughness: 0.5,
      metalness: 0.1
    });

    const stemGeo = new THREE.CylinderGeometry(radius * 0.8, radius, height, 8);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = height / 2;
    stem.castShadow = true;
    stem.receiveShadow = true;
    group.add(stem);

    // Leaf cluster near top
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x66bb6a,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 4; i++) {
      const leafGeo = new THREE.ConeGeometry(0.6, 1.8, 4);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(
        (Math.random() - 0.5) * 0.8,
        height * 0.7 + i * 0.8,
        (Math.random() - 0.5) * 0.8
      );
      leaf.rotation.z = (Math.random() - 0.5) * 0.8;
      leaf.rotation.x = (Math.random() - 0.5) * 0.8;
      group.add(leaf);
    }

    return group;
  }

  static createSakuraTree() {
    const group = new THREE.Group();

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.9,
      metalness: 0.05
    });
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.85, 6, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Blossom Canopy (clouds of pink blossoms)
    const blossomMat = new THREE.MeshStandardMaterial({
      color: 0xf48fb1,
      roughness: 0.7,
      metalness: 0.05
    });

    const canopyPuffs = [
      { x: 0, y: 6.2, z: 0, r: 2.8 },
      { x: 1.8, y: 5.8, z: 0.8, r: 2.1 },
      { x: -1.7, y: 6.0, z: -0.9, r: 2.2 },
      { x: 0.6, y: 7.2, z: -1.2, r: 1.9 }
    ];

    canopyPuffs.forEach(puff => {
      const puffGeo = new THREE.DodecahedronGeometry(puff.r, 1);
      const puffMesh = new THREE.Mesh(puffGeo, blossomMat);
      puffMesh.position.set(puff.x, puff.y, puff.z);
      puffMesh.castShadow = true;
      group.add(puffMesh);
    });

    return group;
  }

  static createPineTree() {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.8 });
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 5, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    group.add(trunk);
    const foliageGeo = new THREE.ConeGeometry(2.5, 5, 8);
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 5.5;
    foliage.castShadow = true;
    group.add(foliage);
    return group;
  }

  static createStoneLantern() {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x616161,
      roughness: 0.85
    });

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.4, 6), stoneMat);
    base.position.y = 0.2;
    // Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.4, 6), stoneMat);
    shaft.position.y = 1.1;
    // Light Box (Hibukuro)
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), stoneMat);
    box.position.y = 2.1;
    // Roof (Kasa)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 6), stoneMat);
    roof.position.y = 2.7;

    // Interior flame light
    const flameLight = new THREE.PointLight(0xffa726, 1.2, 10);
    flameLight.position.y = 2.1;

    group.add(base, shaft, box, roof, flameLight);
    group.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    return group;
  }

  static createOreDeposit(type = 'iron') {
    const group = new THREE.Group();
    const baseRockMat = new THREE.MeshStandardMaterial({
      color: 0x424242,
      roughness: 0.9
    });

    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), baseRockMat);
    rock.scale.set(1.2, 0.8, 1.1);
    group.add(rock);

    // Glowing mineral veins
    let crystalColor = 0xb0bec5;
    let emissiveColor = 0x222222;
    let metalness = 0.5;
    let roughness = 0.4;

    if (type === 'gold') {
      crystalColor = 0xffd700;
      emissiveColor = 0xffa000;
      metalness = 0.9;
      roughness = 0.2;
    } else if (type === 'diamond') {
      crystalColor = 0x00e5ff;
      emissiveColor = 0x00b0ff;
      metalness = 0.3;
      roughness = 0.1;
    }

    const crystalMat = new THREE.MeshStandardMaterial({
      color: crystalColor,
      emissive: emissiveColor,
      emissiveIntensity: 0.3,
      metalness,
      roughness
    });

    for (let i = 0; i < 5; i++) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 5), crystalMat);
      crystal.position.set(
        (Math.random() - 0.5) * 0.9,
        0.3 + Math.random() * 0.4,
        (Math.random() - 0.5) * 0.9
      );
      crystal.rotation.x = (Math.random() - 0.5) * 1.2;
      crystal.rotation.z = (Math.random() - 0.5) * 1.2;
      group.add(crystal);
    }

    group.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    group.userData = { type, oreType: type, isMineable: true, hp: 3 };
    return group;
  }

  static createForageBush(type = 'berries') {
    const group = new THREE.Group();

    // Bush foliage
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.8
    });
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), foliageMat);
    foliage.scale.set(1.3, 0.9, 1.3);
    foliage.position.y = 0.5;
    group.add(foliage);

    // Food fruits / mushrooms
    let fruitColor = 0xd32f2f; // red berries
    if (type === 'mushroom') fruitColor = 0x8d6e63;
    if (type === 'herb') fruitColor = 0x76ff03;

    const fruitMat = new THREE.MeshStandardMaterial({
      color: fruitColor,
      roughness: 0.5
    });

    for (let i = 0; i < 6; i++) {
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), fruitMat);
      fruit.position.set(
        (Math.random() - 0.5) * 1.1,
        0.5 + Math.random() * 0.4,
        (Math.random() - 0.5) * 1.1
      );
      group.add(fruit);
    }

    group.userData = { type, isForageable: true };
    return group;
  }

  static createTallGrassPatch() {
    const group = new THREE.Group();
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x33691e,
      roughness: 0.7,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 15; i++) {
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 1.6), grassMat);
      blade.position.set((Math.random() - 0.5) * 1.8, 0.8, (Math.random() - 0.5) * 1.8);
      blade.rotation.y = Math.random() * Math.PI;
      blade.rotation.z = (Math.random() - 0.5) * 0.3;
      group.add(blade);
    }

    group.userData = { isHidingSpot: true };
    return group;
  }

  static createOutpostShrine() {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.6 });

    // Wooden deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 6), woodMat);
    deck.position.y = 0.25;
    group.add(deck);

    // 4 Corner pillars
    for (let x of [-2.4, 2.4]) {
      for (let z of [-2.4, 2.4]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.5), woodMat);
        pillar.position.set(x, 2.0, z);
        group.add(pillar);
      }
    }

    // Curved Pagoda Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 1.8, 4), roofMat);
    roof.position.y = 4.4;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    // Inner sacred altar
    const altar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.8), woodMat);
    altar.position.set(0, 1.0, 0);
    group.add(altar);

    // Sacred relic crystal on altar
    const relic = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35),
      new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00b0ff,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1
      })
    );
    relic.position.set(0, 1.7, 0);
    group.add(relic);

    const relicLight = new THREE.PointLight(0x00e5ff, 2.0, 8);
    relicLight.position.set(0, 1.7, 0);
    group.add(relicLight);

    group.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    group.userData = { isRelicShrine: true, relicActive: true };
    return group;
  }
}
