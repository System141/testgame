/**
 * PlayerControls - Handles player movement, physics, and camera controls
 * 
 * This class manages all aspects of player interaction including:
 * - Keyboard and mouse input handling
 * - Player physics and collision detection
 * - Animation states (idle, walking, jumping)
 * - Camera positioning and mouse look controls
 */

import * as THREE from '/node_modules/three/build/three.module.js';
import { Body, Box, Vec3 } from '/node_modules/cannon-es/dist/cannon-es.js';

export default class PlayerControls {
    /**
     * Creates a new player controller
     * @param {THREE.PerspectiveCamera} camera - The game camera
     * @param {THREE.Scene} scene - The game scene
     * @param {CANNON.World} physicsWorld - The physics world
     */
    constructor(camera, scene, physicsWorld) {
        try {
            // Store references to core game components
            this.camera = camera;
            this.scene = scene;
            this.physicsWorld = physicsWorld;
            
            // Define player properties
            this.player = {
                position: camera.position.clone(),
                speed: 5.0,
                jumpForce: 5.0,
                velocity: new THREE.Vector3(0, 0, 0),
                isOnGround: true,
                radius: 0.5,
                height: 1.8,
                eyeHeight: 1.6,
                health: 100,
                maxHealth: 100
            };
            
            // Initialize input tracking
            this.keys = {};
            this.mouse = new THREE.Vector2();
            this.mouseLocked = false;
            this.isPaused = false;
            this.lockButton = null;
            
            // Camera rotation state
            this.yaw = 0;
            this.pitch = 0;
            this.lookSensitivity = 0.002;
            
            // Collision objects cache for performance
            this.objects = [];
            this.collectCollidableObjects();
            
            // Create physics body for the player
            this.createPhysicsBody();
            
            // Setup player model and animations
            this.createPlayerModel();
            
            // Set up event listeners
            this.initControls();
        } catch (error) {
            console.error('Error initializing player controls:', error);
        }
    }
    
    /**
     * Collects all objects in the scene that can be collided with
     */
    collectCollidableObjects() {
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh && 
                object !== this.camera && 
                object.name !== 'bullet' && 
                object.name !== 'muzzleFlash') {
                this.objects.push(object);
            }
        });
    }
    
    /**
     * Creates the physics body for the player
     */
    createPhysicsBody() {
        // Create a physics body for player collision detection
        this.playerBody = new Body({
            mass: 1,
            position: new Vec3(
                this.player.position.x, 
                this.player.position.y, 
                this.player.position.z
            ),
            shape: new Box(new Vec3(
                this.player.radius, 
                this.player.height / 2, 
                this.player.radius
            )),
            fixedRotation: true, // Prevent player from rotating
            linearDamping: 0.9 // Add some friction
        });
        
        // Allow detecting when player is on ground
        this.playerBody.addEventListener('collide', (event) => {
            // Check if collision is with ground or floor
            const contact = event.contact;
            if (contact.ni.y > 0.5) { // Normal points up
                this.player.isOnGround = true;
            }
        });
        
        this.physicsWorld.addBody(this.playerBody);
    }

    /**
     * Creates the player's visual model and sets up animations
     * The model is invisible since we're using first-person view
     * but still needed for animations and shadows
     */
    createPlayerModel() {
        try {
            // Create player mesh with proper dimensions
            const geometry = new THREE.BoxGeometry(0.5, this.player.height, 0.5);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x00ff00,
                visible: false,  // Invisible in first-person view
                transparent: true,
                opacity: 0
            });
            
            // Create the model and position it
            this.playerModel = new THREE.Mesh(geometry, material);
            this.playerModel.position.set(
                this.player.position.x, 
                this.player.position.y - (this.player.height/2 - 0.1), 
                this.player.position.z
            );
            this.playerModel.castShadow = true;
            this.playerModel.name = 'player';
            this.scene.add(this.playerModel);

            // Set up animation mixer and animation clips
            this.setupAnimations();
        } catch (error) {
            console.error('Error creating player model:', error);
        }
    }
    
    /**
     * Sets up player animations for different states
     */
    setupAnimations() {
        // Create animation mixer
        this.mixer = new THREE.AnimationMixer(this.playerModel);
        
        // Create animation clips for different player states
        this.animations = {
            idle: this.createIdleAnimation(),
            walk: this.createWalkAnimation(),
            jump: this.createJumpAnimation(),
            sprint: this.createSprintAnimation()
        };
        
        // Configure animation transitions
        Object.values(this.animations).forEach(anim => {
            anim.setEffectiveTimeScale(1.0);
            anim.setEffectiveWeight(1.0);
            anim.enabled = true;
        });
        
        // Start with idle animation
        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
    }

    /**
     * Creates the idle animation (minimal movement)
     * @returns {THREE.AnimationAction} The idle animation
     */
    createIdleAnimation() {
        const idleClip = new THREE.AnimationClip('idle', -1, [
            // Small breathing motion
            new THREE.VectorKeyframeTrack(
                '.position', 
                [0, 0.5, 1], 
                [0, 0, 0, 0, 0.02, 0, 0, 0, 0]
            ),
            // Slight rotation for natural looking stance
            new THREE.QuaternionKeyframeTrack(
                '.quaternion', 
                [0, 1], 
                [0, 0, 0, 1, 0, 0, 0, 1]
            )
        ]);
        return this.mixer.clipAction(idleClip);
    }

    /**
     * Creates the walking animation
     * @returns {THREE.AnimationAction} The walk animation
     */
    createWalkAnimation() {
        const walkClip = new THREE.AnimationClip('walk', -1, [
            // Vertical bobbing motion
            new THREE.VectorKeyframeTrack(
                '.position', 
                [0, 0.25, 0.5, 0.75, 1], 
                [0, 0, 0, 0, 0.05, 0, 0, -0.05, 0, 0, 0, 0, 0, 0, 0]
            ),
            // Slight rotation for walking sway
            new THREE.QuaternionKeyframeTrack(
                '.quaternion', 
                [0, 0.5, 1], 
                [0, 0, -0.02, 0.9998, 0, 0, 0.02, 0.9998, 0, 0, -0.02, 0.9998]
            )
        ]);
        
        const action = this.mixer.clipAction(walkClip);
        action.setDuration(0.5); // Faster animation cycle
        return action;
    }

    /**
     * Creates the jumping animation
     * @returns {THREE.AnimationAction} The jump animation
     */
    createJumpAnimation() {
        const jumpClip = new THREE.AnimationClip('jump', -1, [
            // Strong upward motion followed by fall
            new THREE.VectorKeyframeTrack(
                '.position', 
                [0, 0.2, 0.7, 1], 
                [0, 0, 0, 0, 0.2, 0, 0, 0.1, 0, 0, 0, 0]
            ),
            // Slight forward tilt then backward tilt
            new THREE.QuaternionKeyframeTrack(
                '.quaternion', 
                [0, 0.5, 1], 
                [0, 0.05, 0, 0.998, 0, -0.05, 0, 0.998, 0, 0, 0, 1]
            )
        ]);
        
        const action = this.mixer.clipAction(jumpClip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        return action;
    }
    
    /**
     * Creates the sprint animation (faster walk)
     * @returns {THREE.AnimationAction} The sprint animation
     */
    createSprintAnimation() {
        const sprintClip = new THREE.AnimationClip('sprint', -1, [
            // More pronounced bobbing for sprint
            new THREE.VectorKeyframeTrack(
                '.position', 
                [0, 0.25, 0.5, 0.75, 1], 
                [0, 0, 0, 0, 0.08, 0, 0, -0.08, 0, 0, 0.08, 0, 0, 0, 0]
            ),
            // More pronounced tilt for sprint
            new THREE.QuaternionKeyframeTrack(
                '.quaternion', 
                [0, 0.5, 1], 
                [0, 0, -0.03, 0.9995, 0, 0, 0.03, 0.9995, 0, 0, -0.03, 0.9995]
            )
        ]);
        
        const action = this.mixer.clipAction(sprintClip);
        action.setDuration(0.4); // Even faster animation cycle
        return action;
    }

    /**
     * Initializes all input controls and event listeners
     */
    initControls() {
        try {
            // Create play button for mouse lock
            this.createPlayButton();
            
            // Set up all event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing controls:', error);
        }
    }
    
    /**
     * Creates the start game button that locks the mouse
     */
    createPlayButton() {
        this.lockButton = document.createElement('button');
        this.lockButton.textContent = 'Click to Play';
        this.lockButton.style.position = 'absolute';
        this.lockButton.style.top = '50%';
        this.lockButton.style.left = '50%';
        this.lockButton.style.transform = 'translate(-50%, -50%)';
        this.lockButton.style.padding = '12px 24px';
        this.lockButton.style.fontSize = '24px';
        this.lockButton.style.backgroundColor = '#4CAF50';
        this.lockButton.style.color = 'white';
        this.lockButton.style.border = 'none';
        this.lockButton.style.borderRadius = '5px';
        this.lockButton.style.cursor = 'pointer';
        this.lockButton.style.zIndex = '1000';
        document.body.appendChild(this.lockButton);
    }
    
    /**
     * Sets up all event listeners for player controls
     */
    setupEventListeners() {
        // Mouse lock controls
        this.lockButton.addEventListener('click', () => this.lockMouse());
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('pointerlockerror', () => this.onPointerLockError());
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Mouse look controls
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        
        // Window state controls
        window.addEventListener('blur', () => this.onWindowBlur());
        window.addEventListener('focus', () => this.onWindowFocus());
    }

    /**
     * Locks the mouse pointer to enable camera controls
     */
    lockMouse() {
        this.lockButton.style.display = 'none';
        document.body.requestPointerLock();
    }

    /**
     * Unlocks the mouse pointer when game is paused
     */
    unlockMouse() {
        document.exitPointerLock();
        this.mouseLocked = false;
        this.lockButton.style.display = 'block';
        
        // Reset all input states
        this.keys = {};
        this.mouse.set(0, 0);
    }

    /**
     * Handles pointer lock state changes
     */
    onPointerLockChange() {
        if (document.pointerLockElement === document.body) {
            this.mouseLocked = true;
            console.log('Mouse locked - game active');
        } else {
            this.unlockMouse();
            console.log('Mouse unlocked - game paused');
        }
    }

    /**
     * Handles pointer lock errors
     */
    onPointerLockError() {
        console.error('Error locking pointer');
        this.lockButton.style.display = 'block';
    }

    /**
     * Handles key down events for movement and actions
     * @param {KeyboardEvent} event - The keyboard event
     */
    onKeyDown(event) {
        // Prevent default behavior for gameplay keys
        if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft'].includes(event.code)) {
            event.preventDefault();
        }
        
        this.keys[event.code] = true;
        
        // Handle jumping
        if (event.code === 'Space' && this.player.isOnGround) {
            this.playerBody.velocity.y = this.player.jumpForce;
            this.player.isOnGround = false;
            this.playAnimation('jump');
        }
        
        // Handle sprinting
        if (event.code === 'ShiftLeft') {
            this.player.speed = 8.0; // Increased speed when sprinting
            
            // Switch to sprint animation if moving
            if (this.isMoving()) {
                this.playAnimation('sprint');
            }
        }
    }

    /**
     * Handles key up events
     * @param {KeyboardEvent} event - The keyboard event
     */
    onKeyUp(event) {
        this.keys[event.code] = false;
        
        // Reset speed when sprint key released
        if (event.code === 'ShiftLeft') {
            this.player.speed = 5.0;
            
            // Switch back to walk animation if still moving
            if (this.isMoving()) {
                this.playAnimation('walk');
            }
        }
    }
    
    /**
     * Helper to check if player is moving
     * @returns {boolean} True if player is pressing movement keys
     */
    isMoving() {
        return this.keys['KeyW'] || this.keys['KeyS'] || 
               this.keys['KeyA'] || this.keys['KeyD'];
    }

    /**
     * Handles mouse movement for camera control
     * @param {MouseEvent} event - The mouse event
     */
    onMouseMove(event) {
        if (this.mouseLocked) {
            // Apply mouse sensitivity
            this.yaw -= event.movementX * this.lookSensitivity;
            this.pitch -= event.movementY * this.lookSensitivity;
            
            // Clamp vertical look angle to prevent flipping
            this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
            
            // Apply rotation to camera
            this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
        }
    }

    /**
     * Handles window blur event (tab switching, etc)
     */
    onWindowBlur() {
        this.isPaused = true;
        this.unlockMouse();
    }

    /**
     * Handles window focus event
     */
    onWindowFocus() {
        this.isPaused = false;
    }

    /**
     * Transitions to a new animation state
     * @param {string} name - The name of the animation to play
     */
    playAnimation(name) {
        if (!this.animations[name]) {
            console.warn(`Animation "${name}" not found`);
            return;
        }
        
        if (this.currentAnimation && this.currentAnimation !== this.animations[name]) {
            // Create smooth transition between animations
            const fromAction = this.currentAnimation;
            const toAction = this.animations[name];
            
            // Quick crossfade
            fromAction.fadeOut(0.2);
            toAction.reset().fadeIn(0.2).play();
            
            this.currentAnimation = toAction;
        } else if (!this.currentAnimation) {
            // Just play if no current animation
            this.currentAnimation = this.animations[name];
            this.currentAnimation.play();
        }
    }

    /**
     * Main update method called every frame
     * Handles player movement, physics, and animation
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime = 1/60) {
        // Skip update if game is paused or mouse not locked
        if (this.isPaused || !this.mouseLocked) return;

        try {
            // Calculate movement direction vectors
            this.updateMovement(deltaTime);
            
            // Apply gravity and ground check
            this.updatePhysics(deltaTime);
            
            // Handle collisions with objects
            this.handleCollisions();
            
            // Update model and camera positions
            this.updatePositions();
            
            // Update animations
            if (this.mixer) {
                this.mixer.update(deltaTime);
            }
        } catch (error) {
            console.error('Error in player update:', error);
        }
    }
    
    /**
     * Updates player movement based on input
     * @param {number} deltaTime - Time since last update
     */
    updateMovement(deltaTime) {
        // Get normalized direction vectors
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        right.y = 0;
        right.normalize();

        // Calculate velocity based on input
        const velocity = new Vec3();
        let isMoving = false;
        
        // Forward movement
        if (this.keys['KeyW']) {
            velocity.x += forward.x * this.player.speed;
            velocity.z += forward.z * this.player.speed;
            isMoving = true;
        }
        
        // Backward movement
        if (this.keys['KeyS']) {
            velocity.x -= forward.x * this.player.speed;
            velocity.z -= forward.z * this.player.speed;
            isMoving = true;
        }
        
        // Left movement
        if (this.keys['KeyA']) {
            velocity.x -= right.x * this.player.speed;
            velocity.z -= right.z * this.player.speed;
            isMoving = true;
        }
        
        // Right movement
        if (this.keys['KeyD']) {
            velocity.x += right.x * this.player.speed;
            velocity.z += right.z * this.player.speed;
            isMoving = true;
        }
        
        // Normalize diagonal movement to prevent faster diagonal speed
        if (isMoving) {
            const length = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            if (length > 0) {
                velocity.x = (velocity.x / length) * this.player.speed;
                velocity.z = (velocity.z / length) * this.player.speed;
            }
            
            // Choose the right animation based on speed
            this.playAnimation(this.keys['ShiftLeft'] ? 'sprint' : 'walk');
        } else {
            // If not moving, play idle animation
            this.playAnimation('idle');
        }

        // Apply horizontal velocity to player body
        this.playerBody.velocity.x = velocity.x;
        this.playerBody.velocity.z = velocity.z;
    }
    
    /**
     * Updates player physics (gravity, jumping, etc)
     * @param {number} deltaTime - Time since last update
     */
    updatePhysics(deltaTime) {
        // Apply gravity
        this.playerBody.velocity.y -= 9.82 * deltaTime; // Earth gravity
        
        // Check if player is on ground
        if (this.playerBody.position.y <= 1) {
            this.playerBody.position.y = 1;
            this.playerBody.velocity.y = 0;
            this.player.isOnGround = true;
            
            // If was jumping and now landed, switch back to appropriate animation
            if (this.currentAnimation === this.animations.jump) {
                this.playAnimation(this.isMoving() ? 
                    (this.keys['ShiftLeft'] ? 'sprint' : 'walk') : 'idle');
            }
        }
    }
    
    /**
     * Handles collisions between player and objects in scene
     */
    handleCollisions() {
        // Skip if no objects to collide with
        if (!this.objects.length) return;
        
        // Create bounding box for player (cached for performance)
        const playerCenter = new THREE.Vector3(
            this.playerBody.position.x, 
            this.playerBody.position.y, 
            this.playerBody.position.z
        );
        const playerSize = new THREE.Vector3(
            this.player.radius * 2, 
            this.player.height, 
            this.player.radius * 2
        );
        const playerBox = new THREE.Box3().setFromCenterAndSize(playerCenter, playerSize);
        
        // Check collisions with each object
        for (const object of this.objects) {
            // Skip if object is player or not collidable
            if (object === this.playerModel || 
                object.name === 'bullet' || 
                object.name === 'floor') continue;
            
            const objectBox = new THREE.Box3().setFromObject(object);
            
            if (playerBox.intersectsBox(objectBox)) {
                // Calculate collision response
                const objectCenter = new THREE.Vector3();
                objectBox.getCenter(objectCenter);
                
                const collisionNormal = new THREE.Vector3()
                    .subVectors(playerCenter, objectCenter)
                    .normalize();
                    
                // Apply minimal separation to prevent getting stuck
                const overlap = 0.05;
                this.playerBody.position.x += collisionNormal.x * overlap;
                this.playerBody.position.z += collisionNormal.z * overlap;
                
                // Stop movement in collision direction
                if (Math.abs(collisionNormal.x) > 0.5) {
                    this.playerBody.velocity.x = 0;
                }
                if (Math.abs(collisionNormal.z) > 0.5) {
                    this.playerBody.velocity.z = 0;
                }
            }
        }
    }
    
    /**
     * Updates positions of player model and camera
     */
    updatePositions() {
        // Update player position from physics body
        this.player.position.copy(this.playerBody.position);
        
        // Update player model position
        this.playerModel.position.copy(this.player.position);
        this.playerModel.position.y -= (this.player.height/2 - 0.1); // Adjust for height
        
        // Update camera position (first-person view)
        this.camera.position.copy(this.player.position);
        this.camera.position.y += this.player.eyeHeight; // Position at eye level
    }
}