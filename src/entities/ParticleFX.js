import * as THREE from 'three';

export class ParticleFX {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 300;
  }

  _ensureCapacity() {
    while (this.particles.length > this.maxParticles) {
      const oldest = this.particles.shift();
      this.scene.remove(oldest.mesh);
      oldest.mesh.geometry?.dispose();
      oldest.material?.dispose();
    }
  }

  // Katana Slash Arc Wave
  createSlashArc(position, rotation, colorHex = 0xffffff, scale = 1.0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.copy(rotation);

    // Torus slice representing glowing blade trail
    const arcGeo = new THREE.TorusGeometry(1.4 * scale, 0.08 * scale, 8, 24, Math.PI * 0.75);
    const arcMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const arcMesh = new THREE.Mesh(arcGeo, arcMat);
    arcMesh.rotation.x = Math.PI / 2;
    group.add(arcMesh);

    this.scene.add(group);

    this.particles.push({
      mesh: group,
      material: arcMat,
      type: 'slash',
      life: 0.22,
      maxLife: 0.22,
      scaleSpeed: 3.5
    });
  }

  // Metal Parry Spark Shower
  createSparks(position, count = 25) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 8.0,
          Math.random() * 6.0 + 2.0,
          (Math.random() - 0.5) * 8.0
        )
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.18,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const pSystem = new THREE.Points(geometry, material);
    this.scene.add(pSystem);

    this.particles.push({
      mesh: pSystem,
      material,
      velocities,
      type: 'sparks',
      life: 0.45,
      maxLife: 0.45
    });
  }

  // Blood Splatter on Solid Hit
  createBloodSplatter(position, count = 18) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 5.0,
          Math.random() * 4.0 + 1.0,
          (Math.random() - 0.5) * 5.0
        )
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x8b0000,
      size: 0.22,
      transparent: true,
      opacity: 0.95
    });

    const pSystem = new THREE.Points(geometry, material);
    this.scene.add(pSystem);

    this.particles.push({
      mesh: pSystem,
      material,
      velocities,
      type: 'blood',
      life: 0.4,
      maxLife: 0.4
    });
  }

  // Spirit Dissipation Smoke (when ghost/demon is banished)
  createSpiritSmoke(position, count = 20, color = 0x00e5ff) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = position.x + (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.8;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2.0,
          Math.random() * 3.5 + 1.5,
          (Math.random() - 0.5) * 2.0
        )
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const pSystem = new THREE.Points(geometry, material);
    this.scene.add(pSystem);

    this.particles.push({
      mesh: pSystem,
      material,
      velocities,
      type: 'spirit',
      life: 0.7,
      maxLife: 0.7
    });
  }

  // Sprint / Slide Dust Cloud
  createDustPuff(position) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(8 * 3);
    const velocities = [];

    for (let i = 0; i < 8; i++) {
      positions[i * 3 + 0] = position.x + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = position.y + 0.1;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.4;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2.0,
          Math.random() * 1.5 + 0.5,
          (Math.random() - 0.5) * 2.0
        )
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x8d6e63,
      size: 0.25,
      transparent: true,
      opacity: 0.6
    });

    const pSystem = new THREE.Points(geometry, material);
    this.scene.add(pSystem);

    this.particles.push({
      mesh: pSystem,
      material,
      velocities,
      type: 'dust',
      life: 0.35,
      maxLife: 0.35
    });
  }

  // Gunpowder Muzzle Blast (Smoke plume + flash)
  createMuzzleBlast(position, direction) {
    const count = 18;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      const spread = 0.4;
      const v = direction.clone()
        .add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread))
        .normalize()
        .multiplyScalar(6.0 + Math.random() * 5.0);

      velocities.push(v);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xeeeeee,
      size: 0.45,
      transparent: true,
      opacity: 0.9
    });

    const pSystem = new THREE.Points(geometry, material);
    this.scene.add(pSystem);

    this.particles.push({
      mesh: pSystem,
      material,
      velocities,
      type: 'smoke',
      life: 0.5,
      maxLife: 0.5
    });
  }

  // Blood Pool Decal on Ground
  createGroundBloodPool(position) {
    const geo = new THREE.CircleGeometry(0.8 + Math.random() * 0.5, 12);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x5a0000,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const pool = new THREE.Mesh(geo, mat);
    pool.position.copy(position);
    pool.position.y += 0.03;
    this.scene.add(pool);

    this.particles.push({
      mesh: pool,
      material: mat,
      type: 'bloodPool',
      life: 15.0,
      maxLife: 15.0
    });
  }

  // Spirit Talisman Burst
  createTalismanBurst(position) {
    const count = 25;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6.0,
          Math.random() * 5.0 + 1.0,
          (Math.random() - 0.5) * 6.0
        )
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.3,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const pSystem = new THREE.Points(geometry, material);
    this.scene.add(pSystem);

    this.particles.push({
      mesh: pSystem,
      material,
      velocities,
      type: 'talisman',
      life: 0.6,
      maxLife: 0.6
    });
  }

  update(delta) {
    this._ensureCapacity();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry?.dispose();
        p.material?.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      const lifeRatio = p.life / p.maxLife;

      if (p.type === 'slash') {
        p.material.opacity = lifeRatio;
        p.mesh.scale.addScalar(delta * p.scaleSpeed);
      } else if (p.type === 'bloodPool') {
        // Flat pool — just fade out, no movement
        p.material.opacity = lifeRatio * 0.6;
      } else if (p.type === 'smoke') {
        p.material.opacity = lifeRatio * 0.5;
        if (p.velocities) {
          const posArray = p.mesh.geometry.attributes.position.array;
          for (let j = 0; j < p.velocities.length; j++) {
            const vel = p.velocities[j];
            posArray[j * 3 + 0] += vel.x * delta;
            posArray[j * 3 + 1] += vel.y * delta;
            posArray[j * 3 + 2] += vel.z * delta;
          }
          p.mesh.geometry.attributes.position.needsUpdate = true;
        }
      } else if (p.type === 'talisman') {
        p.material.opacity = lifeRatio;
        if (p.velocities) {
          const posArray = p.mesh.geometry.attributes.position.array;
          for (let j = 0; j < p.velocities.length; j++) {
            const vel = p.velocities[j];
            posArray[j * 3 + 0] += vel.x * delta;
            posArray[j * 3 + 1] += vel.y * delta;
            posArray[j * 3 + 2] += vel.z * delta;
            vel.y += 0.5 * delta; // slow upward drift
          }
          p.mesh.geometry.attributes.position.needsUpdate = true;
        }
      } else if (p.velocities) {
        p.material.opacity = lifeRatio;
        const posArray = p.mesh.geometry.attributes.position.array;

        for (let j = 0; j < p.velocities.length; j++) {
          const vel = p.velocities[j];
          posArray[j * 3 + 0] += vel.x * delta;
          posArray[j * 3 + 1] += vel.y * delta;
          posArray[j * 3 + 2] += vel.z * delta;

          // Apply gravity
          vel.y -= 9.8 * delta * (p.type === 'sparks' || p.type === 'blood' ? 1.5 : 0.2);
        }

        p.mesh.geometry.attributes.position.needsUpdate = true;
      }

    }
  }
}
