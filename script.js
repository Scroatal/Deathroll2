import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.150.1/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'https://unpkg.com/three@0.150.1/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://unpkg.com/three@0.150.1/examples/jsm/geometries/TextGeometry.js';
import * as CANNON from 'https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js';

// --- Game Elements (DOM) ---
const player1RollDisplay = document.getElementById('player1Roll');
const player2RollDisplay = document.getElementById('player2Roll');
const turnDisplay = document.getElementById('turn');
const rollButton = document.getElementById('roll');
const rollResultDisplay = document.getElementById('rollResult');
const restartButton = document.getElementById('restart');

// --- Game Logic Variables ---
let currentPlayer = 1;
let currentMaxRoll = 500;

// --- Three.js Setup ---
const canvas = document.getElementById('bg');
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x000000); // Keep transparent to see HTML background
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); // Use existing canvas, enable alpha and antialias
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(0, 10, 25); // Adjusted camera position

// --- Physics World Setup ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
const clock = new THREE.Clock(); // Clock for physics step

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Slightly brighter ambient
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7); // Adjusted position
scene.add(directionalLight);

// --- Floor ---
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide }); // Darker floor
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -1; // Position floor slightly below origin
scene.add(floorMesh);

const floorBody = new CANNON.Body({
    mass: 0, // Static body
    shape: new CANNON.Plane(),
});
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
floorBody.position.copy(floorMesh.position); // Match mesh position
world.addBody(floorBody);

// --- Dice ---
const dieRadius = 2; // Smaller die
const dieGeometry = new THREE.IcosahedronGeometry(dieRadius, 3); // Smoother sphere
const dieMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.3, roughness: 0.6 });
const dieMesh = new THREE.Mesh(dieGeometry, dieMaterial);
dieMesh.position.y = 5; // Start die above the floor
scene.add(dieMesh);

const dieBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(dieRadius),
    position: new CANNON.Vec3(0, 5, 0), // Initial physics position
    angularDamping: 0.5, // Add some damping to stop rolling eventually
    linearDamping: 0.1
});
world.addBody(dieBody);

// --- Text ---
const fontLoader = new FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const textGeometry = new TextGeometry('DEATHROLL', {
        font: font,
        size: 2,
        height: 0.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelOffset: 0,
        bevelSegments: 5
    });
    textGeometry.center(); // Center the text geometry
    const textMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeff, metalness: 0.5, roughness: 0.4 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 15, -10); // Position text
    scene.add(textMesh);
});

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0); // Point controls towards the center area

// --- Helper Functions ---
function updateRollButtonText() {
    rollButton.textContent = `Roll out of ${currentMaxRoll}`;
}

// Physics roll function
function rollDieVisual() {
    // Apply impulse and torque for a more realistic roll
    const impulseStrength = 15;
    const torqueStrength = 10;
    const impulse = new CANNON.Vec3(
        (Math.random() - 0.5) * impulseStrength,
        Math.random() * impulseStrength * 0.5 + 5, // Add some upward force
        (Math.random() - 0.5) * impulseStrength
    );
    const torque = new CANNON.Vec3(
        (Math.random() - 0.5) * torqueStrength,
        (Math.random() - 0.5) * torqueStrength,
        (Math.random() - 0.5) * torqueStrength
    );

    // Apply force at a random point on the sphere's surface
    const point = new CANNON.Vec3(0, dieRadius, 0); // Example point, can be randomized

    dieBody.applyImpulse(impulse, point);
    dieBody.applyTorque(torque);

    // Reset position slightly above floor if it falls through (safety net)
    if (dieBody.position.y < dieRadius - 0.5) {
         dieBody.position.set(Math.random()*2-1, 5, Math.random()*2-1);
         dieBody.velocity.set(0,0,0);
         dieBody.angularVelocity.set(0,0,0);
    }
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    world.step(1 / 60, deltaTime); // Step the physics world

    // Update Three.js mesh position/rotation from physics body
    dieMesh.position.copy(dieBody.position);
    dieMesh.quaternion.copy(dieBody.quaternion);

    controls.update(); // Update orbit controls
    renderer.render(scene, camera); // Render the scene
}

// --- Event Listeners ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

rollButton.addEventListener('click', () => {
    let roll;
    rollDieVisual(); // Trigger the visual dice roll

    if (currentPlayer === 1) {
        roll = Math.floor(Math.random() * currentMaxRoll) + 1;
        player1RollDisplay.innerHTML = `Last Roll:<br>${roll}`;
        rollResultDisplay.textContent = `Player 1 rolled out of ${currentMaxRoll} and got ${roll}`;
        currentMaxRoll = roll;

        // Change die color slightly for player 1
        dieMaterial.color.setHex(0xff4444);

        if (roll === 1) {
            rollResultDisplay.textContent = 'Player 1 loses!';
            restartButton.style.display = 'block';
            rollButton.style.display = 'none';
            return;
        }

        currentPlayer = 2;
        turnDisplay.textContent = 'Turn: Player 2';
        updateRollButtonText();
    } else {
        roll = Math.floor(Math.random() * currentMaxRoll) + 1;
        player2RollDisplay.innerHTML = `Last Roll:<br>${roll}`;
        rollResultDisplay.textContent = `Player 2 rolled out of ${currentMaxRoll} and got ${roll}`;
        currentMaxRoll = roll;

        // Change die color slightly for player 2
        dieMaterial.color.setHex(0x4444ff);

        if (roll === 1) {
            rollResultDisplay.textContent = 'Player 2 loses!';
            restartButton.style.display = 'block';
            rollButton.style.display = 'none';
            return;
        }

        currentPlayer = 1;
        turnDisplay.textContent = 'Turn: Player 1';
        updateRollButtonText();
    }
});

restartButton.addEventListener('click', () => {
    currentPlayer = 1;
    currentMaxRoll = 500;

    player1RollDisplay.innerHTML = 'Last Roll:<br>-'; // Use innerHTML here too
    player2RollDisplay.innerHTML = 'Last Roll:<br>-'; // Use innerHTML here too
    turnDisplay.textContent = 'Turn: Player 1';
    rollResultDisplay.textContent = '';

    restartButton.style.display = 'none';
    rollButton.style.display = 'block';
    updateRollButtonText();

    // Reset physics die position and velocity
    dieBody.position.set(0, 5, 0);
    dieBody.velocity.set(0, 0, 0);
    dieBody.angularVelocity.set(0, 0, 0);
    dieMaterial.color.setHex(0xff4444); // Reset color
});

// --- Initial Setup Calls ---
updateRollButtonText(); // Set initial button text
animate(); // Start the animation loop