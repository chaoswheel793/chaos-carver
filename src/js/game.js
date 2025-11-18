// src/js/game.js – I Make Things: First-Person Hands + Tool + Inspection
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/PointerLockControls.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/OrbitControls.js';
import { getDeltaTime } from './utils.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.workshopItems = [];
    this.workbench = null;
    this.carvingBlock = null;
    this.isCarving = false;

    this.keys = {};
    this.raycaster = new THREE.Raycaster();

    this.fpsControls = null;
    this.orbitControls = null;
    this.currentMode = 'fps'; // 'fps' or 'inspect'
  }

  async init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8B4513);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 5);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const light = new THREE.PointLight(0xffddaa, 2, 40);
    light.position.set(0, 8, 0);
    light.castShadow = true;
    this.scene.add(light);

    this.player = new Player(this.camera);
    this.scene.add(this.player.group);

    this.createWorkshop();

    this.setupControls();
    this.setupInput();

    this.resize();
  }

  createWorkshop() {
    // Simple ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshLambertMaterial({ color: 0xD2B48C })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Workbench
    const bench = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 2.5), woodMat);
    const top = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 3), woodMat);
    base.position.y = 0.4; top.position.y = 1;
    bench.add(base, top);
    this.scene.add(bench);
    this.workbench = bench;

    // Wood block (the thing you will carve)
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8, 32, 32, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0xDEB887,
        roughness: 0.6,
        transmission: 0.9,
        thickness: 0.5,
        transparent: true,
        opacity: 0.7
      })
    );
    block.position.set(0, 1.1, 0);
    block.userData = { type: 'carvable' };
    bench.add(block);
    this.workshopItems.push(block);
    this.carvingBlock = block;
  }

  setupControls() {
    this.fpsControls = new PointerLockControls(this.camera, this.canvas);
    this.scene.add(this.fpsControls.getObject());

    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.target.copy(this.carvingBlock.position);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.08;
    this.orbitControls.minDistance = 0.5;
    this.orbitControls.maxDistance = 6;
    this.orbitControls.enabled = false;
  }

  setupInput() {
    window.addEventListener('keydown', e => this.keys[e.code] = true);
    window.addEventListener('keyup', e => this.keys[e.code] = false);

    // Click to lock pointer (desktop)
    this.canvas.addEventListener('click', () => {
      if (this.currentMode === 'fps') this.fpsControls.lock();
    });

    // Double-click / Space = toggle inspection mode
    let lastClick = 0;
    this.canvas.addEventListener('dblclick', () => this.toggleMode());
    window.addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); this.toggleMode(); }
    });
    this.canvas.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastClick < 300) this.toggleMode();
      lastClick = now;
    });

    // Pickup on right-click or tap
    this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); this.pickup(); });
    this.canvas.addEventListener('touchend', () => this.pickup());
  }

  toggleMode() {
    this.currentMode = this.currentMode === 'fps' ? 'inspect' : 'fps';
    if (this.currentMode === 'fps') {
      this.fpsControls.lock();
      this.orbitControls.enabled = false;
    } else {
      this.fpsControls.unlock();
      this.orbitControls.enabled = true;
      this.orbitControls.target.copy(this.carvingBlock.position);
    }
  }

  pickup() {
    this.raycaster.setFromCamera(new THREE.Vector2(0,0), this.camera);
    const hits = this.raycaster.intersectObjects(this.workshopItems);
    if (hits.length > 0 && hits[0].object === this.carvingBlock) {
      this.player.holdBlock(this.carvingBlock);
    }
  }

  update(delta) {
    if (this.currentMode === 'fps') {
      const speed = 4 * delta;
      const dir = new THREE.Vector3();
      if (this.keys['KeyW']) dir.z -= 1;
      if (this.keys['KeyS']) dir.z += 1;
      if (this.keys['KeyA']) dir.x -= 1;
      if (this.keys['KeyD']) dir.x += 1;
      dir.normalize().applyQuaternion(this.camera.quaternion).multiplyScalar(speed);
      this.camera.position.add(dir);
    } else {
      this.orbitControls.update();
    }

    this.player.update(delta);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  loop(t) {
    const delta = getDeltaTime(t);
    this.update(delta);
    this.render();
    requestAnimationFrame(t => this.loop(t));
  }

  start() {
    requestAnimationFrame(t => this.loop(t));
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w/h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h);
  }
}

// First-person hands & tool holder
class Player {
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.rightHand = new THREE.Group();

    const skin = new THREE.MeshLambertMaterial({ color: 0xFDBCB4 });
    const sleeve = new THREE.MeshLambertMaterial({ color: 0x333333 });

    // Simple arms (replace with GLTF later)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,0.7), sleeve);
    arm.position.set(0.4, -0.3, -0.5);
    arm.rotation.x = 0.3;
    this.group.add(arm);

    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.12,0.25), skin);
    hand.position.set(0.4, -0.7, -0.7);
    this.rightHand.add(hand);
    this.group.add(this.rightHand);

    this.holding = null;
  }

  update(delta) {
    const sway = Math.sin(Date.now()*3)*0.02;
    this.group.rotation.z = sway;
    this.group.position.y = -0.3 + Math.sin(Date.now()*2)*0.02;
  }

  holdBlock(block) {
    if (this.holding) return;
    this.holding = block;
    this.scene.remove(block);
    this.rightHand.add(block);
    block.position.set(0.1, -0.1, -0.4);
    block.rotation.set(0, 0.5, 0);
  }
}
