/**
 * Main game initialization and loop
 * FPS shooter game with physics and enemy AI
 */

// Import dependencies
import * as THREE from '/node_modules/three/build/three.module.js';
import { World, Body, Box, Vec3 } from '/node_modules/cannon-es/dist/cannon-es.js';

// Import game components
import PlayerControls from '/src/entities/playerControls.js';
import GameMap from '/src/world/map.js';
import SkySphere from '/src/world/skyboxGenerator.js';
import GameState from '/src/core/gameState.js';
import Weapon from '/src/weapons/weapon.js';
import Enemy from '/src/entities/enemy.js';
import TextureGenerator from '/src/utils/textureGenerator.js';

// Game variables
let camera, scene, renderer, controls, gameMap, skySphere, gameState, weapon, physicsWorld;
let enemies = [];
let lastEnemySpawnTime = 0;
let enemySpawnInterval = 10000; // 10 seconds between enemy spawns
let isGameRunning = false;

// Initialize and start game loop
init();
animate();

/**
 * Initialize the game and set up all components
 */
function init() {
    try {
        // Create scene
        scene = new THREE.Scene();

        // Create camera with proper field of view
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 2, 5);
        camera.lookAt(0, 0, 0);

        // Create renderer with proper settings for performance
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: 'high-performance' 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x87CEEB); // Sky blue background
        document.body.appendChild(renderer.domElement);

        // Initialize physics world with proper settings
        physicsWorld = new World();
        physicsWorld.gravity.set(0, -9.82, 0); // Standard gravity
        physicsWorld.broadphase.useBoundingBoxes = true; // Better performance
        physicsWorld.solver.iterations = 10; // More accurate physics

        // Initialize game state
        gameState = new GameState();

        // Create player controls
        controls = new PlayerControls(camera, scene, physicsWorld);

        // Create weapon system
        weapon = new Weapon(scene, camera, gameState);

        // Generate game environment
        gameMap = new GameMap(scene, physicsWorld);
        skySphere = new SkySphere(scene);

        // Create floor
        createFloor();

        // Set up lighting
        setupLighting();

        // Set event listeners
        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('keydown', handleKeyDown);

        // Mark game as running
        isGameRunning = true;
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}

/**
 * Create the game floor with texture
 */
function createFloor() {
    const textureGenerator = new TextureGenerator();
    const floorTexture = textureGenerator.generateCanvasFloorTexture();
    const floorGeometry = new THREE.BoxGeometry(100, 0.1, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: floorTexture,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    floor.name = 'floor';
    scene.add(floor);
    
    // Add a physics body for the floor
    const floorBody = new Body({
        mass: 0, // Static body
        position: new Vec3(0, -0.05, 0),
        shape: new Box(new Vec3(50, 0.05, 50))
    });
    physicsWorld.addBody(floorBody);
}

/**
 * Set up scene lighting
 */
function setupLighting() {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    // Main directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
}

/**
 * Handle window resize events
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Maintain performance on resize
}

/**
 * Main game loop
 */
function animate() {
    if (!isGameRunning) return;
    
    requestAnimationFrame(animate);
    
    try {
        const deltaTime = 1/60; // Fixed time step
        
        // Update physics world
        physicsWorld.step(deltaTime);
        
        // Update game components
        controls.update();
        weapon.update();
        
        // Spawn enemies periodically
        handleEnemySpawning();
        
        // Update all enemies
        updateEnemies();
        
        // Detect collisions between bullets and enemies
        detectCollisions();
        
        // Render the scene
        renderer.render(scene, camera);
        
        // Check for game over condition
        checkGameOver();
    } catch (error) {
        console.error('Error in animation loop:', error);
    }
}

/**
 * Handle enemy spawning at intervals
 */
function handleEnemySpawning() {
    const now = Date.now();
    if (now - lastEnemySpawnTime > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawnTime = now;
        
        // Decrease spawn interval as game progresses (make it harder)
        enemySpawnInterval = Math.max(3000, enemySpawnInterval - 500);
    }
}

/**
 * Spawn a new enemy at a random position
 * Maximum of 10 enemies at a time
 */
function spawnEnemy() {
    // Check if we've already reached the maximum number of enemies
    const MAX_ENEMIES = 10;
    
    // Filter out dead enemies first to get accurate count of active enemies
    enemies = enemies.filter(enemy => enemy.isAlive);
    
    // Don't spawn if already at max enemies
    if (enemies.length >= MAX_ENEMIES) {
        return;
    }
    
    // Generate random position away from player
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 10; // Between 15-25 units away
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    const position = new THREE.Vector3(x, 1, z);
    const enemy = new Enemy(scene, physicsWorld, position, gameState);
    enemies.push(enemy);
    
    // Debugging info
    console.log(`Spawned enemy. Current count: ${enemies.length}/${MAX_ENEMIES}`);
}

/**
 * Update all enemies and clean up dead ones
 */
function updateEnemies() {
    enemies = enemies.filter(enemy => enemy.isAlive);
    enemies.forEach(enemy => enemy.update());
}

/**
 * Detect collisions between bullets and enemies
 */
function detectCollisions() {
    if (!weapon.bullets || !enemies.length) return;
    
    // Check each bullet against each enemy
    for (let i = weapon.bullets.length - 1; i >= 0; i--) {
        const bullet = weapon.bullets[i];
        
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (!enemy.isAlive) continue;
            
            // Simple distance-based collision detection
            const distance = bullet.mesh.position.distanceTo(enemy.mesh.position);
            if (distance < 1.5) { // Collision radius
                // Deal damage based on current weapon
                enemy.takeDamage(bullet.damage);
                
                // Remove the bullet
                scene.remove(bullet.mesh);
                weapon.bullets.splice(i, 1);
                break;
            }
        }
    }
}

/**
 * Check if game is over and handle game over state
 */
function checkGameOver() {
    if (gameState.health <= 0) {
        isGameRunning = false;
        const finalScore = gameState.score;
        
        // Show game over message
        setTimeout(() => {
            alert(`Game Over! Your final score: ${finalScore}`);
            location.reload();
        }, 100);
    }
}

/**
 * Handle keyboard input for game controls
 */
function handleKeyDown(event) {
    // Reload with R key
    if (event.code === 'KeyR') {
        weapon.reload();
    }
    
    // Add more global keyboard controls here
}