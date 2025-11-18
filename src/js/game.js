// src/js/game.js – I Make Things core with first-person workshop
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { getDeltaTime, getInputVector } from './utils.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.workshopItems = [];
    this.workbench = null;
    this.aiObservers = [];
    this.isCarving = false;
    this.accuracyScore = 0;

    this.keys = {};
    this.raycaster = new THREE.Raycaster();

    this.currentEnvironmentTheme = 'basic';
    this.environmentManager = null;
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

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    this.player = new Player(this.camera);
    this.scene.add(this.player.group);

    this.environmentManager = new EnvironmentManager(this.scene, this);
    this.environmentManager.loadTheme(this.currentEnvironmentTheme);

    // TODO: Add spectator characters/elements here for audience reactions.

    this.setupInputs();
    this.resize();
  }

 8000
}

  setupInputs() {
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);

    this.canvas.addEventListener('click', (e) => this.handlePick(e));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handlePick(e.touches[0]);
    });
  }

  update(delta) {
    const speed = 5 * delta;
    const direction = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) direction.z -= speed;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) direction.z += speed;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) direction.x -= speed;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) direction.x += speed;
    this.camera.position.add(direction.applyQuaternion(this.camera.quaternion));

    this.player.update(delta, this.isCarving);

    // Animate AI observers
    this.aiObservers.forEach((obs, i) => {
      obs.rotation.y = Math.sin(Date.now() * 0.001 + i) * 0.15;
    });

    if (this.isCarving) {
      this.accuracyScore = Math.min(100, this.accuracyScore + 15 * delta);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  handlePick(event) {
    const pointer = new THREE.Vector2(0, 0); // Center screen
    this.raycaster.setFromCamera(pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.workshopItems);
    if (intersects.length > 0) {
      this.player.pickup(intersects[0].object);
    }
  }

  loop(currentTime) {
    const delta = getDeltaTime(currentTime);
    this.update(delta);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

// Environment Manager – handles themes
class EnvironmentManager {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.themes = {
      basic: this.createBasicWorkshop.bind(this)
    };
  }

  loadTheme(theme) {
    if (this.themes[theme]) {
      this.themes[theme]();
    }
  }

  createBasicWorkshop() {
    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshLambertMaterial({ color: 0xD2B48C })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Workbench
    const benchGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 2.5), woodMat);
    const top = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 3), woodMat);
    base.position.y = 0.4;
    top.position.y =  = 1;
    benchGroup.add(base, top);
    this.scene.add(benchGroup);
    this.game.workbench = benchGroup;

    // Wood block on workbench
    const block = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.6 })
    );
    block.position.set(0, 1.1, 0);
    block.userData = { type: 'carvable' };
    benchGroup.add(block);
    this.game.workshopItems.push(block);

    // Walls
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x666666, side: THREE.DoubleSide });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(50, 20), wallMat);
    back.position.set(0, 10, -15);
    this.scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(50, 20), wallMat);
    left.position.set(-15, 10, 0);
    left.rotation.y = Math.PI / 2;
    this.scene.add(left);
    const right = left.clone();
    right.position.x = 15;
    right.rotation.y = -Math.PI / 2;
    this.scene.add(right);

    // Lighting
    const light = new THREE.PointLight(0xffddaa, 2, 40);
    light.position.set(0, 8, 0);
    light.castShadow = true;
    this.scene.add(light);

    // AI Observers
    const positions = [{x:-4,z:4}, {x:4,z:4}, {x:-4,z:8}, {x:4,z:8}];
    positions.forEach((p, i) => {
      const obs = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3,1.2), new THREE.MeshLambertMaterial({color:0x444444}));
      body.position.y = 0.8;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshLambertMaterial({color:0xFDBCB4}));
      head.position.y = 1.8;
      obs.add(body, head);
      obs.position.set(p.x, 0, p.z);
      this.scene.add(obs);
      this.game.aiObservers.push(obs);
    });
  }
}

// Player class (arms/hands) – unchanged from previous
class Player {
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.carriedItem = null;
    this.hands = new THREE.Group();

    const mat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
    const handMat = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });

    // Simple arms
    const left = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.8), mat);
    left.position.set(-0.4, -0.3, -0.6);
    const right = left.clone();
    right.position.x *= -1;
    this.group.add(left, right);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.15), handMat);
    leftHand.position.set(-0.4, -0.7, -0.8);
    const rightHand = leftHand.clone();
    rightHand.position.x *= -1;
    this.hands.add(leftHand, rightHand);
    this.group.add(this.hands);

    this.pose = 'idle';
  }

  update(delta, isCarving) {
    const sway = Math.sin(Date.now()*0.005)*0.05;
    this.group.rotation.y = sway;
  }

  pickup(item) {
    if (this.carriedItem) return;
    this.carriedItem = item;
    this.scene.remove(item);
    this.hands.add(item);
    item.position.set(0, -0.3, -1);
  }
}
