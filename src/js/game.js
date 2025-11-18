// Replace the simple block with SDF target block
const blockGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8, 32, 32, 32); // High subdiv for smooth SDF reveal
const blockMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xDEB887, // Burlywood wood tint
  roughness: 0.4,
  metalness: 0.1,
  transmission: 0.9, // Glass-like transparency
  opacity: 0.3,      // Semi-transparent
  transparent: true,
  side: THREE.DoubleSide, // Render inner/outer faces
  clearcoat: 0.5,
  clearcoatRoughness: 0.1
});

// Custom ShaderMaterial for SDF target reveal (extends physical)
const targetMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTargetShape: { value: 0.0 }, // 0=sphere, 1=cube (switch via UI later)
    uHintThickness: { value: 0.05 }, // SDF reveal width
    uTime: { value: 0.0 } // Animate glow
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTargetShape;
    uniform float uHintThickness;
    uniform float uTime;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    // SDF Functions: Define target shapes procedurally
    float sdSphere(vec3 p, float r) {
      return length(p) - r;
    }
    float sdBox(vec3 p, vec3 b) {
      vec3 q = abs(p) - b;
      return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
    }
    float sdfTarget(vec3 p) {
      if (uTargetShape < 0.5) {
        return sdSphere(p * 0.8, 0.3); // Sphere inside block
      } else {
        return sdBox(p * 0.8, vec3(0.25)); // Cube inside block
      }
    }

    void main() {
      vec3 pos = normalize(vWorldPosition); // Normalized for SDF
      float dist = sdfTarget(pos); // Distance to target

      // Reveal: Glow where close to target surface
      float hint = 1.0 - smoothstep(0.0, uHintThickness, abs(dist));
      vec3 glowColor = vec3(1.0, 0.8, 0.4) * hint * (0.5 + 0.5 * sin(uTime * 3.0)); // Pulsing gold

      // Fake wood refraction tint + emission
      vec3 woodTint = vec3(0.87, 0.72, 0.52);
      gl_FragColor = vec4(mix(woodTint * 0.3, glowColor, hint), 0.6);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide
});

const woodBlock = new THREE.Mesh(blockGeometry, blockMaterial);
woodBlock.customDepthMaterial = targetMaterial; // For shadows/depth
woodBlock.position.set(0, 1.1, 0);
woodBlock.userData = { type: 'carvable', targetSDF: true };
benchGroup.add(woodBlock);
this.game.workshopItems.push(woodBlock);

// Animate SDF glow in update()
this.game.updateSDFTime = (delta) => {
  targetMaterial.uniforms.uTime.value += delta;
};
