// src/js/game.js – FINAL MASTERPIECE: Dual-Mode Carving + Inspection
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/PointerLockControls.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/OrbitControls.js';
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

    // Controls
    this.pointerLock = new PointerLockControls(this.camera, canvas);
    this.orbit = new OrbitControls(this.camera, canvas);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.05;
    this.orbit.enableZoom = true;

    this.player = new PlayerController(this.camera, canvas, this);
    this.scene.add(this.player.group);

    this.mode = 'fps'; // 'fps' or 'inspect'
    this.keys = {};
    this.chiselVisible = false;
    this.isCarving = false;
    this.carvingBlock = null;

    this.lastTap = 0;
  }

  async init() {
    this.setupLighting();
    this.createFloor();
    this.createWorkshop();
    this.createChisel();
    this.setupInput();
    this.setMode('fps');
    this.resize();
    this.hideLoading?.();
  }

  setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const sun = new THREE.DirectionalLight(0xffeecc, 4);
    sun.position.set(5, 10, 7);
    sun.castShadow = true;
    this.scene.add(sun);
  }

  createFloor() {
    const grid = new THREE.GridHelper(100, 100, 0xffffff, 0x555555);
    this.scene.add(grid);
  }

  createWorkshop() {
    const bench = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    bench.add(new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 2.5), wood));
    bench.add(new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 3), wood).translateY(1));
    bench.position.z = -5;
    this.scene.add(bench);

    const geo = new THREE.BoxGeometry(1, 1, 1, 48, 48, 48);
    const mat = new THREE.MeshStandardMaterial({ color: 0xDEB887, transparent: true, opacity: 0.7 });
    this.carvingBlock = new THREE.Mesh(geo, mat);
    this.carvingBlock.position.set(0, 1.2, -5);
    bench.add(this.carvingBlock);

    this.orbit.target.copy(this.carvingBlock.position);
  }

  createChisel() {
    this.chisel = new THREE.Group();
    this.chisel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4), new THREE.MeshStandardMaterial({ color: 0x8B4513 })));
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95 }));
    blade.position.y = 0.35;
    this.chisel.add(blade);
    this.chisel.scale.set(1.4, 1.4, 1.4);
    this.chisel.visible = false;
    this.scene.add(this.chisel);
  }

  setupInput() {
    // Keyboard
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Space') this.toggleMode();
    });
    window.addEventListener('keyup', e => this.keys[e.code] = false);

    // Touch gestures
    let taps = 0;
    this.canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        const now = Date.now();
        if (now - this.lastTap < 300) {
          this.toggleMode();
          taps = 0;
        } else {
          taps++;
          this.lastTap = now;
          setTimeout(() => taps = 0, 350);
        }
      }
    });

    this.canvas.addEventListener('click', () => {
      if (this.mode === 'inspect') this.setMode('fps');
    });
  }

  toggleMode() {
    this.setMode(this.mode === 'fps' ? 'inspect' : 'fps');
  }

  setMode(mode) {
    this.mode = mode;
    this.pointerLock.enabled = mode === 'fps';
    this.orbit.enabled = mode === 'inspect';

    if (mode === 'fps') {
      this.canvas.requestPointerLock();
      this.chisel.visible = true;
      this.isCarving = true;
    } else {
      document.exitPointerLock();
      this.chisel.visible = false;
      this.isCarving = false;
    }
  }

  update(delta) {
    if (this.mode === 'fps') {
      this.player.update(delta, this.keys);
      this.orbit.update();

      if (this.chisel.visible) {
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        this.chisel.position.copy(this.camera.position).addScaledVector(dir, 0.6).sub(new THREE.Vector3(0, 0.4, 0));
        this.chisel.quaternion.copy(this.camera.quaternion);
        this.chisel.rotateX(-1.4);
      }
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
