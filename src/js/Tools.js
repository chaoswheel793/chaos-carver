import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

export function createChisel(scene) {
  const chisel = new THREE.Group();

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  );
  handle.position.y = 0.25;

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.02, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 })
  );
  blade.position.y = 0.5;

  chisel.add(handle, blade);
  chisel.scale.set(2, 2, 2); // Bigger for easy grab
  chisel.position.set(0, 0.8, -1); // Right in front
  chisel.userData = { isInteractable: true, toolType: "chisel" };

  scene.add(chisel);
  return chisel;
}
