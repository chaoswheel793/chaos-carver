import * as THREE from 'three';
import { PointerLockControls } from 'three/additions/controls/PointerLockControls.js';
import { Player } from './Player.js';
import { createChisel } from './Tools.js';

export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    this.clock = new THREE.Clock();
    this.keys = {};
    this.interactables = [];

    // Controls (camera is child of controls → correct FPS look)
    this.controls = new PointerLockControls(this.camera, document.body);

    // Player root for movement
    this.playerRoot = new THREE.Group();
    this.playerRoot.position.y = 1.6;
    this.playerRoot.add(this.controls.getObject());  // ← THIS IS THE KEY FIX
    this.scene.add(this.playerRoot);

    this.player = new Player(this.camera);
    this.chisel = createChisel(this.scene);
    this.interactables.push(this.chisel);

    this.setupWorld();
    this.setupControls();
    this.fadeOutLoading();

    window.addEventListener('resize', () => this.onResize());
  }

  setupWorld() {
    this.scene.background = new THREE.Color(0xb3e5fc);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    this.scene.add(hemi);
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(10, 20, 10);
    light.castShadow = true;
    this.scene.add(light);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  setupControls() {
    document.addEventListener('click', () => this.controls.lock());

    this.controls.addEventListener('lock', () => {
      document.getElementById('instructions').style.display = 'none';
      document.body.style.cursor = 'none';
    });
    this.controls.addEventListener('unlock', () => {
      document.getElementById('instructions').style.display = 'block';
      document.body.style.cursor = 'default';
    });

    document.addEventListener('keydown', e => this.keys[e.code] = true);
    document.addEventListener('keyup', e => this.keys[e.code] = false);

    document.addEventListener('pointerdown', e => {
      if (e.button === 0) this.player.tryGrab(this.interactables);
    });

    document.addEventListener('keydown', e => {
      if (e.code === 'KeyE') this.player.drop();
    });
  }

  fadeOutLoading() {
    setTimeout(() => {
      const el = document.getElementById('loading');
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 1000);
    }, 500);
  }

  init() { this.animate(); }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    // Movement using controls direction
    const direction = new THREE.Vector3();
    this.controls.getDirection(direction);

    const forward = new THREE.Vector3();
    forward.copy(direction).multiplyScalar((this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) - (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0));

    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).multiplyScalar((this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) - (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0));

    const move = new THREE.Vector3().add(forward).add(right).normalize().multiplyScalar(6 * delta);
    this.playerRoot.position.add(move);

    this.player.update(delta);
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
