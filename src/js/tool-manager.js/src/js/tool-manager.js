// src/js/tool-manager.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';

export class ToolManager {
  constructor(player) {
    this.player = player;
    this.equippedTool = null;

    this.tools = {
      chisel: {
        name: "Wood Chisel",
        toolType: "chisel",
        associatedDiscipline: "carving",
        compatibleMaterials: ["wood", "stone"],
        possibleActions: ["carve", "etch"],
        gripPose: { pos: new THREE.Vector3(0.25, -0.12, -0.35), rot: new THREE.Euler(0, 0, Math.PI / 2) }
      },
      brush: {
        name: "Paint Brush",
        toolType: "brush",
        associatedDiscipline: "painting",
        compatibleMaterials: ["canvas", "furniture", "wood"],
        possibleActions: ["paint", "blend"],
        gripPose: { pos: new THREE.Vector3(0.18, -0.15, -0.28), rot: new THREE.Euler(0, 0, 0) }
      },
      hammer: {
        name: "Claw Hammer",
        toolType: "hammer",
        associatedDiscipline: "building",
        compatibleMaterials: ["wood_plank", "nail", "metal"],
        possibleActions: ["assemble", "nail"],
        gripPose: { pos: new THREE.Vector3(0.1, -0.25, -0.4), rot: new THREE.Euler(Math.PI / 2, 0, 0) }
      }
    };
  }

  equip(toolType) {
    if (!this.tools[toolType]) return false;
    this.equippedTool = this.tools[toolType];
    this.applyGripPose();
    return true;
  }

  applyGripPose() {
    if (!this.equippedTool || !this.player.holdingItem) return;
    const { pos, rot } = this.equippedTool.gripPose;
    this.player.holdingItem.position.copy(pos);
    this.player.holdingItem.rotation.copy(rot);
  }

  getCurrentAction() {
    return this.equippedTool?.possibleActions[0] || null;
  }

  isCompatibleWith(workpiece) {
    if (!this.equippedTool || !workpiece?.userData?.materialType) return false;
    return this.equippedTool.compatibleMaterials.includes(workpiece.userData.materialType);
  }
}
