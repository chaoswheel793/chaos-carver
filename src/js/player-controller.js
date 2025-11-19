// src/js/player-controller.js – FINAL TOUCH PERFECTION ACHIEVED
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';

export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.group = new THREE.Group();
    this.group.add(camera);
    camera.position.set(0, 1.6, 0);

    this.velocity = new THREE.Vector3();
    this.move = { forward: 0, right: 0 };
    this.canJump = false;

    this.pitch = 0;
    this.yaw = 0;
    this.mouseSensitivity = 0.002;

    this.keys = {};
    this.isLocked = false;           // chisel active?
    this.freeLookHeld = false;       // one finger down for free look?
    this.lastTapTime = 0;

    this.bobTime = 0;

    this.setupControls();
  }

  setupControls() {
    // === SINGLE TAP → LOCK (only if not already in free-look) ===
    const attemptLock = () => {
      if (!this.isLocked && !this.freeLookHeld) {
        this.domElement.requestPointerLock();
      }
    };

    this.domElement.addEventListener('click', attemptLock);

    // === TOUCH: SINGLE TAP / DOUBLE TAP ===
    this.domElement.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;

      const now = Date.now();
      if (now - this.lastTapTime < 320) {
        // DOUBLE TAP → UNLOCK
        this.unlock();
        e.preventDefault();
      } else {
        // SINGLE TAP → try to lock after short delay (so double-tap wins)
        this.lastTapTime = now;
        setTimeout(attemptLock, 350);
      }
    });

    // === HOLD ONE FINGER → ENTER FREE LOOK MODE ===
    this.domElement.addEventListener('touchstart', e => {
      if (e.touches.length === 1 && !this.isLocked) {
        this.freeLookHeld = true;
      }
    });

    // === SECOND FINGER SWIPE → FREE LOOK ===
    this.domElement.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && this.freeLookHeld && !this.isLocked) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        this.yaw -= dx * 0.008;
        this.pitch -= dy * 0.008;
        this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch));
        e.preventDefault();
      }
    });

    // === LIFT ALL FINGERS → EXIT FREE LOOK MODE ===
    this.domElement.addEventListener('touchend', () => {
      if (this.domElement.touches?.length === 0) {
        this.freeLookHeld = false;
      }
    });

    // === MOUSE LOOK WHEN LOCKED ===
    this.domElement.addEventListener('mousemove', e => {
      if (!this.isLocked) return;
      this.yaw -= e.movementX * this.mouseSensitivity;
      this.pitch -= e.movementY * this.mouseSensitivity;
      this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch));
    });

    // === POINTER LOCK STATE ===
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    // ESC also unlocks
    document.addEventListener('keydown', e => {
      if (e.code === 'Escape') this.unlock();
    });
  }

  lock() { this.domElement.requestPointerLock(); }
  unlock() { document.exitPointerLock(); }

  update(delta, keys) {
    this.keys = keys;

    // Movement
    this.move.forward = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
    this.move.right   = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);

    const speed = 5.0;
    const direction = new THREE.Vector3(this.move.right, 0, -this.move.forward);
    direction.normalize().multiplyScalar(speed * delta);
    direction.applyAxisAngle(new THREE.Vector3(0,1,0), this.yaw);
    this.group.position.add(direction);

    // Jump
    if (keys['Space'] && this.canJump) {
      this.velocity.y = 10;
      this.canJump = false;
    }
    this.velocity.y -= 30 * delta;
    this.group.position.y += this.velocity.y * delta;
    if (this.group.position.y <= 1.6) {
      this.group.position.y = 1.6;
      this.velocity.y = 0;
      this.canJump = true;
    }

    // HEAD BOB — GORGEOUS WALKING FEEL
    const walking = Math.abs(this.move.forward) + Math.abs(this.move.right) > 0;
    if (walking && this.canJump) {
      this.bobTime += delta * 12;
      const bob = Math.sin(this.bobTime) * 0.06;
      this.camera.position.y = 1.6 + bob + Math.sin(this.bobTime * 2) * 0.02;
    } else {
      this.camera.position.y += (1.6 - this.camera.position.y) * delta * 10;
      this.bobTime *= 0.9;
    }

    // Apply look
    this.group.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
