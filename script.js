import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const distance = 8.79999305638e+16;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.0001, distance * 1.8); // Adjust far clipping plane
const renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true }); // Enable logarithmic depth buffer
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = distance * 1.8;

// Add OrbitControls for user interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping (inertia)
controls.dampingFactor = 0.08; // Damping factor
controls.screenSpacePanning = false; // Disable panning
controls.minDistance = 0.01;
controls.maxDistance = distance * 1.8; // Adjust maxDistance to match far clipping plane
controls.enablePan = false;
controls.enableZoom = true;
controls.autoRotate = true; 
controls.autoRotateSpeed = 0.4;

const starfieldGeometry = new THREE.BufferGeometry();
const starfieldMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1,
  sizeAttenuation: true,
  transparent: true,
  alphaTest: 0.5 // Ensure transparency is handled correctly
});

const starCount = 1e+3;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  const radius = Math.cbrt(Math.random()) * distance; // Random radius within the sphere
  const theta = Math.random() * 2 * Math.PI; // Random angle around the equator
  const phi = Math.acos((Math.random() * 2) - 1); // Random angle from the pole

  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta); // x coordinate
  starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta); // y coordinate
  starPositions[i * 3 + 2] = radius * Math.cos(phi); // z coordinate
}

starfieldGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starfield = new THREE.Points(starfieldGeometry, starfieldMaterial);
scene.add(starfield);

// Add Earth
const earthGeometry = new THREE.SphereGeometry(0.001274198, 32, 32);
const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x008888, side: THREE.DoubleSide });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Add Sun
const sunGeometry = new THREE.SphereGeometry(0.139267797, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, -0.15, 0); // Position the black hole beside the star
scene.add(sun);

// Add Stephenson 2-18
const stephensonGeometry = new THREE.SphereGeometry(299, 256, 256);
const stephensonMaterial = new THREE.MeshBasicMaterial({ color: 0xff4400, side: THREE.DoubleSide });
const stephenson = new THREE.Mesh(stephensonGeometry, stephensonMaterial);
stephenson.position.set(0, -300, 0); // Position the black hole beside the star
scene.add(stephenson);

// Add the black hole (Phoenix A*)
const blackHoleGeometry = new THREE.SphereGeometry(59050, 128, 128);
const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
blackHole.position.set(0, -70000, 0); // Position the black hole beside the star
scene.add(blackHole);

// Add the accretion disk
const accretionDiskGeometry = new THREE.RingGeometry(59100, 350000, 64);
const accretionDiskMaterial = new THREE.MeshBasicMaterial({
  color: 0xffa500,
  side: THREE.DoubleSide,
  opacity: 1, // Reduce opacity to make it less bright
  transparent: true
});
const accretionDisk = new THREE.Mesh(accretionDiskGeometry, accretionDiskMaterial);
accretionDisk.rotation.x = Math.PI / 2; // Rotate the disk to be flat
blackHole.add(accretionDisk);

// Add a semi-transparent sphere slightly larger than the black hole using ShaderMaterial
const outlineGeometry = new THREE.SphereGeometry(59050 * 1.1, 32, 32);
const outlineMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color(0xffa500) },
    opacity: { value: 1 },
    glowIntensity: { value: 80.0 } // Add glow intensity uniform
  },
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float opacity;
    uniform float glowIntensity; // Add glow intensity uniform
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0) * glowIntensity; // Increase intensity with glow
      gl_FragColor = vec4(color * intensity, opacity);
    }
  `,
  transparent: true,
});

const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
outline.position.set(0, -70000, 0); // Position the outline at the same location as the black hole
scene.add(outline);

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8, // Increase strength for more glow
  1.0, // radius
  0.1 // threshold
);
composer.addPass(bloomPass);

// Add progress bar
const progressBarContainer = document.createElement('div');
progressBarContainer.id = 'progress-container';
document.body.appendChild(progressBarContainer);

const progressBar = document.createElement('div');
progressBar.id = 'progress-bar';
progressBarContainer.appendChild(progressBar);

// Add distance display
const distanceDisplay = document.createElement('div');
distanceDisplay.id = 'distance-display';
distanceDisplay.style.position = 'absolute';
distanceDisplay.style.top = '32px';
distanceDisplay.style.right = '10px';
distanceDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
distanceDisplay.style.padding = '6px';
document.body.appendChild(distanceDisplay);

let targetZoom = camera.position.distanceTo(controls.target);
let zooming = false;
let isDragging = false;

function updateProgressBar() {
  const minZoom = controls.minDistance;
  const maxZoom = controls.maxDistance;
  const currentZoom = camera.position.distanceTo(controls.target);
  const logMinZoom = Math.log(minZoom);
  const logMaxZoom = Math.log(maxZoom);
  const logCurrentZoom = Math.log(currentZoom);
  const zoomPercentage = ((logCurrentZoom - logMinZoom) / (logMaxZoom - logMinZoom)) * 100;
  progressBar.style.width = `${zoomPercentage}%`;
}

function updateDistanceDisplay() {
  const currentZoom = camera.position.distanceTo(controls.target) * 1e+7;
  distanceDisplay.innerText = `Distance: ${(currentZoom <= distance * 1e+7) ? (currentZoom.toFixed(2)) : '∞'} km`;
}

const objects = [
  { name: 'Earth', distance: 0.001274198 * 10 },
  { name: 'Sun', distance: 0.139267797 * 10 },
  { name: 'Stephenson', distance: 299 * 10 },
  { name: 'Phoenix', distance: 59050 * 10 },
  { name: 'Universe', distance: distance * 1.8 }
];

function updateButtonStates() {
  const currentZoom = camera.position.distanceTo(controls.target);
  objects.forEach(obj => {
    if (Math.abs(currentZoom - obj.distance) < obj.distance * 0.98) {
      document.getElementById(obj.name.toLowerCase()).classList.add('active');
    } else {
      document.getElementById(obj.name.toLowerCase()).classList.remove('active');
    }
  });
}

function zoomTo(target) {
  let targetDistance = objects.find(obj => obj.name.toLowerCase() === target).distance;

  targetZoom = targetDistance;
  zooming = true;
}

// Make zoomTo function available globally
window.zoomTo = zoomTo;

function onMouseDown() {
  isDragging = true;
}

function onMouseMove(event) {
  if (isDragging) {
    const progressBarRect = progressBarContainer.getBoundingClientRect();
    const mouseX = event.clientX - progressBarRect.left;
    const percentage = Math.min(Math.max(mouseX / progressBarRect.width, 0), 1);
    const minZoom = controls.minDistance;
    const maxZoom = controls.maxDistance;
    const logMinZoom = Math.log(minZoom);
    const logMaxZoom = Math.log(maxZoom);
    const logTargetZoom = logMinZoom + percentage * (logMaxZoom - logMinZoom);
    targetZoom = Math.exp(logTargetZoom); // Update targetZoom correctly
    zooming = true; // Ensure zooming is interpolated
  }
}

function onMouseUp() {
  isDragging = false;
}

progressBarContainer.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('wheel', onScroll);

function onScroll() {
  zooming = false;
}

function animate() {
  requestAnimationFrame(animate);

  controls.update(); // Update controls
  updateProgressBar(); // Update progress bar
  updateDistanceDisplay(); // Update distance display
  updateButtonStates(); // Update button states

  if (zooming) {
    const currentDistance = camera.position.distanceTo(controls.target);
    const zoomStep = 0.2 * currentDistance; // Adjust step size based on current distance
    let newDistance;

    if (currentDistance < targetZoom) {
      newDistance = Math.min(currentDistance + zoomStep, targetZoom);
    } else {
      newDistance = Math.max(currentDistance - zoomStep, targetZoom);
    }

    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).add(direction.multiplyScalar(newDistance));

    if (Math.abs(targetZoom - newDistance) < 0.01) { // Adjust precision to stop zooming
      zooming = false;
    }
    updateProgressBar(); // Update progress bar during zooming
  }

  composer.render(); // Use composer instead of renderer
}

animate();