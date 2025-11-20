import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/PointerLockControls.js';

export class Game {
  constructor() {
    this.scene   = new THREE.Scene();
    this.camera  = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('canvas'),
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.clock = new THREE.Clock();

    // Player root (will hold arms/hands later)
    this.player = new THREE.Group();
    this.scene.add(this.player);
    this.player.add(this.camera);
    this.camera.position.set(0, 1.6, 3); // eye height

    this.player.position.set(0, 0, 0);

    // FPS controls
    this.controls = new PointerLockControls(this.camera, document.body);
    this.scene.add(this.controls.getObject());
    this.isLocked = false;

    // Basic workshop
    this.scene.background = new THREE.Color(0x2a2a2a);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.4);
    this.scene.add(hemi);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(8, 12, 8);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Wood floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.setupControlsUI();
    this.fadeOutLoading();

    window.addEventListener('resize', () => this.onResize());
  }

  setupControlsUI() {
    const blocker = document.createElement('div');
    blocker.style.position = 'absolute';
    blocker.style.inset = '0';
    blocker.style.background = 'rgba(0,0,0,0.7)';
    blocker.style.color = 'white';
    blocker.style.display = 'flex';
    blocker.style.alignItems = 'center';
    blocker.style.justifyContent = 'center';
    blocker.style.fontSize = '1.5rem';
    blocker.style.textAlign = 'center';
    blocker.style.zIndex = '99';
    blocker.innerHTML = 'Click anywhere to enter the workshop<br><small>ESC to exit</small>';
    document.body.appendChild(blocker);

    this.controls.addEventListener('lock', () => blocker.style.display = 'none');
    this.controls.addEventListener('unlock', () => blocker.style.display = 'flex');

    document.addEventListener('click', () => this.controls.lock());
  }

  fadeOutLoading() {
    const loading = document.getElementById('loading');
    setTimeout(() => loading.classList.add('fade-out'), 800);
    setTimeout(() => loading.remove(), 1600);
  }

  init() {
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    // movement & future systems go here
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
