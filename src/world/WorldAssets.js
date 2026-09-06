import * as THREE from 'three';

const std = (color, roughness, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const stdEmit = (color, emissive, emissiveIntensity, metalness, roughness) =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, metalness, roughness });

// Shared geometries & materials — created once, live for the whole session, never disposed.
export const G = {
  bambooStem: new THREE.CylinderGeometry(0.1, 0.14, 10, 8),
  bambooLeaf: new THREE.ConeGeometry(0.6, 1.8, 4),
  sakuraTrunk: new THREE.CylinderGeometry(0.5, 0.85, 6, 8),
  sakuraPuff: new THREE.DodecahedronGeometry(1, 1),
  pineTrunk: new THREE.CylinderGeometry(0.4, 0.6, 5, 8),
  pineFoliage: new THREE.ConeGeometry(2.5, 5, 8),
  grassBlade: new THREE.PlaneGeometry(0.15, 1.6),
  rock: new THREE.DodecahedronGeometry(0.8, 1),
  crystal: new THREE.ConeGeometry(0.15, 0.6, 5),
  bushFoliage: new THREE.DodecahedronGeometry(0.7, 1),
  fruit: new THREE.SphereGeometry(0.12, 6, 6),
  toriiPillar: new THREE.CylinderGeometry(0.35, 0.45, 7.5, 12),
  toriiBeam: new THREE.BoxGeometry(9.0, 0.55, 0.8),
  toriiNuki: new THREE.BoxGeometry(7.8, 0.4, 0.5),
  lanternBase: new THREE.CylinderGeometry(0.6, 0.7, 0.4, 6),
  lanternShaft: new THREE.CylinderGeometry(0.25, 0.3, 1.4, 6),
  lanternBox: new THREE.BoxGeometry(0.7, 0.6, 0.7),
  lanternRoof: new THREE.ConeGeometry(1.1, 0.6, 6),
  shrineDeck: new THREE.BoxGeometry(6, 0.5, 6),
  shrinePillar: new THREE.CylinderGeometry(0.2, 0.2, 3.5),
  shrineRoof: new THREE.ConeGeometry(5.2, 1.8, 4),
  shrineAltar: new THREE.BoxGeometry(1.4, 1.0, 0.8),
  relic: new THREE.OctahedronGeometry(0.35)
};

export const M = {
  bambooStem: std(0x43a047, 0.5, 0.1),
  bambooLeaf: new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.6, side: THREE.DoubleSide }),
  sakuraTrunk: std(0x3e2723, 0.9, 0.05),
  sakuraBlossom: std(0xf48fb1, 0.7, 0.05),
  pineTrunk: std(0x3e2723, 0.9),
  pineFoliage: std(0x1b5e20, 0.8),
  grass: new THREE.MeshStandardMaterial({ color: 0x33691e, roughness: 0.7, side: THREE.DoubleSide }),
  rock: std(0x424242, 0.9),
  crystalIron: stdEmit(0xb0bec5, 0x222222, 0.3, 0.5, 0.4),
  crystalGold: stdEmit(0xffd700, 0xffa000, 0.3, 0.9, 0.2),
  crystalDiamond: stdEmit(0x00e5ff, 0x00b0ff, 0.3, 0.3, 0.1),
  bushFoliage: std(0x2e7d32, 0.8),
  berry: std(0xd32f2f, 0.5),
  mushroom: std(0x8d6e63, 0.5),
  herb: std(0x76ff03, 0.5),
  vermilion: std(0xb71c1c, 0.6, 0.1),
  black: std(0x1a1a1a, 0.5, 0.2),
  stone: std(0x616161, 0.85),
  wood: std(0x4e342e, 0.7),
  shrineRoof: std(0x1b1b1b, 0.6),
  relic: new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00b0ff, emissiveIntensity: 0.8, metalness: 0.9, roughness: 0.1 })
};

const dummy = new THREE.Object3D();

// Build one InstancedMesh from a list of {x, y, z, sx?, sy?, sz?, rx?, ry?, rz?} transforms.
function buildInstanced(geometry, material, transforms, chunkCenter) {
  if (!transforms.length) return null;
  const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
  for (let i = 0; i < transforms.length; i++) {
    const t = transforms[i];
    dummy.position.set(t.x, t.y, t.z);
    dummy.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0);
    dummy.scale.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.boundingSphere = new THREE.Sphere(chunkCenter, 68);
  return mesh;
}

export class WorldAssets {
  static buildInstanced(geometry, material, transforms, chunkCenter) {
    return buildInstanced(geometry, material, transforms, chunkCenter);
  }

  static createOreDeposit(type = 'iron', rnd = Math.random) {
    const group = new THREE.Group();
    const rock = new THREE.Mesh(G.rock, M.rock);
    rock.scale.set(1.2, 0.8, 1.1);
    group.add(rock);

    const crystalMat = type === 'gold' ? M.crystalGold : (type === 'diamond' ? M.crystalDiamond : M.crystalIron);
    for (let i = 0; i < 5; i++) {
      const crystal = new THREE.Mesh(G.crystal, crystalMat);
      crystal.position.set((rnd() - 0.5) * 0.9, 0.3 + rnd() * 0.4, (rnd() - 0.5) * 0.9);
      crystal.rotation.x = (rnd() - 0.5) * 1.2;
      crystal.rotation.z = (rnd() - 0.5) * 1.2;
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

  static createForageBush(type = 'berries', rnd = Math.random) {
    const group = new THREE.Group();
    const foliage = new THREE.Mesh(G.bushFoliage, M.bushFoliage);
    foliage.scale.set(1.3, 0.9, 1.3);
    foliage.position.y = 0.5;
    group.add(foliage);

    const fruitMat = type === 'mushroom' ? M.mushroom : (type === 'herb' ? M.herb : M.berry);
    for (let i = 0; i < 6; i++) {
      const fruit = new THREE.Mesh(G.fruit, fruitMat);
      fruit.position.set((rnd() - 0.5) * 1.1, 0.5 + rnd() * 0.4, (rnd() - 0.5) * 1.1);
      group.add(fruit);
    }

    group.userData = { type, isForageable: true };
    return group;
  }

  static createToriiGate() {
    const group = new THREE.Group();
    const p1 = new THREE.Mesh(G.toriiPillar, M.vermilion);
    p1.position.set(-3.2, 3.75, 0);
    const p2 = new THREE.Mesh(G.toriiPillar, M.vermilion);
    p2.position.set(3.2, 3.75, 0);
    const top = new THREE.Mesh(G.toriiBeam, M.black);
    top.position.set(0, 7.4, 0);
    const nuki = new THREE.Mesh(G.toriiNuki, M.vermilion);
    nuki.position.set(0, 6.2, 0);
    [p1, p2, top, nuki].forEach(m => {
      m.castShadow = true;
      m.receiveShadow = true;
    });
    group.add(p1, p2, top, nuki);
    return group;
  }

  static createStoneLantern() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(G.lanternBase, M.stone);
    base.position.y = 0.2;
    const shaft = new THREE.Mesh(G.lanternShaft, M.stone);
    shaft.position.y = 1.1;
    const box = new THREE.Mesh(G.lanternBox, M.stone);
    box.position.y = 2.1;
    const roof = new THREE.Mesh(G.lanternRoof, M.stone);
    roof.position.y = 2.7;
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

  static createOutpostShrine() {
    const group = new THREE.Group();
    const deck = new THREE.Mesh(G.shrineDeck, M.wood);
    deck.position.y = 0.25;
    group.add(deck);

    for (const x of [-2.4, 2.4]) {
      for (const z of [-2.4, 2.4]) {
        const pillar = new THREE.Mesh(G.shrinePillar, M.wood);
        pillar.position.set(x, 2.0, z);
        group.add(pillar);
      }
    }

    const roof = new THREE.Mesh(G.shrineRoof, M.shrineRoof);
    roof.position.y = 4.4;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    const altar = new THREE.Mesh(G.shrineAltar, M.wood);
    altar.position.set(0, 1.0, 0);
    group.add(altar);

    const relic = new THREE.Mesh(G.relic, M.relic);
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