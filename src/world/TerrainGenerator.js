import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { BIOMES } from './BiomeDefinitions.js';

export class TerrainGenerator {
  constructor() {
    this.noise2D = createNoise2D();
    this.biomeNoise = createNoise2D();
  }

  // Returns biome at world (x, z)
  getBiome(x, z) {
    const scale = 0.003;
    const val = this.biomeNoise(x * scale, z * scale);
    if (val < -0.3) {
      return BIOMES.MISTY_GRAVEYARD;
    } else if (val < 0.15) {
      return BIOMES.BAMBOO_GROVE;
    } else if (val < 0.55) {
      return BIOMES.ROCKY_PEAKS;
    } else {
      return BIOMES.SACRED_SANCTUARY;
    }
  }

  // Mathematical continuous height at any world point (x, z)
  getHeight(x, z) {
    const biome = this.getBiome(x, z);

    // Multi-octave Fractal Brownian Motion
    let elevation = 0;
    let freq = 0.008;
    let amp = 1.0;
    let maxAmp = 0;

    for (let i = 0; i < 4; i++) {
      elevation += this.noise2D(x * freq, z * freq) * amp;
      maxAmp += amp;
      freq *= 2.05;
      amp *= 0.48;
    }

    elevation = elevation / maxAmp; // normalized roughly -1 to 1

    // Scale by biome height properties
    let finalHeight = biome.baseHeight + (elevation * biome.heightVariance);

    // Flattens out sanctuary regions for peaceful temples
    if (biome.id === 'SACRED_SANCTUARY') {
      finalHeight = THREE.MathUtils.lerp(finalHeight, 5.0, 0.4);
    }

    return finalHeight;
  }

  // Generates a chunk mesh with vertex colors and normals
  generateChunkMesh(chunkX, chunkZ, chunkSize = 80, segments = 40) {
    const geometry = new THREE.PlaneGeometry(chunkSize, chunkSize, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const worldOffsetX = chunkX * chunkSize;
    const worldOffsetZ = chunkZ * chunkSize;

    const grassColor = new THREE.Color(0x35652a);
    const dirtColor = new THREE.Color(0x544736);
    const rockColor = new THREE.Color(0x4a4d52);
    const stoneColor = new THREE.Color(0x737982);

    const tempColor = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i) + worldOffsetX;
      const vz = pos.getZ(i) + worldOffsetZ;
      const h = this.getHeight(vx, vz);
      pos.setY(i, h);

      // Estimate slope
      const hRight = this.getHeight(vx + 1.0, vz);
      const hForward = this.getHeight(vx, vz + 1.0);
      const slope = Math.sqrt(Math.pow(hRight - h, 2) + Math.pow(hForward - h, 2));

      const biome = this.getBiome(vx, vz);

      // Dynamic vertex coloring
      if (slope > 0.85) {
        // Steep rocky cliff
        tempColor.copy(rockColor).offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
      } else if (slope > 0.45) {
        // Rough hillside dirt/rock mix
        tempColor.copy(dirtColor);
      } else if (h > 18) {
        // High mountain peak
        tempColor.copy(stoneColor);
      } else {
        // Lush biome grass
        tempColor.setHex(biome.grassColor).offsetHSL(0, 0, (Math.random() - 0.5) * 0.04);
      }

      colors[i * 3 + 0] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(worldOffsetX, 0, worldOffsetZ);
    mesh.receiveShadow = true;
    mesh.castShadow = false;

    return mesh;
  }
}
