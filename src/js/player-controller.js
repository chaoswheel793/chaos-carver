// src/js/player-controller.js – FINAL: Two-finger look + alt-drag + head bob
export class PlayerController {
  constructor(camera, domElement, game) {
    this.camera = camera;
    this.domElement = domElement;
    this.game = game;

    this.group = new THREE.Group();
    this.group.add(camera);
    camera.position.set(0, 1.6, 0);

    this.rightHand = new THREE.Group();
    this.rightHand.position.set(0.4, -0.3, -0.5);
    camera.add(this.rightHand);

    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.isLocked = false;
    this.twoFingerLook = false;
    this.lastTouchDistance = 0;

    this.setupControls();
  }

  setupControls() {
    this.domElement.addEventListener('click', () => this.domElement.requestPointerLock());
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    this.domElement.addEventListener('mousemove', e => {
      if (!this.isLocked && !this.twoFingerLook) return;
      if (this.game.keys['AltLeft'] || this.game.keys['AltRight']) {
        this.group.position.x -= e.movementX * 0.01;
        this.group.position.z -= e.movementY * 0.01;
      } else {
        this.yaw -= e.movementX * 0.002;
        this.pitch -= e.movementY * 0.002;
        this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch));
      }
    });

    // Mobile: Two-finger drag = look while carving
    this.domElement.addEventListener('touchstart', e => {
      if (e.touches.length === 2) this.twoFingerLook = true;
    });
    this.domElement.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && this.game.isCarving) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        this.yaw -= dx * 0.008;
        this.pitch -= dy * 0.008;
        this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch));
        e.preventDefault();
      }
    });
    this.domElement.addEventListener('touchend', () => {
      this.twoFingerLook = false;
    });
  }

  update(delta, keys) {
    const speed = 5.0;
    const forward = keys['KeyW'] || keys['ArrowUp'] ? 1 : keys['KeyS'] || keys['ArrowDown'] ? -1 : 0;
    const strafe = keys['KeyD'] || keys['ArrowRight'] ? 1 : keys['KeyA'] || keys['ArrowLeft'] ? -1 : 0;

    const dir = new THREE.Vector3(strafe, 0, -forward);
    dir.normalize().multiplyScalar(speed * delta);
    dir.applyAxisAngle(new THREE.Vector3(0,1,0), this.yaw);
    this.group.position.add(dir);

    // Head bob
    if (forward || strafe) {
      const time = performance.now() * 0.008;
      this.camera.position.y = 1.6 + Math.sin(time * 10) * 0.05;
    } else {
      this.camera.position.y += (1.6 - this.camera.position.y) * 0.1;
    }

    this.group.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
