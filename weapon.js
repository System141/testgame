/**
 * @fileoverview Weapon management system for a 3D first-person shooter game.
 * Handles multiple weapon types, shooting mechanics, and visual effects.
 */
import * as THREE from '/node_modules/three/build/three.module.js';

/**
 * Manages all weapon functionality including models, shooting, and effects.
 */
export default class Weapon {
    /**
     * Creates a new weapon system with multiple weapon types
     * @param {THREE.Scene} scene - The game scene
     * @param {THREE.Camera} camera - The player's camera
     * @param {Object} gameState - The current game state
     */
    constructor(scene, camera, gameState) {
        try {
            if (!scene || !camera) {
                throw new Error('Weapon constructor requires scene and camera parameters');
            }
            
            // Core properties
            this.scene = scene;
            this.camera = camera;
            this.gameState = gameState || {};
            this.bullets = [];
            this.paintSplatters = [];
            this.currentWeapon = 'rifle'; // Default weapon
            
            // View settings
            this.isScoped = false;
            this.defaultFOV = 75;
            this.scopedFOV = 20;
            
            // Initialize weapon configuration
            this.initWeaponConfig();
            
            // Set up animation states
            this.initAnimationStates();
            
            // Create weapon models
            this.createWeaponModels();
            
            // Create scope overlay
            this.createScopeOverlay();
            
            // Bind event handlers
            this.setupEventListeners();
            
            console.log('Weapon system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize weapon system:', error);
        }
    }
    
    /**
     * Initializes weapon configurations
     * @private
     */
    initWeaponConfig() {
        // Weapon definitions - properties for each weapon type
        this.weapons = {
            rifle: {
                model: null,
                bulletSpeed: 1.5,
                damage: 10,
                shootingDelay: 250,
                bulletSize: 0.05,
                bulletColor: 0xff0000,
                modelScale: { x: 0.1, y: 0.1, z: 0.5 },
                position: { x: 0.3, y: -0.2, z: -0.5 },
                maxAmmo: 30,
                currentAmmo: 30,
                reloadTime: 2000,
                weaponType: 'automatic'
            },
            sniper: {
                model: null,
                bulletSpeed: 3.0,
                damage: 50,
                shootingDelay: 1000,
                bulletSize: 0.08,
                bulletColor: 0x0000ff,
                modelScale: { x: 0.1, y: 0.1, z: 0.8 },
                position: { x: 0.3, y: -0.2, z: -0.7 },
                maxAmmo: 5,
                currentAmmo: 5,
                reloadTime: 2500,
                weaponType: 'precision'
            },
            paintball: {
                model: null,
                bulletSpeed: 1.0,
                damage: 5,
                shootingDelay: 500,
                bulletSize: 0.1,
                bulletColor: 0x00ff00,
                modelScale: { x: 0.1, y: 0.1, z: 0.5 },
                position: { x: 0.3, y: -0.2, z: -0.5 },
                maxAmmo: 20,
                currentAmmo: 20,
                reloadTime: 1800,
                weaponType: 'splatter'
            }
        };
    }
    
    /**
     * Initializes animation state objects
     * @private
     */
    initAnimationStates() {
        // Tracking the last time a shot was fired
        this.lastShot = 0;
        
        // State for reload animation
        this.reloadState = {
            active: false,
            startTime: 0,
            duration: 2000, // 2 seconds
            rotationStart: new THREE.Euler(),
            positionStart: new THREE.Vector3()
        };
        
        // State for recoil animation
        this.recoilState = {
            active: false,
            startTime: 0,
            originalPosition: new THREE.Vector3()
        };
        
        // State for weapon switch animation
        this.switchState = {
            active: false,
            startTime: 0,
            originalPosition: new THREE.Vector3(),
            originalRotation: new THREE.Euler()
        };
    }
    
    /**
     * Sets up event listeners for user input
     * @private
     */
    setupEventListeners() {
        try {
            // Mouse controls for shooting and scoping
            document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            
            // Keyboard controls for weapon switching
            document.addEventListener('keydown', (e) => this.handleWeaponSwitch(e));
            
            // Add reload key (R key)
            document.addEventListener('keydown', (e) => {
                if (e.code === 'KeyR') {
                    this.startReload();
                }
            });
        } catch (error) {
            console.error('Failed to set up weapon event listeners:', error);
        }
    }

    /**
     * Creates all weapon models and adds them to the camera
     * @private
     */
    createWeaponModels() {
        try {
            // Create shared geometries for optimization
            const sharedBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
            
            // Create rifle (simple model)
            this.createRifleModel(sharedBoxGeometry);
            
            // Create sniper rifle (simple model)
            this.createSniperModel(sharedBoxGeometry);
            
            // Create paintball gun (more detailed model)
            this.createPaintballModel(sharedBoxGeometry);
            
            // Initially show rifle and hide others
            this.setInitialWeaponVisibility();
            
            // Add weapon names for debugging
            this.weapons.rifle.model.name = 'rifle';
            this.weapons.sniper.model.name = 'sniper';
            this.weapons.paintball.model.name = 'paintball';
            
        } catch (error) {
            console.error('Error creating weapon models:', error);
        }
    }
    
    /**
     * Creates the rifle weapon model
     * @param {THREE.BoxGeometry} sharedGeometry - Shared geometry for optimization
     * @private
     */
    createRifleModel(sharedGeometry) {
        // Rifle material with better properties
        const rifleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Create basic rifle model
        this.weapons.rifle.model = new THREE.Group();
        
        // Main body
        const rifleBody = new THREE.Mesh(sharedGeometry, rifleMaterial);
        rifleBody.scale.set(0.1, 0.1, 0.5);
        this.weapons.rifle.model.add(rifleBody);
        
        // Add barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        const barrel = new THREE.Mesh(barrelGeometry, rifleMaterial);
        barrel.rotation.set(Math.PI/2, 0, 0);
        barrel.position.set(0, 0, -0.3);
        this.weapons.rifle.model.add(barrel);
        
        // Set model position and scale
        this.weapons.rifle.model.scale.set(
            this.weapons.rifle.modelScale.x,
            this.weapons.rifle.modelScale.y,
            this.weapons.rifle.modelScale.z
        );
        this.weapons.rifle.model.position.set(
            this.weapons.rifle.position.x,
            this.weapons.rifle.position.y,
            this.weapons.rifle.position.z
        );
        
        // Add to camera
        this.camera.add(this.weapons.rifle.model);
    }
    
    /**
     * Creates the sniper weapon model
     * @param {THREE.BoxGeometry} sharedGeometry - Shared geometry for optimization
     * @private
     */
    createSniperModel(sharedGeometry) {
        // Sniper material with better properties
        const sniperMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            roughness: 0.5,
            metalness: 0.5
        });
        
        // Create sniper model group
        this.weapons.sniper.model = new THREE.Group();
        
        // Main body
        const sniperBody = new THREE.Mesh(sharedGeometry, sniperMaterial);
        sniperBody.scale.set(0.1, 0.1, 0.8);
        this.weapons.sniper.model.add(sniperBody);
        
        // Scope
        const scopeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8);
        const scopeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000, 
            roughness: 0.2, 
            metalness: 0.8 
        });
        const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
        scope.rotation.set(Math.PI/2, 0, 0);
        scope.position.set(0, 0.05, -0.1);
        this.weapons.sniper.model.add(scope);
        
        // Set model position and scale
        this.weapons.sniper.model.scale.set(
            this.weapons.sniper.modelScale.x,
            this.weapons.sniper.modelScale.y,
            this.weapons.sniper.modelScale.z
        );
        this.weapons.sniper.model.position.set(
            this.weapons.sniper.position.x,
            this.weapons.sniper.position.y,
            this.weapons.sniper.position.z
        );
        
        // Add to camera
        this.camera.add(this.weapons.sniper.model);
    }
    
    /**
     * Creates the paintball gun model
     * @param {THREE.BoxGeometry} sharedGeometry - Shared geometry for optimization
     * @private
     */
    createPaintballModel(sharedGeometry) {
        // Paintball gun material with better properties
        const paintballMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00bb00,
            roughness: 0.6,
            metalness: 0.2
        });
        
        // Create paintball gun group
        this.weapons.paintball.model = new THREE.Group();
        
        // Main body
        const mainBody = new THREE.Mesh(sharedGeometry, paintballMaterial);
        mainBody.scale.set(0.1, 0.1, 0.4);
        this.weapons.paintball.model.add(mainBody);
        
        // Handle - use shared geometry for optimization
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.1
        });
        const handle = new THREE.Mesh(sharedGeometry, handleMaterial);
        handle.scale.set(0.08, 0.18, 0.08);
        handle.position.set(0, -0.14, 0.12);
        this.weapons.paintball.model.add(handle);
        
        // Tank - limit segments for performance
        const tankGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
        const tankMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.4,
            metalness: 0.6
        });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.rotation.set(0, 0, Math.PI/2);
        tank.position.set(0, 0, 0.15);
        this.weapons.paintball.model.add(tank);
        
        // Barrel - limit segments for performance
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.3,
            metalness: 0.7
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.set(Math.PI/2, 0, 0);
        barrel.position.set(0, 0, -0.2);
        this.weapons.paintball.model.add(barrel);
        
        // Add paintball hopper on top
        const hopperGeometry = new THREE.SphereGeometry(0.07, 8, 8, 0, Math.PI*2, 0, Math.PI/2);
        const hopperMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.7 });
        const hopper = new THREE.Mesh(hopperGeometry, hopperMaterial);
        hopper.rotation.set(Math.PI, 0, 0);
        hopper.position.set(0, 0.07, 0);
        this.weapons.paintball.model.add(hopper);
        
        // Set model position and scale
        this.weapons.paintball.model.scale.set(
            this.weapons.paintball.modelScale.x,
            this.weapons.paintball.modelScale.y,
            this.weapons.paintball.modelScale.z
        );
        this.weapons.paintball.model.position.set(
            this.weapons.paintball.position.x,
            this.weapons.paintball.position.y,
            this.weapons.paintball.position.z
        );
        
        // Add to camera
        this.camera.add(this.weapons.paintball.model);
    }
    
    /**
     * Sets the initial visibility of weapons
     * @private
     */
    setInitialWeaponVisibility() {
        // Show only default weapon (rifle) and hide others
        Object.keys(this.weapons).forEach(weaponType => {
            if (this.weapons[weaponType].model) {
                this.weapons[weaponType].model.visible = (weaponType === this.currentWeapon);
            }
        });
    }

    /**
     * Creates a sniper scope overlay with a realistic look
     * @private
     */
    createScopeOverlay() {
        try {
            // Configuration settings for scope appearance
            const config = {
                scopeRadius: 0.15,          // Size of the scope circle
                segments: 16,              // Lower segment count for better performance
                overlayColor: 0x000000,    // Black overlay
                overlayOpacity: 0.9,       // Slightly transparent
                crosshairColor: 0xffffff,  // White crosshair
                crosshairOpacity: 0.8,     // Slightly transparent
                crosshairSize: 0.045,      // Size relative to scope
                crosshairThickness: 1.5    // Line thickness
            };
            
            // Create the scope components
            this.createScopeBackground(config);
            this.createScopeRing(config);
            this.createScopeHole(config);
            this.createScopeCrosshair(config);
            
            // Add name properties for debugging
            this.scopeOverlay.name = 'scopeOverlay';
            this.scopeRing.name = 'scopeRing';
            this.scopeHole.name = 'scopeHole';
            this.crosshairVertical.name = 'crosshairVertical';
            this.crosshairHorizontal.name = 'crosshairHorizontal';
            
            console.log('Scope overlay created successfully');
        } catch (error) {
            console.error('Failed to create scope overlay:', error);
        }
    }
    
    /**
     * Creates the dark background for the scope
     * @param {Object} config - Scope configuration
     * @private
     */
    createScopeBackground(config) {
        // Create outer black overlay (full screen)
        const outerGeometry = new THREE.PlaneGeometry(2, 2);
        const outerMaterial = new THREE.MeshBasicMaterial({
            color: config.overlayColor,
            transparent: true,
            opacity: config.overlayOpacity,
            side: THREE.DoubleSide,
            depthTest: false
        });
        
        this.scopeOverlay = new THREE.Mesh(outerGeometry, outerMaterial);
        this.scopeOverlay.position.z = -1;
        this.scopeOverlay.visible = false;
        this.camera.add(this.scopeOverlay);
    }
    
    /**
     * Creates the scope ring (black border around the scope)
     * @param {Object} config - Scope configuration
     * @private
     */
    createScopeRing(config) {
        // Create scope ring (border of the clear area)
        const ringGeometry = new THREE.RingGeometry(
            config.scopeRadius - 0.002, 
            config.scopeRadius, 
            config.segments
        );
        
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: config.overlayColor,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1
        });
        
        this.scopeRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.scopeRing.position.z = -0.98;
        this.scopeRing.visible = false;
        this.camera.add(this.scopeRing);
    }
    
    /**
     * Creates the transparent hole in the scope overlay
     * @param {Object} config - Scope configuration
     * @private
     */
    createScopeHole(config) {
        // Create hole in the overlay (completely transparent)
        const holeGeometry = new THREE.CircleGeometry(
            config.scopeRadius - 0.002, 
            config.segments
        );
        
        const holeMaterial = new THREE.MeshBasicMaterial({
            colorWrite: false,
            depthWrite: false,
            opacity: 0
        });
        
        this.scopeHole = new THREE.Mesh(holeGeometry, holeMaterial);
        this.scopeHole.position.z = -0.99;
        this.scopeHole.visible = false;
        this.camera.add(this.scopeHole);
    }
    
    /**
     * Creates the crosshair in the center of the scope
     * @param {Object} config - Scope configuration
     * @private
     */
    createScopeCrosshair(config) {
        // Create crosshair with thicker lines
        const crosshairSize = config.scopeRadius * config.crosshairSize;
        
        // Vertical line
        const verticalLine = new Float32Array([
            0, crosshairSize, -0.97,
            0, -crosshairSize, -0.97
        ]);
        
        // Horizontal line
        const horizontalLine = new Float32Array([
            -crosshairSize, 0, -0.97,
            crosshairSize, 0, -0.97
        ]);
        
        // Create material with improved properties
        const crosshairMaterial = new THREE.LineBasicMaterial({ 
            color: config.crosshairColor,
            transparent: true,
            opacity: config.crosshairOpacity,
            linewidth: config.crosshairThickness
        });
        
        // Create vertical line
        const verticalGeometry = new THREE.BufferGeometry();
        verticalGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verticalLine, 3));
        this.crosshairVertical = new THREE.Line(verticalGeometry, crosshairMaterial);
        this.crosshairVertical.visible = false;
        this.camera.add(this.crosshairVertical);
        
        // Create horizontal line
        const horizontalGeometry = new THREE.BufferGeometry();
        horizontalGeometry.setAttribute('position', new THREE.Float32BufferAttribute(horizontalLine, 3));
        this.crosshairHorizontal = new THREE.Line(horizontalGeometry, crosshairMaterial);
        this.crosshairHorizontal.visible = false;
        this.camera.add(this.crosshairHorizontal);
        
        // Add small dot in center (optional)
        const dotGeometry = new THREE.CircleGeometry(0.002, 8);
        const dotMaterial = new THREE.MeshBasicMaterial({
            color: config.crosshairColor,
            transparent: true,
            opacity: config.crosshairOpacity
        });
        
        this.crosshairDot = new THREE.Mesh(dotGeometry, dotMaterial);
        this.crosshairDot.position.z = -0.97;
        this.crosshairDot.visible = false;
        this.camera.add(this.crosshairDot);
    }

    handleMouseDown(event) {
        if (event.button === 0) { // Left click
            this.shoot(event);
        } else if (event.button === 2 && this.currentWeapon === 'sniper') { // Right click for scope
            this.toggleScope(true);
        }
    }

    handleMouseUp(event) {
        if (event.button === 2 && this.currentWeapon === 'sniper') {
            this.toggleScope(false);
        }
    }

    /**
     * Toggles the sniper scope view based on input state
     * @param {boolean} scoped - Whether to enter or exit scoped view
     */
    toggleScope(scoped) {
        try {
            // Only continue if current weapon is a sniper rifle
            if (this.currentWeapon !== 'sniper') {
                console.log('Scope toggle only available for sniper rifle');
                return;
            }
            
            // Skip if already in the requested state
            if (this.isScoped === scoped) return;
            
            // Update scoped state
            this.isScoped = scoped;
            
            // Get target FOV based on scoped state
            const targetFOV = scoped ? this.scopedFOV : this.defaultFOV;
            
            // Show/hide scope UI elements
            this.setScopeUIVisibility(scoped);
            
            // Hide/show weapon model
            if (this.weapons[this.currentWeapon].model) {
                this.weapons[this.currentWeapon].model.visible = !scoped;
            }
            
            // Start or stop breathing effect for realistic scope sway
            if (scoped) {
                this.startScopeBreathingEffect();
            } else {
                this.stopScopeBreathingEffect();
            }
            
            // Animate FOV change for smooth transition
            this.animateFOV(targetFOV);
            
            // Play scope sound effect if available
            if (this.audio && this.audio.playScopeSound) {
                this.audio.playScopeSound(scoped);
            }
            
            // Update player movement state (handled by playerControls)
            this.isScopeMovement = scoped;
            
        } catch (error) {
            console.error('Error toggling scope:', error);
            // Reset to safe state
            this.isScoped = false;
            this.setScopeUIVisibility(false);
            if (this.weapons[this.currentWeapon].model) {
                this.weapons[this.currentWeapon].model.visible = true;
            }
        }
    }
    
    /**
     * Helper method to control visibility of all scope UI elements
     * @param {boolean} visible - Whether scope UI should be visible
     * @private
     */
    setScopeUIVisibility(visible) {
        // Validate all UI elements exist before changing visibility
        if (this.scopeOverlay) this.scopeOverlay.visible = visible;
        if (this.scopeHole) this.scopeHole.visible = visible;
        if (this.scopeRing) this.scopeRing.visible = visible;
        if (this.crosshairVertical) this.crosshairVertical.visible = visible;
        if (this.crosshairHorizontal) this.crosshairHorizontal.visible = visible;
        if (this.crosshairDot) this.crosshairDot.visible = visible;
    }
    
    /**
     * Animates field of view transition for scope
     * @param {number} targetFOV - Target field of view in degrees
     * @private
     */
    animateFOV(targetFOV) {
        // Start from current camera FOV
        const startFOV = this.camera.fov;
        const duration = 200; // milliseconds
        const startTime = Date.now();
        
        // Clear any existing animation
        if (this.fovAnimationId) {
            cancelAnimationFrame(this.fovAnimationId);
        }

        // Create animation function
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easeInOutQuad for smoother motion
            const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Update camera FOV
            this.camera.fov = startFOV + (targetFOV - startFOV) * eased;
            this.camera.updateProjectionMatrix();

            // Continue animation if not complete
            if (progress < 1) {
                this.fovAnimationId = requestAnimationFrame(animate);
            } else {
                this.fovAnimationId = null;
            }
        };

        // Start animation
        this.fovAnimationId = requestAnimationFrame(animate);
    }
    
    /**
     * Starts the scope breathing effect simulation
     * Creates subtle camera movement to simulate breathing
     * @private
     */
    startScopeBreathingEffect() {
        // Clear any existing breathing animation
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
        }
        
        // Initialize breathing parameters
        let breathPhase = 0;
        const breathSpeed = 0.001;
        const breathAmplitude = 0.0015;
        
        // Store original camera rotation
        this.originalCameraRotation = {
            x: this.camera.rotation.x,
            y: this.camera.rotation.y
        };
        
        // Create subtle camera movement to simulate breathing
        this.breathingInterval = setInterval(() => {
            if (!this.isScoped) return;
            
            breathPhase += breathSpeed;
            
            // Apply subtle sine wave to camera rotation
            const breathEffect = Math.sin(breathPhase) * breathAmplitude;
            this.camera.rotation.x = this.originalCameraRotation.x + breathEffect;
            
        }, 16); // ~60fps
    }
    
    /**
     * Stops the scope breathing effect
     * @private
     */
    stopScopeBreathingEffect() {
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
            this.breathingInterval = null;
        }
        
        // Reset camera rotation if original values stored
        if (this.originalCameraRotation) {
            this.camera.rotation.x = this.originalCameraRotation.x;
            this.camera.rotation.y = this.originalCameraRotation.y;
        }
    }

    handleWeaponSwitch(event) {
        if (event.key === '1') {
            this.switchWeapon('rifle');
        } else if (event.key === '2') {
            this.switchWeapon('sniper');
        } else if (event.key === '3') {
            this.switchWeapon('paintball');
        }
    }

    switchWeapon(weaponType) {
        if (this.currentWeapon === weaponType) return;

        // If player is reloading or in weapon switch animation, cancel it
        this.reloadState.active = false;
        this.switchState.active = false;

        // Hide all weapons
        Object.values(this.weapons).forEach(weapon => {
            if (weapon.model) weapon.model.visible = false;
        });

        // Show selected weapon
        this.weapons[weaponType].model.visible = true;
        this.currentWeapon = weaponType;
        
        // Add a small weapon switch animation
        const weaponModel = this.weapons[weaponType].model;
        this.switchState.active = true;
        this.switchState.startTime = Date.now();
        this.switchState.originalPosition = weaponModel.position.clone();
        this.switchState.originalRotation = weaponModel.rotation.clone();
    }

    generateCanvasPaintSplatter() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');

        // Random paint color
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00', '#00ffff'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Draw paint splatter
        context.fillStyle = color;
        context.beginPath();
        const mainRadius = 100 + Math.random() * 100; // Vary the main circle radius
        context.arc(256, 256, mainRadius, 0, Math.PI * 2);
        context.fill();

        // Add random splatter effect
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = Math.random() * 20;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Handles shooting for the current weapon
     * @param {MouseEvent} event - The mouse event that triggered the shot
     */
    shoot(event) {
        try {
            // Validate event is left click
            if (event.button !== 0) return; 
            
            // Don't shoot if weapon is in transition state
            if (this.reloadState.active || this.switchState.active) return;
            
            const now = Date.now();
            const currentWeaponProps = this.weapons[this.currentWeapon];
            
            // Check if we can shoot based on weapon firing rate
            if (now - this.lastShot < currentWeaponProps.shootingDelay) return;
            
            // Check if we have ammo
            if (currentWeaponProps.currentAmmo <= 0) {
                // Play empty gun click sound
                console.log('Click - out of ammo');
                this.startReload();
                return;
            }
            
            // Update last shot time and reduce ammo
            this.lastShot = now;
            currentWeaponProps.currentAmmo--;
            
            // Update UI ammo count if available
            if (this.gameState.updateAmmoUI) {
                this.gameState.updateAmmoUI(currentWeaponProps.currentAmmo, currentWeaponProps.maxAmmo);
            }
            
            // Start recoil animation
            this.startRecoilAnimation(currentWeaponProps);
            
            // Create bullet based on weapon type
            this.createBullet(currentWeaponProps);
            
            // Create visual effects for shooting
            this.createMuzzleFlash();
            
            // Auto reload if out of ammo
            if (currentWeaponProps.currentAmmo <= 0) {
                setTimeout(() => this.startReload(), 300);
            }
            
        } catch (error) {
            console.error('Error while shooting:', error);
        }
    }
    
    /**
     * Starts the recoil animation for the weapon
     * @param {Object} weaponProps - The properties of the current weapon
     * @private
     */
    startRecoilAnimation(weaponProps) {
        const weaponModel = weaponProps.model;
        if (!weaponModel) return;
        
        this.recoilState.active = true;
        this.recoilState.startTime = Date.now();
        this.recoilState.originalPosition.copy(weaponModel.position);
    }
    
    /**
     * Creates a bullet for the current weapon
     * @param {Object} weaponProps - The properties of the current weapon
     * @private
     */
    createBullet(weaponProps) {
        // Create bullet with shared geometry for better performance
        if (!this.bulletGeometries) {
            // Cache bullet geometries
            this.bulletGeometries = {
                small: new THREE.SphereGeometry(0.05, 8, 8),
                medium: new THREE.SphereGeometry(0.08, 8, 8),
                large: new THREE.SphereGeometry(0.1, 8, 8)
            };
        }
        
        // Choose appropriate geometry based on bullet size
        let geometry;
        if (weaponProps.bulletSize <= 0.05) {
            geometry = this.bulletGeometries.small;
        } else if (weaponProps.bulletSize <= 0.08) {
            geometry = this.bulletGeometries.medium;
        } else {
            geometry = this.bulletGeometries.large;
        }
        
        // Create bullet material
        const bulletMaterial = new THREE.MeshBasicMaterial({ 
            color: weaponProps.bulletColor,
            transparent: weaponProps.weaponType === 'paintball',
            opacity: weaponProps.weaponType === 'paintball' ? 0.8 : 1.0
        });
        
        // Create bullet mesh
        const bullet = new THREE.Mesh(geometry, bulletMaterial);
        bullet.name = 'bullet';
        
        // Set initial bullet position at muzzle of gun
        bullet.position.copy(this.camera.position);
        
        // Add a small offset from camera to avoid near clipping plane issues
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Offset bullet starting position slightly in front of camera
        bullet.position.add(direction.clone().multiplyScalar(0.5));
        
        // Add small random spread for realistic shooting
        const spreadFactor = weaponProps.weaponType === 'precision' ? 0.001 : 0.01;
        direction.x += (Math.random() - 0.5) * spreadFactor;
        direction.y += (Math.random() - 0.5) * spreadFactor;
        direction.z += (Math.random() - 0.5) * spreadFactor;
        direction.normalize();
        
        // Create raycaster for bullet collision detection
        const raycaster = new THREE.Raycaster(bullet.position, direction);
        
        // Store bullet data
        this.bullets.push({
            mesh: bullet,
            direction: direction,
            distance: 0,
            damage: weaponProps.damage,
            speed: weaponProps.bulletSpeed,
            raycaster: raycaster,
            weaponType: weaponProps.weaponType
        });
        
        // Add bullet to scene
        this.scene.add(bullet);
    }

    startReload() {
        if (this.reloadState.active) return;
        
        const weaponModel = this.weapons[this.currentWeapon].model;
        this.reloadState.active = true;
        this.reloadState.startTime = Date.now();
        this.reloadState.rotationStart.copy(weaponModel.rotation);
        this.reloadState.positionStart.copy(weaponModel.position);
    }

    updateReload() {
        if (!this.reloadState.active) return;

        const weaponModel = this.weapons[this.currentWeapon].model;
        const elapsed = Date.now() - this.reloadState.startTime;
        const progress = Math.min(elapsed / this.reloadState.duration, 1);

        // Reload animation
        if (progress < 0.5) {
            // Rotate weapon down and to the side
            weaponModel.rotation.x = this.reloadState.rotationStart.x + Math.PI * 0.25 * progress * 2;
            weaponModel.rotation.z = this.reloadState.rotationStart.z - Math.PI * 0.15 * progress * 2;
            weaponModel.position.y = this.reloadState.positionStart.y - 0.2 * progress * 2;
        } else {
            // Return weapon to original position
            const returnProgress = (progress - 0.5) * 2;
            weaponModel.rotation.x = this.reloadState.rotationStart.x + Math.PI * 0.25 * (1 - returnProgress);
            weaponModel.rotation.z = this.reloadState.rotationStart.z - Math.PI * 0.15 * (1 - returnProgress);
            weaponModel.position.y = this.reloadState.positionStart.y - 0.2 * (1 - returnProgress);
        }

        if (progress >= 1) {
            this.reloadState.active = false;
            weaponModel.rotation.copy(this.reloadState.rotationStart);
            weaponModel.position.copy(this.reloadState.positionStart);
        }
    }

    /**
     * Creates a paint splatter effect on impact surfaces
     * @param {THREE.Vector3} position - Impact position vector
     * @param {THREE.Vector3} normal - Surface normal vector
     */
    createPaintSplatter(position, normal) {
        try {
            // Initialize texture cache for better performance
            if (!this.splatterTextures) {
                this.splatterTextures = [];
                this.splatterMaterials = {};
                
                // Pre-generate a set of textures with different colors
                const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00, 0x00ffff];
                
                // Generate a pool of 6 different textures to reuse
                for (const color of colors) {
                    const colorKey = color.toString(16);
                    this.splatterTextures.push({
                        color: color,
                        colorKey: colorKey,
                        texture: this.generateCanvasPaintSplatter(color)
                    });
                }
            }

            // Create or reuse common splatter geometry
            if (!this.cachedSplatterGeometry) {
                this.cachedSplatterGeometry = new THREE.PlaneGeometry(0.5, 0.5);
            }
            
            // Get current weapon color or use random color from pool
            let weaponColor;
            if (this.weapons[this.currentWeapon]) {
                weaponColor = this.weapons[this.currentWeapon].bulletColor;
            } else {
                const randomIndex = Math.floor(Math.random() * this.splatterTextures.length);
                weaponColor = this.splatterTextures[randomIndex].color;
            }
            
            // Find closest matching texture from pool
            let closestTexture = this.splatterTextures[0].texture;
            let closestColorKey = this.splatterTextures[0].colorKey;
            
            // Get or create material for this color
            const colorKey = weaponColor.toString(16);
            if (!this.splatterMaterials[colorKey]) {
                this.splatterMaterials[colorKey] = new THREE.MeshBasicMaterial({
                    map: closestTexture,
                    color: weaponColor,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.9,
                    depthWrite: false, // Improves rendering performance for transparents
                    blending: THREE.NormalBlending
                });
            }
            
            // Create new mesh using shared geometry and appropriate material
            const splatter = new THREE.Mesh(this.cachedSplatterGeometry, this.splatterMaterials[colorKey]);
            splatter.name = 'paintSplatter';
            
            // Position slightly offset from surface to prevent z-fighting
            splatter.position.copy(position);
            splatter.position.add(normal.clone().multiplyScalar(0.01));
            
            // Optimize rotation calculation
            this.orientSplatterMesh(splatter, position, normal);
            
            // Add random scale variation for visual variety
            const scale = 0.2 + Math.random() * 0.4;
            splatter.scale.set(scale, scale, scale);
            
            // Add to scene
            this.scene.add(splatter);
            
            // Store with timestamp for age-based cleanup
            this.paintSplatters.push({
                mesh: splatter,
                createdAt: Date.now(),
                colorKey: colorKey
            });
            
            // Maintain performance by limiting splatter count
            this.managePaintSplatters();
            
        } catch (error) {
            console.error('Error creating paint splatter:', error);
        }
    }
    
    /**
     * Helper method to orient a splatter mesh to align with surface
     * @param {THREE.Mesh} splatterMesh - The splatter mesh to orient
     * @param {THREE.Vector3} position - Impact position
     * @param {THREE.Vector3} normal - Surface normal
     * @private
     */
    orientSplatterMesh(splatterMesh, position, normal) {
        // Optimization: special case for flat horizontal surfaces (floor/ceiling)
        if (Math.abs(normal.y) > 0.9) {
            // For floor/ceiling, just rotate around Y axis
            splatterMesh.rotation.x = normal.y > 0 ? -Math.PI / 2 : Math.PI / 2;
            splatterMesh.rotation.z = Math.random() * Math.PI * 2;
        } else {
            // For walls and other surfaces, use lookAt
            splatterMesh.lookAt(position.clone().add(normal));
            
            // Random rotation around normal for variation
            // Using a temporary quaternion for better performance
            const tempQuaternion = new THREE.Quaternion();
            tempQuaternion.setFromAxisAngle(normal, Math.random() * Math.PI * 2);
            splatterMesh.quaternion.premultiply(tempQuaternion);
        }
    }
    
    /**
     * Manages paint splatter objects to maintain performance
     * Removes old splatters based on age and count
     * @private
     */
    managePaintSplatters() {
        const MAX_SPLATTERS = 75;   // Maximum number of splatters to keep
        const MAX_AGE_MS = 30000;  // Maximum age in milliseconds (30 seconds)
        const now = Date.now();
        
        // First remove any splatters that are too old
        for (let i = this.paintSplatters.length - 1; i >= 0; i--) {
            const splatter = this.paintSplatters[i];
            if (now - splatter.createdAt > MAX_AGE_MS) {
                this.scene.remove(splatter.mesh);
                // Note: We don't dispose of material/geometry as they are shared
                this.paintSplatters.splice(i, 1);
            }
        }
        
        // If still too many, remove oldest ones
        if (this.paintSplatters.length > MAX_SPLATTERS) {
            // Sort by age (oldest first) for more efficient removal
            this.paintSplatters.sort((a, b) => a.createdAt - b.createdAt);
            
            // Remove oldest splatters until we're under the limit
            while (this.paintSplatters.length > MAX_SPLATTERS) {
                const oldestSplatter = this.paintSplatters.shift();
                this.scene.remove(oldestSplatter.mesh);
            }
        }
    }
    
    /**
     * Creates a bullet impact effect on surfaces
     * @param {THREE.Vector3} position - Impact position vector
     * @param {THREE.Vector3} normal - Surface normal vector
     * @param {string} weaponType - Type of weapon that fired the bullet
     */
    createBulletImpact(position, normal, weaponType = 'rifle') {
        try {
            // Initialize impact effects cache if not already done
            if (!this.bulletImpacts) {
                this.bulletImpacts = [];
                this.bulletImpactGeometries = {};
                this.bulletImpactMaterials = {};
            }
            
            // Determine surface type based on normal (rough approximation)
            const surfaceType = Math.abs(normal.y) > 0.7 ? 'floor' : 'wall';
            
            // Define paintball colors array if not already created
            if (!this.paintballColors) {
                this.paintballColors = [
                    0xFF3355, // Red
                    0x33FF55, // Green
                    0x5533FF, // Blue
                    0xFF33FF, // Pink
                    0xFFFF33, // Yellow
                    0x33FFFF, // Cyan
                    0xFF9933, // Orange
                    0x99FF33, // Lime
                    0x9933FF, // Purple
                    0x33FFCC  // Turquoise
                ];
            }
            
            // Use random bright color for impact
            const colorIndex = Math.floor(Math.random() * this.paintballColors.length);
            const impactColor = this.paintballColors[colorIndex];
            
            // Different parameters based on weapon type (but all are colorful)
            let particleCount, particleSize, particleVelocity, impactRadius;
            
            switch (weaponType) {
                case 'sniper':
                    particleCount = 20;  // More particles for bigger splatter
                    particleSize = 0.025;
                    particleVelocity = 0.18;
                    impactRadius = 0.15; // Larger impact
                    break;
                    
                case 'rifle':
                    particleCount = 15;
                    particleSize = 0.02;
                    particleVelocity = 0.14;
                    impactRadius = 0.12;
                    break;
                    
                default: // paintball and other weapons
                    particleCount = 12;
                    particleSize = 0.018;
                    particleVelocity = 0.12;
                    impactRadius = 0.1;
            }
            
            // Add surface-specific adjustments
            if (surfaceType === 'floor') {
                particleVelocity *= 0.8; // Reduce velocity for floor impacts
                particleCount += 3;      // Add more particles for floor impacts
            }
            
            // Create bullet hole decal (different for each surface)
            this.createBulletDecal(position, normal, impactRadius, weaponType, surfaceType);
            
            // Create particle burst effect
            this.createImpactParticles(
                position, 
                normal, 
                particleCount, 
                particleSize, 
                particleVelocity, 
                impactColor, 
                surfaceType
            );
            
        } catch (error) {
            console.error('Error creating bullet impact:', error);
        }
    }
    
    /**
     * Creates a bullet hole decal on the impact surface
     * @param {THREE.Vector3} position - Impact position
     * @param {THREE.Vector3} normal - Surface normal
     * @param {number} radius - Impact radius
     * @param {string} weaponType - Type of weapon
     * @param {string} surfaceType - Type of surface (floor or wall)
     * @private
     */
    createBulletDecal(position, normal, radius, weaponType, surfaceType) {
        // Get or select a random color for this splatter
        const colorIndex = Math.floor(Math.random() * this.paintballColors.length);
        const paintColor = this.paintballColors[colorIndex];
        const colorKey = paintColor.toString(16);
        
        // Create key for geometry cache
        const geometryKey = `${weaponType}_${surfaceType}`;
        
        // Create and cache geometries for performance
        if (!this.bulletImpactGeometries[geometryKey]) {
            // For paintball impacts, use slightly irregular circle with more segments
            this.bulletImpactGeometries[geometryKey] = new THREE.CircleGeometry(radius, 12);
        }
        
        // Generate/get material for this color
        const materialKey = `${surfaceType}_${colorKey}`;
        if (!this.bulletImpactMaterials[materialKey]) {
            // Generate texture for paintball splatter with the specific color
            const texture = this.generatePaintSplashTexture(paintColor, surfaceType);
            
            this.bulletImpactMaterials[materialKey] = new THREE.MeshBasicMaterial({
                map: texture,
                color: paintColor,  // Tint the material with the paintball color
                transparent: true,
                opacity: 0.9,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.NormalBlending
            });
        }
        
        // Create the decal mesh
        const decal = new THREE.Mesh(
            this.bulletImpactGeometries[geometryKey],
            this.bulletImpactMaterials[materialKey]
        );
        decal.name = 'paintSplatter';
        
        // Position slightly offset from the surface to prevent z-fighting
        decal.position.copy(position);
        decal.position.addScaledVector(normal, 0.01);
        
        // Orient the decal to match the surface normal
        if (Math.abs(normal.y) > 0.9) {
            // For floor/ceiling
            decal.rotation.x = normal.y > 0 ? -Math.PI / 2 : Math.PI / 2;
            decal.rotation.z = Math.random() * Math.PI * 2; // Random rotation
        } else {
            // For walls
            decal.lookAt(position.clone().add(normal));
        }
        
        // Add to scene
        this.scene.add(decal);
        
        // Add to impact list for management
        this.bulletImpacts.push({
            mesh: decal,
            createdAt: Date.now()
        });
        
        // Manage impact count to maintain performance
        this.manageBulletImpacts();
    }
    
    /**
     * Creates particle burst effect for bullet impact
     * @param {THREE.Vector3} position - Impact position
     * @param {THREE.Vector3} normal - Surface normal
     * @param {number} count - Number of particles
     * @param {number} size - Size of particles
     * @param {number} velocity - Velocity of particles
     * @param {number} color - Color of particles
     * @param {string} surfaceType - Type of surface
     * @private
     */
    createImpactParticles(position, normal, count, size, velocity, baseColor, surfaceType) {
        const particles = [];
        
        // Get random color if none provided (for color consistency)
        if (!baseColor) {
            const colorIndex = Math.floor(Math.random() * this.paintballColors.length);
            baseColor = this.paintballColors[colorIndex];
        }
        
        // Create particle material if not already cached
        if (!this.particleMaterial) {
            this.particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,  // Will be modified per particle
                transparent: true,
                opacity: 0.9,
                blending: THREE.NormalBlending
            });
        }
        
        // Create particle geometry if not already cached
        if (!this.particleGeometry) {
            // Use sphere for paint droplets
            this.particleGeometry = new THREE.SphereGeometry(1, 6, 6);
        }
        
        // Create the impact particles
        for (let i = 0; i < count; i++) {
            // Clone the material to set unique color and opacity
            const particleMaterial = this.particleMaterial.clone();
            
            // Slight color variation for each particle
            const colorVariation = 0.1;
            const hsl = new THREE.Color(baseColor).getHSL({});
            const newColor = new THREE.Color().setHSL(
                hsl.h + (Math.random() * 2 - 1) * 0.05,  // slight hue variation
                Math.min(1, Math.max(0, hsl.s + (Math.random() * 2 - 1) * colorVariation)),
                Math.min(1, Math.max(0, hsl.l + (Math.random() * 2 - 1) * colorVariation))
            );
            
            particleMaterial.color = newColor;
            
            const particle = new THREE.Mesh(this.particleGeometry, particleMaterial);
            particle.name = 'paintSplatterParticle';
            
            // Random scale for each particle
            const particleScale = size * (0.5 + Math.random() * 0.5);
            particle.scale.set(particleScale, particleScale, particleScale);
            
            // Position at impact point
            particle.position.copy(position);
            
            // Create velocity vector
            // Main direction is along the normal, with some random spread
            const particleVelocity = new THREE.Vector3();
            
            // Add normal component (bouncing off surface)
            particleVelocity.copy(normal).multiplyScalar(velocity * (0.5 + Math.random() * 0.8));
            
            // Add random spread component
            const randomSpread = new THREE.Vector3(
                (Math.random() - 0.5) * velocity,
                (Math.random() - 0.5) * velocity,
                (Math.random() - 0.5) * velocity
            );
            
            // Adjust for floor or wall surfaces
            if (surfaceType === 'floor') {
                // For floor impacts, particles should mostly go upward
                randomSpread.y = Math.abs(randomSpread.y);
            }
            
            particleVelocity.add(randomSpread);
            
            // Store velocity and lifetime with the particle
            particle.userData = {
                velocity: particleVelocity,
                lifetime: 0.5 + Math.random() * 0.5, // 0.5 to 1 second lifetime
                startTime: Date.now(),
                gravity: surfaceType === 'floor' ? 0.001 : 0.003 // Less gravity for floor impacts
            };
            
            // Add to scene and tracker array
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Set up animation for particles
        const animateParticles = () => {
            let allDone = true;
            const now = Date.now();
            
            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                const data = particle.userData;
                const elapsed = (now - data.startTime) / 1000; // seconds
                
                if (elapsed < data.lifetime) {
                    allDone = false;
                    
                    // Update position based on velocity
                    particle.position.add(data.velocity);
                    
                    // Apply gravity to velocity
                    data.velocity.y -= data.gravity;
                    
                    // Slow down velocity due to air resistance
                    data.velocity.multiplyScalar(0.95);
                    
                    // Fade out based on lifetime
                    particle.material.opacity = 0.8 * (1 - elapsed / data.lifetime);
                } else {
                    // Remove expired particles
                    this.scene.remove(particle);
                    particle.material.dispose();
                    particles.splice(i, 1);
                }
            }
            
            // Continue animation if any particles remain
            if (!allDone) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        // Start animation
        requestAnimationFrame(animateParticles);
    }
    
    /**
     * Generates a texture for colorful paint splash effects
     * @param {number} paintColor - Color of the paint (hex value)
     * @param {string} surfaceType - Type of surface (floor or wall)
     * @returns {THREE.CanvasTexture} - Generated texture
     * @private
     */
    generatePaintSplashTexture(paintColor, surfaceType) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; // Higher resolution for more detail
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Extract RGB components from hex color for variations
        const r = (paintColor >> 16) & 255;
        const g = (paintColor >> 8) & 255;
        const b = paintColor & 255;
        
        // Common properties
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Define splash radius based on surface type
        const splashRadius = surfaceType === 'wall' ? canvas.width / 2.5 : canvas.width / 3;
        
        // Create main paint blob with translucent center
        const mainGradient = context.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, splashRadius
        );
        
        // More opaque in center, transparent at edges
        mainGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
        mainGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.8)`);
        mainGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.6)`);
        mainGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        // Draw irregular blob shape instead of perfect circle
        context.save();
        context.beginPath();
        
        // Generate irregular blob with 8-12 points
        const points = 8 + Math.floor(Math.random() * 5);
        const angleStep = (Math.PI * 2) / points;
        const irregularity = 0.3; // How irregular the shape can be
        
        // Start at first point
        const firstRadius = splashRadius * (1 - irregularity/2 + Math.random() * irregularity);
        const firstX = centerX + Math.cos(0) * firstRadius;
        const firstY = centerY + Math.sin(0) * firstRadius;
        context.moveTo(firstX, firstY);
        
        // Draw the rest using bezier curves for smoother, organic shape
        for (let i = 1; i <= points; i++) {
            const angle = i * angleStep;
            const prevAngle = (i - 1) * angleStep;
            
            // Random radius for this point
            const radius = splashRadius * (1 - irregularity/2 + Math.random() * irregularity);
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Control points for bezier curve
            const cp1x = centerX + Math.cos(prevAngle + angleStep/3) * radius * 1.1;
            const cp1y = centerY + Math.sin(prevAngle + angleStep/3) * radius * 1.1;
            const cp2x = centerX + Math.cos(angle - angleStep/3) * radius * 1.1;
            const cp2y = centerY + Math.sin(angle - angleStep/3) * radius * 1.1;
            
            context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
        }
        
        // Close the path and fill with gradient
        context.closePath();
        context.fillStyle = mainGradient;
        context.fill();
        context.restore();
        
        // Surface-specific effects
        if (surfaceType === 'wall') {
            // Add drips for wall impacts
            const dripCount = 3 + Math.floor(Math.random() * 4); // 3-6 drips
            
            for (let i = 0; i < dripCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                // More drips at the bottom half for walls
                const adjustedAngle = (angle + Math.PI) / 2;
                
                const dripStart = splashRadius * 0.7;
                const dripLength = 15 + Math.random() * 35; // 15-50px drips
                const dripWidth = 3 + Math.random() * 7; // 3-10px width
                
                const startX = centerX + Math.cos(adjustedAngle) * dripStart;
                const startY = centerY + Math.sin(adjustedAngle) * dripStart;
                const endX = centerX + Math.cos(adjustedAngle) * (dripStart + dripLength);
                const endY = centerY + Math.sin(adjustedAngle) * (dripStart + dripLength);
                
                // Create drip gradient
                const dripGradient = context.createLinearGradient(startX, startY, endX, endY);
                dripGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
                dripGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.7)`);
                dripGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                
                // Draw drip
                context.beginPath();
                context.moveTo(startX, startY);
                
                // Slightly curved drip path
                const ctrlX = startX + (Math.random() - 0.5) * 10;
                const ctrlY = startY + (endY - startY) * 0.6;
                context.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
                
                context.lineWidth = dripWidth;
                context.lineCap = 'round';
                context.strokeStyle = dripGradient;
                context.stroke();
                
                // Add a droplet at the end of some drips
                if (Math.random() > 0.3) { // 70% chance
                    const dropSize = dripWidth * 1.5;
                    context.beginPath();
                    context.arc(endX, endY, dropSize, 0, Math.PI * 2);
                    context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
                    context.fill();
                }
            }
        } else {
            // Add small paint splatters around for floor impacts
            const splatterCount = 8 + Math.floor(Math.random() * 7); // 8-14 splatters
            
            for (let i = 0; i < splatterCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = splashRadius * 0.5 + Math.random() * splashRadius * 0.7;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                const size = 2 + Math.random() * 8; // 2-10px splatters
                
                // Slight color variation for visual interest
                const colorVariation = 20 * (Math.random() - 0.5);
                const rVar = Math.max(0, Math.min(255, r + colorVariation));
                const gVar = Math.max(0, Math.min(255, g + colorVariation));
                const bVar = Math.max(0, Math.min(255, b + colorVariation));
                
                context.fillStyle = `rgba(${rVar}, ${gVar}, ${bVar}, ${0.6 + Math.random() * 0.3})`;
                
                // Randomly choose between circular and irregular splatters
                if (Math.random() > 0.5) {
                    // Circular splatter
                    context.beginPath();
                    context.arc(x, y, size, 0, Math.PI * 2);
                    context.fill();
                } else {
                    // Irregular splatter
                    context.beginPath();
                    const splatterPoints = 5 + Math.floor(Math.random() * 3);
                    const splatterAngleStep = (Math.PI * 2) / splatterPoints;
                    
                    // First point
                    const firstSplatterRadius = size * (0.8 + Math.random() * 0.4);
                    context.moveTo(
                        x + Math.cos(0) * firstSplatterRadius,
                        y + Math.sin(0) * firstSplatterRadius
                    );
                    
                    // Remaining points
                    for (let j = 1; j <= splatterPoints; j++) {
                        const splatterAngle = j * splatterAngleStep;
                        const splatterRadius = size * (0.8 + Math.random() * 0.4);
                        
                        context.lineTo(
                            x + Math.cos(splatterAngle) * splatterRadius,
                            y + Math.sin(splatterAngle) * splatterRadius
                        );
                    }
                    
                    context.closePath();
                    context.fill();
                }
            }
        }
        
        return new THREE.CanvasTexture(canvas);
    }
    
    /**
     * Manages bullet impact objects to maintain performance
     * @private
     */
    manageBulletImpacts() {
        if (!this.bulletImpacts) return;
        
        const MAX_IMPACTS = 50;    // Maximum number of impacts to keep
        const MAX_AGE_MS = 20000;  // Maximum age in milliseconds (20 seconds)
        const now = Date.now();
        
        // First remove any impacts that are too old
        for (let i = this.bulletImpacts.length - 1; i >= 0; i--) {
            const impact = this.bulletImpacts[i];
            if (now - impact.createdAt > MAX_AGE_MS) {
                this.scene.remove(impact.mesh);
                this.bulletImpacts.splice(i, 1);
            }
        }
        
        // If still too many, remove oldest ones
        if (this.bulletImpacts.length > MAX_IMPACTS) {
            // Sort by age (oldest first) for more efficient removal
            this.bulletImpacts.sort((a, b) => a.createdAt - b.createdAt);
            
            // Remove oldest impacts until we're under the limit
            while (this.bulletImpacts.length > MAX_IMPACTS) {
                const oldestImpact = this.bulletImpacts.shift();
                this.scene.remove(oldestImpact.mesh);
            }
        }
    }
    
    /**
     * Generates a paint splatter texture using canvas
     * @param {number} color - Color for the splatter (hex value)
     * @returns {THREE.CanvasTexture} Generated texture
     */
    generateCanvasPaintSplatter(color = 0x00ff00) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;  // Reduced for better performance
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Convert hex color to CSS color string
        const cssColor = '#' + color.toString(16).padStart(6, '0');
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fill with transparent background
        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw main splatter shape
        context.fillStyle = cssColor;
        context.globalAlpha = 0.9;
        
        // Draw main circle (center of splatter)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const mainRadius = 70 + Math.random() * 30;
        
        context.beginPath();
        context.arc(centerX, centerY, mainRadius, 0, Math.PI * 2);
        context.fill();
        
        // Add random drips and splatters
        const numSplatters = 6 + Math.floor(Math.random() * 6);
        for (let i = 0; i < numSplatters; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = mainRadius * (0.5 + Math.random() * 0.8);
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            const size = 5 + Math.random() * 20;
            
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
            
            // Occasionally add drip effects
            if (Math.random() > 0.5) {
                const dripLength = 10 + Math.random() * 30;
                const dripWidth = size * 0.7;
                
                context.beginPath();
                context.ellipse(x, y + dripLength/2, dripWidth/2, dripLength/2, 0, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        return new THREE.CanvasTexture(canvas);
    }

    createMuzzleFlash() {
        // Create different muzzle flash based on weapon type
        let flashGeometry, flashMaterial, flashSize, flashDuration;
        
        if (this.currentWeapon === 'paintball') {
            // Smaller, green flash for paintball gun
            flashGeometry = new THREE.SphereGeometry(0.05);
            flashMaterial = new THREE.MeshBasicMaterial({
                color: 0x66ff66,
                transparent: true,
                opacity: 0.6
            });
            flashSize = 0.05;
            flashDuration = 30;
        } else if (this.currentWeapon === 'sniper') {
            // Large, bright flash for sniper
            flashGeometry = new THREE.SphereGeometry(0.15);
            flashMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.9
            });
            flashSize = 0.15;
            flashDuration = 70;
        } else {
            // Default rifle flash
            flashGeometry = new THREE.SphereGeometry(0.1);
            flashMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.8
            });
            flashSize = 0.1;
            flashDuration = 50;
        }
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        
        // Position flash at gun muzzle
        const currentWeaponProps = this.weapons[this.currentWeapon];
        if (this.currentWeapon === 'paintball') {
            flash.position.copy(currentWeaponProps.model.position);
            flash.position.z -= 0.35; // Position at the end of the barrel
        } else {
            flash.position.copy(currentWeaponProps.model.position);
            flash.position.z -= 0.25;
        }
        this.camera.add(flash);

        // Animate flash size
        const startTime = Date.now();
        const animateFlash = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / flashDuration;
            
            if (progress < 1) {
                const scaleValue = flashSize * (1 - progress);
                flash.scale.set(scaleValue, scaleValue, scaleValue);
                requestAnimationFrame(animateFlash);
            } else {
                this.camera.remove(flash);
            }
        };
        
        requestAnimationFrame(animateFlash);
    }

    /**
     * Main update method called every frame
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime = 1/60) {
        try {
            // Update bullet positions and check collisions
            this.updateBullets(deltaTime);
            
            // Update weapon animations
            this.updateWeaponAnimations(deltaTime);
            
        } catch (error) {
            console.error('Error in weapon update:', error);
        }
    }
    
    /**
     * Updates all active bullets, checks collisions, and creates effects
     * @param {number} deltaTime - Time since last update
     * @private
     */
    updateBullets(deltaTime) {
        // Skip if no bullets
        if (!this.bullets.length) return;
        
        // Update each bullet from end of array for safe removal
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Skip invalid bullets
            if (!bullet || !bullet.mesh) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Apply gravity to paintballs for more realistic arcs
            if (bullet.weaponType === 'paintball') {
                bullet.direction.y -= 0.01; // Simple gravity effect
                bullet.direction.normalize();
            }
            
            // Move bullet based on speed and delta time for consistent movement
            const moveDistance = bullet.speed * deltaTime * 60; // Normalize for 60fps
            bullet.mesh.position.add(
                bullet.direction.clone().multiplyScalar(moveDistance)
            );
            
            // Track total distance traveled
            bullet.distance += moveDistance;

            // Update raycaster position for collision detection
            bullet.raycaster.set(bullet.mesh.position, bullet.direction);

            // Check for collisions with scene objects
            const intersects = bullet.raycaster.intersectObjects(this.scene.children, true);
            
            // Process collision if it happened within this frame's movement
            if (intersects.length > 0 && intersects[0].distance < moveDistance) {
                // Get hit object and surface info
                const hitObject = intersects[0].object;
                const hitPoint = intersects[0].point;
                const hitNormal = intersects[0].face.normal;
                
                // Create appropriate effect based on weapon type and surface
                if (bullet.weaponType === 'paintball') {
                    // Paint splatter for paintball gun
                    this.createPaintSplatter(hitPoint, hitNormal);
                } else {
                    // Bullet impact effect for other weapons
                    this.createBulletImpact(hitPoint, hitNormal, bullet.weaponType);
                }
                
                // Check if we hit an enemy and apply damage
                if (hitObject && hitObject.userData && hitObject.userData.isEnemy) {
                    if (hitObject.userData.takeDamage) {
                        hitObject.userData.takeDamage(bullet.damage);
                    }
                }
                
                // Remove the bullet
                this.scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                this.bullets.splice(i, 1);
                continue;
            }

            // Remove bullets that have traveled too far
            if (bullet.distance > 100) {
                this.scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                this.bullets.splice(i, 1);
            }
        }
    }
    
    /**
     * Updates all weapon animations (recoil, reload, weapon switch)
     * @param {number} deltaTime - Time since last update
     * @private 
     */
    updateWeaponAnimations(deltaTime) {

        // Update recoil animation
        if (this.recoilState.active) {
            const elapsed = Date.now() - this.recoilState.startTime;
            const progress = Math.min(elapsed / 200, 1); // 200ms duration

            const weaponModel = this.weapons[this.currentWeapon].model;
            if (weaponModel) {
                // Different recoil based on weapon type
                let recoilAmount, recoilLift;
                
                switch (this.currentWeapon) {
                    case 'sniper':
                        recoilAmount = 0.08; // Strong backward recoil
                        recoilLift = 0.04;  // Significant upward recoil
                        break;
                    case 'paintball':
                        recoilAmount = 0.03; // Light backward recoil
                        recoilLift = 0.01;  // Light upward recoil
                        break;
                    default: // rifle
                        recoilAmount = 0.05; // Medium backward recoil
                        recoilLift = 0.02;  // Medium upward recoil
                }
                
                // Apply smooth recoil using sin curve for natural motion
                weaponModel.position.copy(this.recoilState.originalPosition);
                weaponModel.position.z -= recoilAmount * Math.sin(progress * Math.PI);
                weaponModel.position.y += recoilLift * Math.sin(progress * Math.PI);
                
                // Add slight rotation for more realistic recoil
                weaponModel.rotation.x = -recoilLift * 2 * Math.sin(progress * Math.PI);

                // Reset when animation completes
                if (progress >= 1) {
                    this.recoilState.active = false;
                    weaponModel.position.copy(this.recoilState.originalPosition);
                    weaponModel.rotation.x = 0;
                }
            }
        }

        // Update weapon switch animation
        if (this.switchState.active) {
            const elapsed = Date.now() - this.switchState.startTime;
            const progress = Math.min(elapsed / 300, 1); // 300ms duration
            
            const weaponModel = this.weapons[this.currentWeapon].model;
            if (weaponModel) {
                // More dynamic weapon switch animation
                if (progress < 1) {
                    // First half - weapon moving down and rotating out
                    if (progress < 0.5) {
                        const p = progress * 2; // Rescale 0-0.5 to 0-1
                        weaponModel.position.y = this.switchState.originalPosition.y - 0.2 * p;
                        weaponModel.rotation.x = this.switchState.originalRotation.x + 0.3 * p;
                        weaponModel.position.z = this.switchState.originalPosition.z + 0.1 * p;
                    } 
                    // Second half - weapon moving back up and rotating in
                    else {
                        const p = (progress - 0.5) * 2; // Rescale 0.5-1 to 0-1
                        weaponModel.position.y = this.switchState.originalPosition.y - 0.2 * (1 - p);
                        weaponModel.rotation.x = this.switchState.originalRotation.x + 0.3 * (1 - p);
                        weaponModel.position.z = this.switchState.originalPosition.z + 0.1 * (1 - p);
                    }
                } else {
                    // Animation complete - reset to original position
                    weaponModel.position.copy(this.switchState.originalPosition);
                    weaponModel.rotation.copy(this.switchState.originalRotation);
                    this.switchState.active = false;
                }
            }
        }

        // Update reload animation
        this.updateReload();
    }
}