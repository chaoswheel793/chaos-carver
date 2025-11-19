// src/js/interaction-manager.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';

export class InteractionManager {
  constructor(game) {
    this.game = game;
    this.raycaster = new THREE.Raycaster();
    this.hovered = null;
  }

  update() {
    this.raycaster.setFromCamera(new THREE.Vector2(), this.game.camera);
    const hits = this.raycaster.intersectObjects(this.game.scene.children, true);
    let target = null;

    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && !obj.userData.isInteractable) obj = obj.parent;
      if (obj?.userData.isInteractable) target = obj;
    }

    if (this.hovered && this.hovered !== target) {
      this.hovered.material.emissive?.setHex(this.hovered.userData.origEmissive || 0x000000);
    }
    if (target && target !== this.hovered) {
      if (!target.userData.origEmissive) {
        target.userData.origEmissive = target.material.emissive?.getHex() || 0;
      }
      target.material.emissive?.setHex(0x555500);
    }
    this.hovered = target;
    return target;
  }
}
