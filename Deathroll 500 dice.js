import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import * as CANNON from 'cannon-es';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Physics World
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Dice Geometry (Simulating a D500 with an icosphere)
const dieGeometry = new THREE.IcosahedronGeometry(3, 5); // Higher subdivisions for round shape
const dieMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: false });
const dieMesh = new THREE.Mesh(dieGeometry, dieMaterial);
scene.add(dieMesh);

// Physics Body
const dieBody = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(3) });
dieBody.position.set(0, 10, 0);
world.addBody(dieBody);

// Floor
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
scene.add(floorMesh);

const floorBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
});
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(floorBody);

// Rolling Function
function rollDie() {
    dieBody.velocity.set(Math.random() * 10 - 5, Math.random() * 10, Math.random() * 10 - 5);
    dieBody.angularVelocity.set(Math.random() * 5, Math.random() * 5, Math.random() * 5);
}

// Text Display
const fontLoader = new FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const textGeometry = new TextGeometry('DEATHROLL', {
        font: font,
        size: 2,
        height: 0.5,
    });
    const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(-5, 5, -10);
    scene.add(textMesh);
});

// Animation Loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60);
    dieMesh.position.copy(dieBody.position);
    dieMesh.quaternion.copy(dieBody.quaternion);
    renderer.render(scene, camera);
}
animate();

// User Interaction
window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') rollDie();
});

// Camera Controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 10, 20);
controls.update();

// Handle Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
