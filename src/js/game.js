// src/js/game.js – FINAL: WASD + JUMP + TWO-FINGER + DOUBLE-TAP RELEASE
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/PointerLockControls.js';
import { PlayerController } from './player-controller.js';
import { getDeltaTime } from './utils.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2c1810);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;

    this.playerController = new PlayerController(this.camera, this.canvas);
    this.scene.add(this.playerController.group);

    this.keys = {};
    this.fpsControls = new PointerLockControls(this.camera, canvas);
    this.scene.add(this.fpsControls.getObject());

    this.chiselVisible = false;
    this.chisel = null;

    // Touchpad state
    this.twoFingerActive = false;
    this.twoFingerStartY = 0;
    this.lastTapTime = 0;
  }

  async init() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const sun = new THREE.DirectionalLight(0xffeecc, 4);
    sun.position.set(5, 10, 7);
    sun.castShadow = true;
    this.scene.add(sun);

    this.createVisibleFloor();
    this.createWorkshop();
    this.createChisel();
    this.setupInput();

    this.resize();
    this.hideLoading?.();
  }

  createVisibleFloor() {
    const grid = new THREE.GridHelper(100, 100, 0xffffff, 0x555555);
    grid.position.y = 0.01;
    this.scene.add(grid);

    const texture = new THREE.CanvasTexture(this.generateGroundTexture());
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  generateGroundTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#00ff99';
    ctx.lineWidth = 4;
    for (let i = 0; i < 128; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 128);
      ctx.moveTo(0, i); ctx.lineTo(128, i);
      ctx.stroke();
    }
    return canvas;
  }

  createWorkshop() {
    const bench = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 2.5), wood);
    const top = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 3), wood);
    base.position.y = 0.4; top.position.y = 1;
    base.castShadow = top.castShadow = true;
    bench.add(base, top);
    bench.position.z = -4;
    this.scene.add(bench);

    const geo = new THREE.BoxGeometry(1, 1, 1, 48, 48, 48);
    const mat = new THREE.MeshStandardMaterial({ color: 0xDEB887, transparent: true, opacity: 0.6, roughness: 0.8 });
    const block = new THREE.Mesh(geo, mat);
    block.position.set(0, 1.2, -4);
    block.castShadow = true;
    bench.add(block);
    this.carvingBlock = block;
  }

  createChisel() {
    const group = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95 }));
    blade.position.y = 0.35;
    group.add(handle, blade);
    group.scale.set(1.4, 1.4, 1.4);
    group.visible = false;
    this.scene.add(group);
    this.chisel = group;
  }

  setupInput() {
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Keyboard
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Escape') this.fpsControls.unlock();
    });
    window.addEventListener('keyup', e => this.keys[e.code] = false);

    // Click to lock
    this.canvas.addEventListener('click', () => this.fpsControls.lock());

    // Double-click or double-tap to unlock
    this.canvas.addEventListener('dblclick', () => this.fpsControls.unlock());
    let tapCount = 0;
    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        const now = Date.now();
        if (now - this.lastTapTime < 300) {
          this.fpsControls.unlock();
          tapCount = 0;
        } else {
          tapCount = 1;
          this.lastTapTime = now;
        }
      }
    });

    this.fpsControls.addEventListener('lock', () => {
      if (!this.chiselVisible) {
        this.chisel.visible = true;
        this.chiselVisible = true;
      }
    });

    // Two-finger swipe = forward/back
    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        this.twoFingerActive = true;
        this.twoFingerStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      }
    });

    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (this.twoFingerActive && e.touches.length === 2) {
        const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const deltaY = this.twoFingerStartY - currentY;
        this.keys['KeyW'] = deltaY > 2;
        this.keys['KeyS'] = deltaY < -2;
        this.twoFingerStartY = currentY;
      }
    });

    this.canvas.addEventListener('touchend', () => {
      this.twoFingerActive = false;
      this.keys['KeyW'] = this.keys['KeyS'] = false;
    });

    // Mouse wheel = forward/back
    this.canvas.addEventListener('wheel', e => {
      this.keys['KeyW'] = e.deltaY < 0;
      this.keys['KeyS'] = e.deltaY > 0;
      setTimeout(() => { this.keys['KeyW'] = this.keys['KeyS'] = false; }, 100);
    });
  }

  update(delta) {
    // PASS KEYS TO PLAYER CONTROLLER — THIS WAS THE FINAL MISSING PIECE
    this.playerController.update(delta, this.keys);

    if (this.chisel?.visible) {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      this.chisel.position.copy(this.camera.position).add(dir.multiplyScalar(0.6)).sub(new THREE.Vector3(0, 0.4, 0));
      this.chisel.quaternion.copy(this.camera.quaternion);
      this.chisel.rotateX(-1.4);
    }
  }

  render() { this.renderer.render(this.scene, this.camera); }

  loop = (t) => {
    const delta = getDeltaTime(t);
    this.update(delta);
    this.render();
    requestAnimationFrame(this.loop);
  };

  start() { requestAnimationFrame(this.loop); }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
