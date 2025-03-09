import * as THREE from '../node_modules/three/build/three.module.js';
import { World, Body, Box, Vec3 } from '../node_modules/cannon-es/dist/cannon-es.js';
import PlayerControls from './playerControls.js';
import GameMap from './map.js';
import SkySphere from './skybox.js';
import GameState from './gameState.js';
import Weapon from './weapon.js';
import Enemy from './enemy.js';
import TextureGenerator from './textureGenerator.js';

let camera, scene, renderer, controls, gameMap, skySphere, gameState, weapon, physicsWorld;
let enemies = [];

init();
animate();

async function init() {
    // Create scene
    scene = new THREE.Scene();

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB); // Set background color to sky blue
    document.body.appendChild(renderer.domElement);

    // Add camera to scene
    scene.add(camera);

    // Initialize physics world
    physicsWorld = new World();
    physicsWorld.gravity.set(0, -9.82, 0);

    // Initialize game state
    gameState = new GameState();

    // Create player controls
    controls = new PlayerControls(camera, scene, physicsWorld);

    // Create weapon
    weapon = new Weapon(scene, camera, gameState);

    // Create game map
    gameMap = new GameMap(scene, physicsWorld);

    // Create sky sphere
    skySphere = new SkySphere(scene);

    // Add floor with new texture
    const textureGenerator = new TextureGenerator();
    const floorTexture = textureGenerator.generateCanvasFloorTexture();
    const floorGeometry = new THREE.BoxGeometry(100, 0.1, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Update physics world
    physicsWorld.step(1 / 60);

    // Update controls
    controls.update();

    // Update enemies
    enemies = enemies.filter(enemy => enemy.isAlive);
    enemies.forEach(enemy => enemy.update());

    // Render scene
    renderer.render(scene, camera);

    // Check for game over
    if (gameState.health <= 0) {
        alert('Game Over! Score: ' + gameState.score);
        location.reload();
    }
}