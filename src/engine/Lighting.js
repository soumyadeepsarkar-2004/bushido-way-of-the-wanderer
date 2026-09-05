import * as THREE from 'three';

export class LightingManager {
  constructor(scene) {
    this.scene = scene;

    // Time of day in radians (0 = dawn, PI/2 = noon, PI = sunset, 3PI/2 = midnight)
    this.timeOfDay = Math.PI * 0.35; // start at golden morning
    this.daySpeed = 0.015; // smooth passage of time

    // Hemisphere light (ambient bounce)
    this.hemiLight = new THREE.HemisphereLight(0xfff4e5, 0x1f2937, 0.6);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Directional celestial body (Sun / Moon)
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 250;
    this.sunLight.shadow.bias = -0.0004;

    const d = 45;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Soft moonlight
    this.moonLight = new THREE.DirectionalLight(0x7fa1ff, 0.4);
    this.scene.add(this.moonLight);
  }

  update(delta, playerPos) {
    this.timeOfDay += delta * this.daySpeed;
    if (this.timeOfDay > Math.PI * 2) {
      this.timeOfDay -= Math.PI * 2;
    }

    const cosTime = Math.cos(this.timeOfDay);
    const sinTime = Math.sin(this.timeOfDay);

    // Sun orbits over the player
    const orbitRadius = 120;
    const sunX = playerPos.x + cosTime * orbitRadius;
    const sunY = Math.max(-20, sinTime * orbitRadius);
    const sunZ = playerPos.z + 40;

    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunLight.target.position.copy(playerPos);
    this.sunLight.target.updateMatrixWorld();

    // Moon is opposite the sun
    this.moonLight.position.set(
      playerPos.x - cosTime * orbitRadius,
      Math.max(-20, -sinTime * orbitRadius),
      playerPos.z - 40
    );

    // Dynamic light color based on altitude
    if (sinTime > 0.1) {
      // Daytime / Golden hour
      const sunWarmth = THREE.MathUtils.smoothstep(sinTime, 0.1, 0.6);
      this.sunLight.color.setRGB(1.0, 0.92 + 0.08 * sunWarmth, 0.75 + 0.25 * sunWarmth);
      this.sunLight.intensity = 1.4 * sunWarmth + 0.4;
      this.hemiLight.intensity = 0.5 + 0.3 * sunWarmth;
      this.hemiLight.color.setHex(0xfff2d6);
      this.hemiLight.groundColor.setHex(0x233124);
      this.sunLight.castShadow = true;
    } else {
      // Nighttime / Twilight
      this.sunLight.intensity = 0.05;
      this.sunLight.castShadow = false;
      this.moonLight.intensity = 0.5;
      this.hemiLight.intensity = 0.3;
      this.hemiLight.color.setHex(0x192a56);
      this.hemiLight.groundColor.setHex(0x0a0c10);
    }
  }

  isNight() {
    return Math.sin(this.timeOfDay) <= 0.1;
  }
}
