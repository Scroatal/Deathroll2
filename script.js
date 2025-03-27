import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// Game elements
const player1RollDisplay = document.getElementById('player1Roll');
const player2RollDisplay = document.getElementById('player2Roll');
const turnDisplay = document.getElementById('turn');
const rollButton = document.getElementById('roll');
const rollResultDisplay = document.getElementById('rollResult');
const restartButton = document.getElementById('restart'); // Added reference for restart button

let currentPlayer = 1;
let currentMaxRoll = 500;

// Function to update roll button text
function updateRollButtonText() {
    rollButton.textContent = `Roll out of ${currentMaxRoll}`;
}

// Three.js setup
const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// 90s-style lights
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xff00ff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const pointLight2 = new THREE.PointLight(0x00ffff, 1, 100);
pointLight2.position.set(-10, -10, 10);
scene.add(pointLight2);

// Create a grid
const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

// Create particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Create dice
const diceGeometry = new THREE.BoxGeometry(5, 5, 5);
const diceMaterial = new THREE.MeshPhongMaterial({
    color: 0xff0000,
    shininess: 100,
    specular: 0xffffff
});
const dice = new THREE.Mesh(diceGeometry, diceMaterial);
scene.add(dice);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate particles
    particlesMesh.rotation.x += 0.0005;
    particlesMesh.rotation.y += 0.0005;

    // Rotate dice
    dice.rotation.x += 0.01;
    dice.rotation.y += 0.01;

    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game logic
updateRollButtonText(); // Set initial button text

rollButton.addEventListener('click', () => {
    let roll;
    if (currentPlayer === 1) {
        roll = Math.floor(Math.random() * currentMaxRoll) + 1;
        player1RollDisplay.textContent = `Last Roll: ${roll}`;

        rollResultDisplay.textContent = `Player 1 rolled out of ${currentMaxRoll} and got ${roll}`;
        currentMaxRoll = roll;

        // Animate dice
        dice.material.color.setHex(0xff0000);
        dice.scale.set(1.5, 1.5, 1.5);
        setTimeout(() => dice.scale.set(1, 1, 1), 500);

        if (roll === 1) { // Check against roll, not player1Number
            rollResultDisplay.textContent = 'Player 1 loses!';
            restartButton.style.display = 'block';
            rollButton.style.display = 'none';
            return;
        }

        currentPlayer = 2;
        turnDisplay.textContent = 'Turn: Player 2';
        updateRollButtonText(); // Update button text for Player 2
    } else {
        roll = Math.floor(Math.random() * currentMaxRoll) + 1;
        player2RollDisplay.textContent = `Last Roll: ${roll}`;

        rollResultDisplay.textContent = `Player 2 rolled out of ${currentMaxRoll} and got ${roll}`;
        currentMaxRoll = roll;

        // Animate dice
        dice.material.color.setHex(0x0000ff);
        dice.scale.set(1.5, 1.5, 1.5);
        setTimeout(() => dice.scale.set(1, 1, 1), 500);

        if (roll === 1) { // Check against roll, not player2Number
            rollResultDisplay.textContent = 'Player 2 loses!';
            restartButton.style.display = 'block';
            rollButton.style.display = 'none';
            return;
        }

        currentPlayer = 1;
        turnDisplay.textContent = 'Turn: Player 1';
        updateRollButtonText(); // Update button text for Player 1
    }
});

// Restart game
restartButton.addEventListener('click', () => {
    currentPlayer = 1;
    currentMaxRoll = 500;

    player1RollDisplay.textContent = 'Last Roll: -';
    player2RollDisplay.textContent = 'Last Roll: -';
    turnDisplay.textContent = 'Turn: Player 1';
    rollResultDisplay.textContent = '';

    restartButton.style.display = 'none';
    rollButton.style.display = 'block';
    updateRollButtonText(); // Update button text on restart
});