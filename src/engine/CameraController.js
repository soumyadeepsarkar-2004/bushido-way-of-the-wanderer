import * as THREE from 'three';

export class CameraController {
  constructor(canvas) {
    this.canvas = canvas;
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.targetPosition = new THREE.Vector3();
    this.currentPosition = new THREE.Vector3();
    this.lookAtTarget = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    // Spherical orbit offsets
    this.distance = 5.2;
    this.minDistance = 2.0;
    this.maxDistance = 12.0;
    this.pitch = 0.25; // Vertical angle (radians)
    this.yaw = 0.0;    // Horizontal angle (radians)
    this.minPitch = -0.35;
    this.maxPitch = 1.35;

    // Shake trauma (0 to 1)
    this.trauma = 0;
    this.shakeOffset = new THREE.Vector3();
    this.shakeDirection = new THREE.Vector3();

    // Lock-on target
    this.lockedTarget = null;
    this._tmpVec = new THREE.Vector3();
    this.shakeDirection = new THREE.Vector3();
    this._fwdDir = new THREE.Vector3();
    this._rightDir = new THREE.Vector3();

    // Mouse sensitivity
    this.sensitivity = 0.0022;
    this.isPointerLocked = false;

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });

    this.canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      this.yaw -= e.movementX * this.sensitivity;
      this.pitch += e.movementY * this.sensitivity;
      this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
    });

    window.addEventListener('wheel', (e) => {
      this.distance += e.deltaY * 0.005;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    });
  }

  addTrauma(amount, direction = null) {
    this.trauma = Math.min(1.0, this.trauma + amount);
    if (direction) {
      this.shakeDirection.copy(direction).normalize();
    }
  }

  setLockTarget(target) {
    this.lockedTarget = target;
  }

  update(delta, playerPos, terrainHeightAt) {
    // Decay trauma
    if (this.trauma > 0) {
      const shakeMag = Math.sqrt(this.trauma) * 0.6;
      const toSource = this.shakeDirection || new THREE.Vector3(1, 0.5, 1);
      toSource.normalize();
      this.shakeOffset.set(
        (Math.random() * 2 - 1) * shakeMag * toSource.x,
        (Math.random() * 2 - 1) * shakeMag * Math.abs(toSource.y) + shakeMag * 0.3,
        (Math.random() * 2 - 1) * shakeMag * toSource.z
      );
      this.trauma = Math.max(0, this.trauma - delta * 2.5);
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    // If locked on, orient yaw toward enemy
    if (this.lockedTarget && this.lockedTarget.mesh) {
      const toEnemy = this._tmpVec.subVectors(this.lockedTarget.mesh.position, playerPos);
      const desiredYaw = Math.atan2(-toEnemy.x, -toEnemy.z);
      this.yaw = THREE.MathUtils.lerp(this.yaw, desiredYaw, delta * 5.0);
    }

    // Calculate desired camera position in world space
    const horizontalDist = this.distance * Math.cos(this.pitch);
    const verticalDist = this.distance * Math.sin(this.pitch) + 1.8; // shoulder height

    const offsetX = Math.sin(this.yaw) * horizontalDist;
    const offsetZ = Math.cos(this.yaw) * horizontalDist;

    this.targetPosition.set(
      playerPos.x + offsetX,
      playerPos.y + verticalDist,
      playerPos.z + offsetZ
    );

    // Terrain collision avoidance for camera
    if (terrainHeightAt) {
      const terrainH = terrainHeightAt(this.targetPosition.x, this.targetPosition.z) + 0.6;
      if (this.targetPosition.y < terrainH) {
        this.targetPosition.y = terrainH;
      }
    }

    // Smooth lerp
    this.camera.position.lerp(this.targetPosition, Math.min(1.0, delta * 12.0));
    this.camera.position.add(this.shakeOffset);

    // Look at player center + offset
    this.lookAtTarget.set(playerPos.x, playerPos.y + 1.4, playerPos.z);
    this.currentLookAt.lerp(this.lookAtTarget, Math.min(1.0, delta * 15.0));
    this.camera.lookAt(this.currentLookAt);
  }

  getForwardVector() {
    this.camera.getWorldDirection(this._fwdDir);
    this._fwdDir.y = 0;
    return this._fwdDir.normalize();
  }

  getRightVector() {
    const forward = this.getForwardVector();
    this._rightDir.set(-forward.z, 0, forward.x);
    return this._rightDir;
  }
}
