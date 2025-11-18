// src/js/game.js – Chromebook Fallback: Canvas2D Renderer (No WebGL Needed)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { getDeltaTime } from './utils.js';

export class Game {
  constructor(canvas) {
    console.log('Game constructor – Chromebook fallback mode');
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Blue to confirm
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 5);
    
    // Software fallback – no WebGL
    this.renderer = new THREE.CanvasRenderer({ canvas: this.canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    
    this.onFirstRender = null;
    this.firstRender = false;
  }

  async init() {
    console.log('Init started – fallback');
    
    // Lighting (works in Canvas2D)
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    
    // Green cube (big and bright)
    const geo = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geo, mat);
    cube.position.set(0, 1, 0);
    this.scene.add(cube);
    console.log('Green cube added in fallback');

    // Floor
    const groundGeo = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    console.log('Floor added');

    // Workbench
    const benchGeo = new THREE.BoxGeometry(5, 1, 3);
    const benchMat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(0, 0.5, 0);
    this.scene.add(bench);
    console.log('Workbench added');

    // Wood block
    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    const blockMat = new THREE.MeshBasicMaterial({ color: 0xDEB887 });
    const block = new THREE.Mesh(blockGeo, blockMat);
    block.position.set(0, 1.2, 0);
    this.scene.add(block);
    console.log('Wood block added');

    console.log('Fallback init complete – should see blue + green cube + brown floor');
  }

  update(delta) {
    // Rotate cube
    if (this.scene.children.find(c => c.material && c.material.color && c.material.color.getHex() === 0x00ff00)) {
      this.scene.children.find(c => c.material && c.material.color && c.material.color.getHex() === 0x00ff00).rotation.x += delta;
      this.scene.children.find(c => c.material && c.material.color && c.material.color.getHex() === 0x00ff00).rotation.y += delta;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    if (!this.firstRender) {
      this.firstRender = true;
      console.log('First render – hiding loading');
      if (this.onFirstRender) this.onFirstRender();
    }
  }

  loop(t) {
    const delta = getDeltaTime(t);
    this.update(delta);
    this.render();
    requestAnimationFrame(t => this.loop(t));
  }

  start() {
    console.log('Fallback loop started');
    requestAnimationFrame(t => this.loop(t));
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

// Simple player (hands)
class Player {
  constructor(camera) {
    console.log('Player fallback created');
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.position.set(0.2, -0.3, -0.6);

    // Simple hand
    const handGeo = new THREE.BoxGeometry(0.18, 0.12, 0.25);
    const handMat = new THREE.MeshBasicMaterial({ color: 0xFDBCB4 });
    const hand = new THREE.Mesh(handGeo, handMat);
    hand.position.set(0.4, -0.7, -0.7);
    this.group.add(hand);
    console.log('Hand added');
  }

  update(delta) {
    const sway = Math.sin(Date.now() * 0.003) * 0.03;
    this.group.rotation.z = sway;
  }
}
