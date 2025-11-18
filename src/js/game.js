// src/js/game.js – Debug Version with Logs + Visible Cube
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { getDeltaTime } from './utils.js';

export class Game {
  constructor(canvas) {
    console.log('Game constructor called');
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Blue sky to confirm render
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 5);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.onFirstRender = null;
    this.firstRender = false;
  }

  async init() {
    console.log('Game init started');
    // Add bright green cube (impossible to miss)
    const geo = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geo, mat);
    cube.position.set(0, 1, 0);
    this.scene.add(cube);
    console.log('Green cube added – if visible, render works');

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10, 10, 5);
    this.scene.add(light);
    console.log('Lighting added');

    // Workshop floor
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    console.log('Workshop floor added');

    console.log('Game init complete');
  }

  update(delta) {
    // Rotate cube
    if (this.scene.children[1]) this.scene.children[1].rotation.x += delta;
    if (this.scene.children[1]) this.scene.children[1].rotation.y += delta;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    if (!this.firstRender) {
      this.firstRender = true;
      console.log('First render complete – loading should hide');
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
    console.log('Game loop started');
    requestAnimationFrame(t => this.loop(t));
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
