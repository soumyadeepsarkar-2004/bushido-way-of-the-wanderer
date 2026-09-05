import * as THREE from 'three';

export class WeatherSystem {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.currentWeather = 'cherryBlossoms';
    this.weatherTimer = 0;
    this.lightningTimer = 2 + Math.random() * 5;
    this.mist = null;
    this.rain = null;
    this.petals = null;
    this.lightning = null;

    this.initSakuraPetals();
    this.initRain();
    this.initLightningLight();
    this.initMist();
  }

  initSakuraPetals() {
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const rotations = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 25 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      rotations[i * 3 + 0] = Math.random() * Math.PI;
      rotations[i * 3 + 1] = Math.random() * Math.PI;
      rotations[i * 3 + 2] = Math.random() * Math.PI;

      scales[i] = 0.12 + Math.random() * 0.15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom petal canvas texture
    const petalCanvas = document.createElement('canvas');
    petalCanvas.width = 64;
    petalCanvas.height = 64;
    const ctx = petalCanvas.getContext('2d');
    ctx.fillStyle = '#ffb7c5';
    ctx.beginPath();
    ctx.ellipse(32, 32, 24, 12, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8da1';
    ctx.beginPath();
    ctx.ellipse(28, 28, 16, 8, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    const petalTexture = new THREE.CanvasTexture(petalCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.35,
      map: petalTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.petals = new THREE.Points(geometry, material);
    this.scene.add(this.petals);
  }

  initRain() {
    const count = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 70;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x90caf9,
      size: 0.15,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });

    this.rain = new THREE.Points(geometry, material);
    this.rain.visible = false;
    this.scene.add(this.rain);
  }

  initLightningLight() {
    this.lightning = new THREE.DirectionalLight(0xdbeafe, 0);
    this.lightning.position.set(0, 100, 0);
    this.scene.add(this.lightning);
  }

  initMist() {
    const count = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 15 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mistMat = new THREE.PointsMaterial({
      color: 0x8899aa,
      size: 1.2,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.mist = new THREE.Points(geometry, mistMat);
    this.mist.visible = false;
    this.scene.add(this.mist);
  }

  update(delta, playerPos, biome = null) {
    this.weatherTimer += delta;
    // Cycle weather occasionally
    if (this.weatherTimer > 180) {
      this.weatherTimer = 0;
      const weathers = ['cherryBlossoms', 'rain', 'mist', 'clear'];
      this.currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
      this.rain.visible = this.currentWeather === 'rain';
      this.mist.visible = this.currentWeather === 'mist';
    }

    // Apply combined biome + weather fog
    const fogColor = biome ? biome.fogColor : 0x0b101d;
    const fogDensity = 0.008;
    if (this.currentWeather === 'mist') {
      this.renderer.setFogColor(fogColor, 0.015);
    } else if (this.currentWeather === 'clear') {
      this.renderer.setFogColor(fogColor, 0.003);
    } else {
      this.renderer.setFogColor(fogColor, fogDensity);
    }

    // Follow player smoothly
    this.petals.position.x = playerPos.x;
    this.petals.position.z = playerPos.z;

    const petalPos = this.petals.geometry.attributes.position.array;
    const time = this.weatherTimer * 0.001;
    for (let i = 0; i < petalPos.length / 3; i++) {
      petalPos[i * 3 + 0] += Math.sin(time + i * 0.7) * delta * 2.5 + delta * 1.5;
      petalPos[i * 3 + 1] -= delta * (1.2 + (i % 5) * 0.2);
      petalPos[i * 3 + 2] += Math.cos(time * 1.2 + i * 0.5) * delta * 1.8;

      if (petalPos[i * 3 + 1] < 0) {
        petalPos[i * 3 + 1] = 25;
        petalPos[i * 3 + 0] = (Math.random() - 0.5) * 60;
        petalPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      }
    }
    this.petals.geometry.attributes.position.needsUpdate = true;

    // Rain simulation
    if (this.rain.visible) {
      this.rain.position.x = playerPos.x;
      this.rain.position.z = playerPos.z;
      const rainPos = this.rain.geometry.attributes.position.array;
      for (let i = 0; i < rainPos.length / 3; i++) {
        rainPos[i * 3 + 1] -= delta * 35.0;
        if (rainPos[i * 3 + 1] < 0) {
          rainPos[i * 3 + 1] = 40;
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true;

      // Random lightning flash
      this.lightningTimer -= delta;
      if (this.lightningTimer <= 0) {
        if (Math.random() < 0.015) {
          this.lightning.intensity = 3.5;
          this.lightningTimer = 0.12;
        } else {
          this.lightning.intensity = 0;
        }
      } else {
        this.lightning.intensity *= 0.85;
      }
    }

    // Mist simulation
    if (this.mist.visible) {
      this.mist.position.x = playerPos.x;
      this.mist.position.z = playerPos.z;
      const mistPos = this.mist.geometry.attributes.position.array;
      const mistTime = this.weatherTimer * 0.001;
      for (let i = 0; i < mistPos.length / 3; i++) {
        mistPos[i * 3 + 0] += Math.sin(mistTime * 0.5 + i * 0.7) * delta * 0.5;
        mistPos[i * 3 + 1] += Math.sin(mistTime * 0.3 + i * 0.5) * delta * 0.15;
        mistPos[i * 3 + 2] += Math.cos(mistTime * 0.4 + i * 0.5) * delta * 0.3;
        if (mistPos[i * 3 + 1] > 15) mistPos[i * 3 + 1] = 0.5;
        if (mistPos[i * 3 + 0] > 40) mistPos[i * 3 + 0] = -40;
        if (mistPos[i * 3 + 0] < -40) mistPos[i * 3 + 0] = 40;
      }
      this.mist.geometry.attributes.position.needsUpdate = true;
      const targetOpacity = 0.4;
      this.mist.material.opacity += (targetOpacity - this.mist.material.opacity) * delta * 0.5;
    } else {
      this.mist.material.opacity += (0.0 - this.mist.material.opacity) * delta * 0.5;
    }
  }
}
