import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator.js';
import { AssetBuilder } from './ObjectPool.js';

export class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.terrain = new TerrainGenerator();
    this.chunkSize = 90;
    this.activeChunks = new Map(); // key: 'x,z' -> chunk object
    this.interactiveObjects = [];  // Forageable bushes, ore rocks, shrines
    this.shrines = [];

    this.currentChunkCoord = { x: 0, z: 0 };
  }

  getHeight(x, z) {
    return this.terrain.getHeight(x, z);
  }

  getBiome(x, z) {
    return this.terrain.getBiome(x, z);
  }

  update(playerPos) {
    const cx = Math.floor((playerPos.x + this.chunkSize / 2) / this.chunkSize);
    const cz = Math.floor((playerPos.z + this.chunkSize / 2) / this.chunkSize);

    if (cx !== this.currentChunkCoord.x || cz !== this.currentChunkCoord.z) {
      this.currentChunkCoord.x = cx;
      this.currentChunkCoord.z = cz;
      this.refreshChunks(cx, cz);
    }
  }

  init(initialPlayerPos) {
    const cx = Math.floor((initialPlayerPos.x + this.chunkSize / 2) / this.chunkSize);
    const cz = Math.floor((initialPlayerPos.z + this.chunkSize / 2) / this.chunkSize);
    this.currentChunkCoord = { x: cx, z: cz };
    this.refreshChunks(cx, cz);
  }

  refreshChunks(cx, cz) {
    const radius = 2; // 5x5 chunk grid around player = 450x450m active world
    const neededKeys = new Set();

    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let z = cz - radius; z <= cz + radius; z++) {
        const key = `${x},${z}`;
        neededKeys.add(key);

        if (!this.activeChunks.has(key)) {
          const chunk = this.createChunk(x, z);
          this.activeChunks.set(key, chunk);
        }
      }
    }

    // Unload distant chunks
    for (const [key, chunk] of this.activeChunks.entries()) {
      if (!neededKeys.has(key)) {
        this.destroyChunk(chunk);
        this.activeChunks.delete(key);
      }
    }
  }

  createChunk(cx, cz) {
    const chunkGroup = new THREE.Group();
    const terrainMesh = this.terrain.generateChunkMesh(cx, cz, this.chunkSize, 36);
    chunkGroup.add(terrainMesh);

    const chunkWorldX = cx * this.chunkSize;
    const chunkWorldZ = cz * this.chunkSize;
    const biome = this.terrain.getBiome(chunkWorldX, chunkWorldZ);

    const chunkInteractives = [];

    // Deterministic pseudo-random seed per chunk
    let seed = (cx * 73856093) ^ (cz * 19349663);
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return (seed >>> 0) / 4294967296;
    };

    // 1. Spawning Flora (Bamboo, Sakura, Trees)
    const treeCount = Math.floor(10 + rnd() * 15 * biome.floraDensity);
    for (let i = 0; i < treeCount; i++) {
      const lx = (rnd() - 0.5) * (this.chunkSize - 6);
      const lz = (rnd() - 0.5) * (this.chunkSize - 6);
      const wx = chunkWorldX + lx;
      const wz = chunkWorldZ + lz;
      const wy = this.terrain.getHeight(wx, wz);

      let tree;
      if (biome.id === 'BAMBOO_GROVE' && rnd() < 0.8) {
        tree = AssetBuilder.createBambooStalk();
      } else if (biome.id === 'SACRED_SANCTUARY' && rnd() < 0.7) {
        tree = AssetBuilder.createSakuraTree();
      } else if (biome.id === 'ROCKY_PEAKS') {
        tree = AssetBuilder.createPineTree();
      } else {
        tree = AssetBuilder.createBambooStalk();
      }

      tree.position.set(wx, wy, wz);
      tree.rotation.y = rnd() * Math.PI * 2;
      chunkGroup.add(tree);
    }

    // 2. Ore deposits (Gold, Iron, Diamond)
    const oreCount = Math.floor(3 + rnd() * 5);
    for (let i = 0; i < oreCount; i++) {
      const lx = (rnd() - 0.5) * (this.chunkSize - 10);
      const lz = (rnd() - 0.5) * (this.chunkSize - 10);
      const wx = chunkWorldX + lx;
      const wz = chunkWorldZ + lz;
      const wy = this.terrain.getHeight(wx, wz);

      let oreType = 'iron';
      const oreRoll = rnd();
      if (oreRoll < 0.18) {
        oreType = 'diamond';
      } else if (oreRoll < 0.5) {
        oreType = 'gold';
      }

      const oreMesh = AssetBuilder.createOreDeposit(oreType);
      oreMesh.position.set(wx, wy, wz);
      chunkGroup.add(oreMesh);
      chunkInteractives.push(oreMesh);
      this.interactiveObjects.push(oreMesh);
    }

    // 3. Forage bushes & wild foods (Berries, Mushrooms, Herbs)
    const foodCount = Math.floor(4 + rnd() * 6);
    for (let i = 0; i < foodCount; i++) {
      const lx = (rnd() - 0.5) * (this.chunkSize - 10);
      const lz = (rnd() - 0.5) * (this.chunkSize - 10);
      const wx = chunkWorldX + lx;
      const wz = chunkWorldZ + lz;
      const wy = this.terrain.getHeight(wx, wz);

      const foodRoll = rnd();
      const foodType = foodRoll < 0.4 ? 'berries' : (foodRoll < 0.75 ? 'herb' : 'mushroom');

      const bush = AssetBuilder.createForageBush(foodType);
      bush.position.set(wx, wy, wz);
      chunkGroup.add(bush);
      chunkInteractives.push(bush);
      this.interactiveObjects.push(bush);
    }

    // 4. Tall Grass Ambush patches
    const grassCount = Math.floor(5 + rnd() * 8);
    for (let i = 0; i < grassCount; i++) {
      const lx = (rnd() - 0.5) * (this.chunkSize - 10);
      const lz = (rnd() - 0.5) * (this.chunkSize - 10);
      const wx = chunkWorldX + lx;
      const wz = chunkWorldZ + lz;
      const wy = this.terrain.getHeight(wx, wz);

      const grass = AssetBuilder.createTallGrassPatch();
      grass.position.set(wx, wy, wz);
      chunkGroup.add(grass);
    }

    // 5. Special Landmark: Torii Gate or Sacred Shrine
    if (rnd() < 0.28 || (cx === 0 && cz === 0)) {
      const wx = chunkWorldX + (rnd() - 0.5) * 20;
      const wz = chunkWorldZ + (rnd() - 0.5) * 20;
      const wy = this.terrain.getHeight(wx, wz);

      if (rnd() < 0.5 || (cx === 0 && cz === 0)) {
        const shrine = AssetBuilder.createOutpostShrine();
        shrine.position.set(wx, wy, wz);
        chunkGroup.add(shrine);
        this.shrines.push(shrine);
        chunkInteractives.push(shrine);
        this.interactiveObjects.push(shrine);
      } else {
        const torii = AssetBuilder.createToriiGate();
        torii.position.set(wx, wy, wz);
        torii.rotation.y = rnd() * Math.PI;
        chunkGroup.add(torii);

        const lantern = AssetBuilder.createStoneLantern();
        lantern.position.set(wx + 2.5, wy, wz + 2);
        chunkGroup.add(lantern);
      }
    }

    this.scene.add(chunkGroup);

    return {
      group: chunkGroup,
      terrainMesh,
      interactives: chunkInteractives
    };
  }

  destroyChunk(chunk) {
    this.scene.remove(chunk.group);

    // Clean up interactive items
    for (const obj of chunk.interactives) {
      const idx = this.interactiveObjects.indexOf(obj);
      if (idx !== -1) this.interactiveObjects.splice(idx, 1);
      const sIdx = this.shrines.indexOf(obj);
      if (sIdx !== -1) this.shrines.splice(sIdx, 1);
    }

    chunk.terrainMesh.geometry.dispose();
    chunk.terrainMesh.material.dispose();
  }

  // Find nearest interactive object within radius
  getNearestInteractive(pos, maxDist = 3.5) {
    let nearest = null;
    let minDist = maxDist;

    for (const obj of this.interactiveObjects) {
      if (!obj.parent) continue;
      const dist = pos.distanceTo(obj.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = obj;
      }
    }

    return nearest;
  }
}
