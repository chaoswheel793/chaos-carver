// src/js/game.js – Core game with first-person loop
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { getDeltaTime, getInputVector } from './utils.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null; // First-person camera (player eyes)
    this.renderer = null;
    this.player = null; // First-person player with articulated arms/hands
    this.workshopItems = []; // Pickable objects (logs, tools)
    this.workstations = []; // Benches, carving stations
    this.isCarving = false; // State for build mode
    this.accuracyScore = 0; // For virtual-to-real discounts

    // Input handling
    this.keys = {};
    this.touchStart = null;
    this.raycaster = new THREE.Raycaster();
  }

  async init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8B4513); // Rustic workshop brown

    // First-person camera (player view)
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 0); // Eye level

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Lighting (warm workshop glow)
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    // Initialize first-person player (arms/hands out front)
    this.player = new Player(this.camera);
    this.scene.add(this.player.group); // Arms/hands mesh group

    // Placeholder workshop: Floor + sample item + workstation
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // Sample pickable item (wood log placeholder)
    const logGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    const logMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const log = new THREE.Mesh(logGeo, logMat);
    log.position.set(2, 1, 0);
    log.userData = { type: 'item', name: 'Wood Log' };
    this.workshopItems.push(log);
    this.scene.add(log);

    // Sample workstation (bench)
    const benchGeo = new THREE.BoxGeometry(3, 0.5, 1);
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(-3, 0.25, 0);
    bench.userData = { type: 'workstation', action: 'carve' };
    this.workstations.push(bench);
    this.scene.add(bench);

    // Event listeners for input
    this.setupInputs();

    this.resize();
    log('Game initialized – First-person workshop ready');
  }

  setupInputs() {
    // Keyboard for desktop testing
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);

    // Touch for mobile (joystick-like movement + pick)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchStart = getInputVector(e.touches[0]);
      this.handlePick(e.touches[0]); // Raycast for pickup
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const current = getInputVector(e.touches[0]);
      this.handleMovement(current); // Swipe for walk
    });
    this.canvas.addEventListener('click', (e) => this.handlePick(e)); // Desktop pick
  }

  // Update: Handles logic/state (runs every frame, capped delta)
  update(delta) {
    // Player movement (walk around workshop)
    const speed = 5 * delta;
    const direction = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) direction.z -= speed;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) direction.z += speed;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) direction.x -= speed;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) direction.x += speed;
    this.camera.position.add(direction);

    // Animate arms/hands (idle sway + grab pose)
    this.player.update(delta, this.isCarving);

    // Check interactions (pickup/carry to station)
    if (this.player.carriedItem) {
      this.player.carriedItem.position.copy(this.player.hands.position);
      // Check proximity to workstation
      for (const station of this.workstations) {
        if (this.player.carriedItem.position.distanceTo(station.position) < 2) {
          this.isCarving = true;
          this.startCarving(this.player.carriedItem);
          break;
        }
      }
    }

    // Update accuracy score during carving (placeholder logic)
    if (this.isCarving) {
      this.accuracyScore += 0.1 * delta; // Simulate progress
      if (this.accuracyScore >= 100) {
        log(`Carving complete! Accuracy: ${Math.floor(this.accuracyScore)}% – Ready for real-world order.`);
        this.isCarving = false;
        this.accuracyScore = 0;
      }
    }
  }

  // Render: Draws the scene (runs every frame)
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // Handle pickup (raycast from camera to object)
  handlePick(e) {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera); // Center screen
    const intersects = this.raycaster.intersectObjects(this.workshopItems);
    if (intersects.length > 0) {
      this.player.pickup(intersects[0].object);
      log('Picked up:', intersects[0].object.userData.name);
    }
  }

  // Handle movement from touch (joystick simulation)
  handleMovement(input) {
    const speed = 3;
    if (Math.abs(input.x) > 0.5) this.camera.position.x += input.x * speed;
    if (Math.abs(input.y) > 0.5) this.camera.position.z += input.y * speed;
  }

  // Start carving mode (deform mesh – placeholder for shader/boolean ops)
  startCarving(item) {
    log('At workstation – Begin carving!');
    // Future: Apply touch swipes to deform item geometry
  }

  // Main loop: Ties update + render
  loop(currentTime) {
    const delta = getDeltaTime(currentTime);
    this.update(delta);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    log('Game loop started – First-person mode active');
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

// First-person Player class (arms/hands)
class Player {
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group(); // Arms container
    this.carriedItem = null;
    this.hands = new THREE.Group(); // Hand position (out front)

    // Placeholder arms: Upper arm + forearm + hand (simple cylinders/spheres)
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
    // Left arm (out front)
    this.leftUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), armMaterial);
    this.leftFore = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6), armMaterial);
    this.leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshLambertMaterial({ color: 0xF5DEB3 }));
    this.leftUpper.position.set(-0.5, -0.4, -0.5);
    this.leftFore.position.set(0, -0.7, 0);
    this.leftHand.position.set(0, -0.9, 0);
    this.group.add(this.leftUpper, this.leftFore, this.leftHand);

    // Right arm (symmetric)
    this.rightUpper = this.leftUpper.clone();
    this.rightFore = this.leftFore.clone();
    this.rightHand = this.leftHand.clone();
    this.rightUpper.position.x *= -1;
    this.rightFore.position.x *= -1;
    this.rightHand.position.x *= -1;
    this.group.add(this.rightUpper, this.rightFore, this.rightHand);

    this.hands.add(this.leftHand, this.rightHand);
    this.group.add(this.hands); // Hands group for carrying

    // Initial pose: Arms extended forward
    this.pose = 'idle'; // idle, grab, carve
  }

  update(delta, isCarving) {
    // Animate arms (simple rotation for articulation)
    const sway = Math.sin(Date.now() * 0.005) * 0.05;
    this.leftUpper.rotation.z = sway;
    this.rightUpper.rotation.z = -sway;

    if (isCarving) {
      this.pose = 'carve'; // Bend elbows for tool use
      this.leftFore.rotation.x = Math.sin(Date.now() * 0.01) * 0.3; // Saw motion
    } else if (this.carriedItem) {
      this.pose = 'grab'; // Hands close around item
      this.hands.scale.setScalar(0.9);
    } else {
      this.pose = 'idle';
      this.hands.scale.setScalar(1);
    }
  }

  pickup(item) {
    this.carriedItem = item;
    this.scene.remove(item); // Attach to hands
    this.hands.add(item);
    item.position.set(0, 0, -1); // Hold out front
  }
}
