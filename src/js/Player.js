import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

export class Player {
  constructor(camera, scene, playerRoot) {
    this.camera = camera;
    this.scene = scene;
    this.playerRoot = playerRoot;
    this.move = { forward: false, backward: false, left: false, right: false };
    this.holding = null;
    this.canGrab = true;
    this.grabDistance = 2.5;

    // Hands
    this.hands = new THREE.Group();
    this.camera.add(this.hands);

    const armGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.6, 8);
    const handGeo = new THREE.SphereGeometry(0.08, 12, 8);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });

    const leftArm = new THREE.Mesh(armGeo, skinMat);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    const rightHand = new THREE.Mesh(handGeo, skinMat);

    leftArm.position.set(-0.25, -0.4, -0.4);
    leftHand.position.set(-0.25, -0.7, -0.4);
    rightArm.position.set(0.25, -0.4, -0.4);
    rightHand.position.set(0.25, -0.7, -0.4);
    leftArm.rotation.x = rightArm.rotation.x = 0.4;

    this.hands.add(leftArm, leftHand, rightArm, rightHand);

    this.grabPoint = new THREE.Object3D();
    this.grabPoint.position.set(0.25, -0.6, -0.5);
    this.camera.add(this.grabPoint);

    this.raycaster = new THREE.Raycaster();
  }

  update(delta, keys, playerRoot) {
    this.move.forward  = keys['KeyW'] || keys['ArrowUp'];
    this.move.backward = keys['KeyS'] || keys['ArrowDown'];
    this.move.left     = keys['KeyA'] || keys['ArrowLeft'];
    this.move.right    = keys['KeyD'] || keys['ArrowRight'];

    const direction = new THREE.Vector3();
    direction.z = Number(this.move.forward) - Number(this.move.backward);
    direction.x = Number(this.move.left) - Number(this.move.right);
    direction.normalize();

    if (direction.lengthSq() > 0) {
      const speed = 6.0 * delta;
      playerRoot.translateX(direction.x * speed);
      playerRoot.translateZ(direction.z * speed);
    }
  }

  tryGrab(interactables) {
    if (!this.canGrab || this.holding) return;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(interactables, true);
    if (hits.length > 0 && hits[0].distance < this.grabDistance) {
      let obj = hits[0].object;
      while (obj && !obj.userData?.isInteractable) obj = obj.parent;
      if (obj?.userData?.isInteractable) {
        this.holding = obj;
        this.holding.oldParent = obj.parent;
        this.grabPoint.add(obj);
        obj.position.set(0, 0, 0);
        obj.rotation.set(0, Math.PI, 0);
        this.canGrab = false;
        setTimeout(() => this.canGrab = true, 300);
      }
    }
  }

  drop() {
    if (!this.holding) return;
    this.holding.oldParent.add(this.holding);
    this.holding.position.copy(this.holding.oldParent.position);
    this.holding = null;
  }
}
