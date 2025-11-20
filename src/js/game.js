import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/controls/PointerLockControls.js';

import { Player } from './Player.js';
import { createChisel } from './Tools.js';

export class Game {
  constructor() {
    this.scene    = new THREE.Scene();
    this.camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    this.clock = new THREE.Clock();
    this.keys = {};
    this.interactables = [];

    // Player root group
    this.playerRoot = new THREE.Group();
    this.scene.add(this.playerRoot);
    this.playerRoot.position.y = 1.6; // eye height

    // Controls
    this.controls = new PointerLockControls(this.camera, document.body);
    this.playerRoot.add(this.controls.getObject()); // ← THIS WAS THE FIX

    this.player = new Player(this.camera, this.scene, this.playerRoot);
    this.chisel = createChisel(this.scene);
    this.interactables.push(this.chisel);

    this.setupWorld();
    this.setupInput();
    this.setupMobileTouch();
    this.fadeOutLoading();

    window.addEventListener('resize', () => this.onResize());
  }

  setupWorld() {
    this.scene.background = new THREE.Color(0x2a2a2a);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.8);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(10, 15, 10);
    dir.castShadow = true;
    this.scene.add(dir);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  setupInput() {
    document.addEventListener('keydown', e => this.keys[e.code] = true);
    document.addEventListener('keyup',   e => this.keys[e.code] = false);

    const grab = () => this.player.tryGrab(this.interactables);
    document.addEventListener('pointerdown', e => {
      if (e.button === 0 || e.isPrimary) grab();
    });

    document.addEventListener('keydown', e => {
      if (e.code === 'KeyE' || e.code === 'Space') this.player.drop();
    });

    this.controls.addEventListener('lock', () => document.body.style.cursor = 'none');
    this.controls.addEventListener('unlock', () => document.body.style.cursor = 'grab');
    document.addEventListener('click', () => this.controls.lock());
  }

  // FULL MOBILE TOUCH CONTROLS
  setupMobileTouch() {
    let touchStartX = 0, touchStartY = 0;
    let isTwoFinger = false;

    document.addEventListener('touchstart', e => {
      if (e.touches.length === 2) isTwoFinger = true;
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: false });

    document.addEventListener('touchmove', e => {
      if (e.touches.length === 1 && !isTwoFinger) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        this.controls.yawObject.rotation.y -= deltaX * 0.002;
        this.controls.pitchObject.rotation.x -= deltaY * 0.002;
        this.controls.pitchObject.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.controls.pitchObject.rotation.x));
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      isTwoFinger = false;
    });
  }

  fadeOutLoading() {
    const el = document.getElementById('loading');
    setTimeout(() => el.classList.add('fade-out'), 800);
    setTimeout(() => el.remove(), 1600);
  }

  init() { this.animate(); }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    this.player.update(delta, this.keys, this.playerRoot);
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
