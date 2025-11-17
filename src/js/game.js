// src/js/game.js – Core Three.js game class
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.testCube = null;
  }

  async init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Camera (mobile-friendly FOV)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 4, 10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);

    // Test cube – visual confirmation that 3D is working
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      metalness: 0.3,
      roughness: 0.4,
    });
    this.testCube = new THREE.Mesh(geometry, material);
    this.scene.add(this.testCube);

    // Initial resize
    this.resize();
  }

  start() {
    this.animate();
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    // Simple rotation animation
    if (this.testCube) {
      this.testCube.rotation.x += 0.010;
      this.testCube.rotation.y += 0.015;
    }

    this.renderer.render(this.scene, this.camera);
  };

  resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };
}
