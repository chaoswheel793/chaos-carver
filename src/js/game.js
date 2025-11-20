import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/controls/PointerLockControls.js';

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
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.clock = new THREE.Clock();
    this.keys = {};
    this.interactables = [];
    this.isJumping = false;

    // Player root (fixed for movement)
    this.playerRoot = new THREE.Group();
    this.scene.add(this.playerRoot);
    this.playerRoot.position.y = 1.6;

    // Controls
    this.controls = new PointerLockControls(this.camera, document.body);
    this.playerRoot.add(this.controls.getObject());

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
    this.scene.background = new THREE.Color(0x87ceeb); // Blue sky for better visibility
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
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.player.jump();
      }
    });
    document.addEventListener('keyup', e => this.keys[e.code] = false);

    const grab = () => this.player.tryGrab(this.interactables);
    document.addEventListener('pointerdown', e => {
      if (e.button === 0 || e.isPrimary) grab();
    });

    document.addEventListener('keydown', e => {
      if (e.code === 'KeyE') this.player.drop();
    });

    this.controls.addEventListener('lock', () => document.body.style.cursor = 'none');
    this.controls.addEventListener('unlock', () => document.body.style.cursor = 'grab');
    document.addEventListener('click', () => this.controls.lock());
  }

  setupMobileTouch() {
    let touchStart = new THREE.Vector2();
    let isTwoFinger = false;
    const joyRadius = 100; // Virtual joystick sensitivity

    document.addEventListener('touchstart', e => {
      if (e.touches.length >= 2) {
        isTwoFinger = true;
        e.preventDefault();
      } else if (e.touches.length === 1) {
        touchStart.set(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    document.addEventListener('touchmove', e => {
      e.preventDefault();
      if (isTwoFinger && e.touches.length >= 2) {
        // Two-finger: Movement (virtual joystick from left side)
        const avgX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const avgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const deltaX = (avgX - window.innerWidth / 2) / joyRadius;
        const deltaY = (avgY - window.innerHeight / 2) / joyRadius;
        this.keys['KeyW'] = deltaY < -0.3;
        this.keys['KeyS'] = deltaY > 0.3;
        this.keys['KeyA'] = deltaX < -0.3;
        this.keys['KeyD'] = deltaX > 0.3;
      } else if (e.touches.length === 1) {
        // One-finger: Look
        const deltaX = e.touches[0].clientX - touchStart.x;
        const deltaY = e.touches[0].clientY - touchStart.y;
        this.controls.getObject().rotation.y -= deltaX * 0.005;
        this.camera.rotation.x -= deltaY * 0.005;
        this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
        touchStart.set(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      isTwoFinger = false;
      this.keys['KeyW'] = this.keys['KeyS'] = this.keys['KeyA'] = this.keys['KeyD'] = false;
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

    this.player.update(delta, this.keys);
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
