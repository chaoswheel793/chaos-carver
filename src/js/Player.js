import * as THREE from 'three';

export class Player {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.holding = null;
    this.canGrab = true;

    // Visible arms – Metroid Prime style, relaxed and lowered
    this.arms = new THREE.Group();
    this.camera.add(this.arms);

    const armGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.8, 8);
    const handGeo = new THREE.BoxGeometry(0.12, 0.12, 0.15);
    const mat = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });

    this.leftArm = new THREE.Mesh(armGeo, mat);
    this.leftHand = new THREE.Mesh(handGeo, mat);
    this.rightArm = new THREE.Mesh(armGeo, mat);
    this.rightHand = new THREE.Mesh(handGeo, mat);

    this.leftArm.position.set(-0.35, -0.6, -0.5);
    this.leftHand.position.set(-0.35, -1.0, -0.5);
    this.rightArm.position.set(0.35, -0.6, -0.5);
    this.rightHand.position.set(0.35, -1.0, -0.5);

    this.leftArm.rotation.x = 0.4;
    this.rightArm.rotation.x = 0.4;

    this.arms.add(this.leftArm, this.leftHand, this.rightArm, this.rightHand);

    // Grab point in right hand
    this.grabPoint = new THREE.Object3D();
    this.grabPoint.position.set(0.35, -0.9, -0.5);
    this.camera.add(this.grabPoint);

    this.raycaster = new THREE.Raycaster();
  }

  update(delta, keys, playerRoot, controls) {
    // Movement
    const move = new THREE.Vector3();
    if (keys['KeyW']) move.z -= 1;
    if (keys['KeyS']) move.z += 1;
    if (keys['KeyA']) move.x -= 1;
    if (keys['KeyD']) move.x += 1;
    move.normalize().multiplyScalar(6 * delta);
    playerRoot.translateX(move.x);
    playerRoot.translateZ(move.z);

    // Arm idle bob
    const time = performance.now() * 0.001;
    this.arms.position.y = Math.sin(time * 2) * 0.02;
  }

  tryGrab(objects) {
    if (!this.canGrab || this.holding) return;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(objects, true);
    if (hits.length > 0 && hits[0].distance < 3) {
      let obj = hits[0].object;
      while (obj && !obj.userData?.isInteractable) obj = obj.parent;
      if (obj?.userData?.isInteractable) {
        this.holding = obj;
        obj.oldParent = obj.parent;
        this.grabPoint.add(obj);
        obj.position.set(0, 0, 0);
        obj.rotation.set(0, Math.PI, 0);
        this.canGrab = false;
        setTimeout(() => this.canGrab = true, 400);
      }
    }
  }

  drop() {
    if (!this.holding) return;
    this.holding.oldParent.add(this.holding);
    this.holding.position.set(
      this.camera.position.x,
      this.camera.position.y - 0.5,
      this.camera.position.z - 1.5
    );
    this.holding = null;
  }
}
