/**
 * @fileoverview Weapon management system for a 3D first-person shooter game.
 * Handles multiple weapon types, shooting mechanics, and visual effects.
 */
import * as THREE from '/node_modules/three/build/three.module.js';
import { WeaponModels } from '/src/weapons/weaponModels.js';

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
                bulletSize: 0.08,
                bulletColor: 0xff0000,  // Red paintballs for pistol
                modelScale: { x: 0.1, y: 0.1, z: 0.5 },
                position: { x: 0.3, y: -0.2, z: -0.5 },
                maxAmmo: 20,  // Lower ammo for paintball pistol
                currentAmmo: 20,
                reloadTime: 1500,
                weaponType: 'paintball_pistol'
            },
            sniper: {
                model: null,
                bulletSpeed: 2.0,
                damage: 15,  // Lower damage for balance with faster firing
                shootingDelay: 100,  // Much faster fire rate for assault rifle style
                bulletSize: 0.08,
                bulletColor: 0xff5500,  // Orange paintballs for rifle
                modelScale: { x: 0.1, y: 0.1, z: 0.8 },
                position: { x: 0.3, y: -0.2, z: -0.7 },
                maxAmmo: 100,  // More ammo for rapid-fire paintball rifle (hopper)
                currentAmmo: 100,
                reloadTime: 2000,
                weaponType: 'paintball_rifle'
            },
            paintball: {
                model: null,
                bulletSpeed: 2.5,  // Faster for sniper
                damage: 40,  // More damage for sniper
                shootingDelay: 800,  // Slower but more powerful
                bulletSize: 0.09,
                bulletColor: 0x0000ff,  // Blue paintballs for sniper
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
     * Updates the weapon selection UI indicators
     */
    updateWeaponUI() {
        // Create or get weapon selection UI
        let weaponUI = document.getElementById('weapon-selection-ui');
        if (!weaponUI) {
            weaponUI = document.createElement('div');
            weaponUI.id = 'weapon-selection-ui';
            weaponUI.style.position = 'absolute';
            weaponUI.style.bottom = '20px';
            weaponUI.style.right = '20px';
            weaponUI.style.display = 'flex';
            weaponUI.style.gap = '10px';
            weaponUI.style.zIndex = '1000';
            document.body.appendChild(weaponUI);
            
            // Create weapon selection indicators
            const weapons = ['rifle', 'sniper', 'paintball'];
            const weaponLabels = ['Pistol', 'Rifle', 'Sniper'];
            const keys = ['1', '2', '3'];
            
            weapons.forEach((weapon, index) => {
                const indicator = document.createElement('div');
                indicator.id = `weapon-indicator-${weapon}`;
                indicator.style.width = '60px';
                indicator.style.height = '60px';
                indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                indicator.style.color = 'white';
                indicator.style.display = 'flex';
                indicator.style.flexDirection = 'column';
                indicator.style.justifyContent = 'center';
                indicator.style.alignItems = 'center';
                indicator.style.borderRadius = '5px';
                indicator.style.padding = '5px';
                indicator.style.cursor = 'pointer';
                indicator.style.transition = 'all 0.2s';
                
                // Add key indicator
                const keyEl = document.createElement('div');
                keyEl.textContent = keys[index];
                keyEl.style.fontSize = '16px';
                keyEl.style.fontWeight = 'bold';
                indicator.appendChild(keyEl);
                
                // Add weapon name with paintball theme
                const nameEl = document.createElement('div');
                nameEl.textContent = weaponLabels[index];
                nameEl.style.fontSize = '12px';
                nameEl.style.textAlign = 'center';
                indicator.appendChild(nameEl);
                
                // Add click handler to select this weapon
                indicator.addEventListener('click', () => {
                    this.switchToWeapon(weapon);
                });
                
                weaponUI.appendChild(indicator);
            });
        }
        
        // Update the active weapon indicator
        document.querySelectorAll('[id^="weapon-indicator-"]').forEach(indicator => {
            const weaponType = indicator.id.split('-').pop();
            if (weaponType === this.currentWeapon) {
                indicator.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                indicator.style.transform = 'scale(1.1)';
                indicator.style.border = '2px solid white';
            } else {
                indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                indicator.style.transform = 'scale(1)';
                indicator.style.border = 'none';
            }
        });
    }
    
    /**
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
            originalPosition: new THREE.Vector3(),
            cameraPositionAtRecoilStart: new THREE.Vector3()
        };
        
        // State for weapon switch animation
        this.switchState = {
            active: false,
            startTime: 0,
            originalPosition: new THREE.Vector3(),
            originalRotation: new THREE.Euler(),
            cameraPositionAtSwitchStart: new THREE.Vector3()
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
     * Creates all weapon models and adds them to the camera using the WeaponModels class
     * @private
     */
    createWeaponModels() {
        try {
            // Initialize the weapon models using the separate WeaponModels class
            const weaponModelsManager = new WeaponModels(THREE, this.weapons, this.camera);
            
            // Get the initialized models and assign them to our weapon properties
            const models = weaponModelsManager.initializeModels();
            
            // Assign models to our weapon properties
            this.weapons.rifle.model = models.rifle;
            this.weapons.sniper.model = models.sniper;
            this.weapons.paintball.model = models.paintball;
            
            // NEW APPROACH: Add models to the scene instead of the camera
            // This ensures they're rendered properly
            console.log('Adding weapon models to scene...');
            this.scene.add(this.weapons.rifle.model);
            this.scene.add(this.weapons.sniper.model);
            this.scene.add(this.weapons.paintball.model);
            
            // Set models to be very bright so they're easier to see for debugging
            this.weapons.rifle.model.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.emissive = new THREE.Color(0x331111);
                }
            });
            
            // Set initial positions (will be updated in the update method)
            this._updateWeaponPositions();
            
            // Add a light to illuminate the weapons
            const weaponLight = new THREE.PointLight(0xffffff, 1, 2);
            weaponLight.name = 'weaponLight';
            this.scene.add(weaponLight);
            
            console.log('Weapon setup complete. Models:', 
                'rifle:', this.weapons.rifle.model,
                'sniper:', this.weapons.sniper.model,
                'paintball:', this.weapons.paintball.model
            );
            
            // Ensure models have material
            this._verifyModelMaterials(this.weapons.rifle.model);
            this._verifyModelMaterials(this.weapons.sniper.model);
            this._verifyModelMaterials(this.weapons.paintball.model);
            
            // Initially show rifle and hide others
            this.setInitialWeaponVisibility();
            
            // Add weapon names for debugging
            this.weapons.rifle.model.name = 'paintball_pistol';
            this.weapons.sniper.model.name = 'paintball_rifle';
            this.weapons.paintball.model.name = 'paintball_sniper';
            
        } catch (error) {
            console.error('Error creating weapon models:', error);
        }
    }
    
    // Weapon model creation methods have been moved to the textures/weaponModels.js file
    
    /**
     * Helper method to verify model materials are set up correctly
     * @param {THREE.Object3D} model - The model to check
     * @private
     */
    /**
     * Updates the position of weapon models to follow the camera
     * @private
     */
    _updateWeaponPositions() {
        if (!this.camera) return;
        
        // Get camera position and direction - direct reference instead of clone for immediate sync
        const cameraPosition = this.camera.position;
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(this.camera.quaternion);
        
        // Create a matrix to transform from camera space to world space
        const matrix = new THREE.Matrix4();
        matrix.makeRotationFromQuaternion(this.camera.quaternion);
        
        // Apply position to all weapons with weapon-specific positioning
        Object.keys(this.weapons).forEach(weaponType => {
            if (!this.weapons[weaponType].model) return;
            
            // Define weapon-specific offsets (position relative to camera)
            let weaponOffset;
            let scale = 1.0;
            
            if (weaponType === 'paintball') {
                // Paintball gun should be more centered and held realistically
                weaponOffset = {
                    x: 0.15,   // More centered horizontally
                    y: -0.28,  // Raised higher in view
                    z: -0.55   // Closer to camera for better visibility
                };
                // Make paintball gun larger
                scale = 1.25;
            } else if (weaponType === 'sniper') {
                weaponOffset = {
                    x: 0.25,  // Slightly right
                    y: -0.38, // Lower in view
                    z: -0.70  // Further from camera
                };
            } else {
                // Default rifle position
                weaponOffset = {
                    x: 0.3,  // Right side
                    y: -0.4, // Below center
                    z: -0.7  // Standard distance
                };
            }
            
            // Calculate weapon position in world space by applying offset to camera position
            const offsetVector = new THREE.Vector3(weaponOffset.x, weaponOffset.y, weaponOffset.z);
            offsetVector.applyMatrix4(matrix);
            
            // Use the actual camera position rather than a clone to maintain direct connection
            // This prevents any lag between camera and weapon position updates
            this.weapons[weaponType].model.position.copy(cameraPosition).add(offsetVector);
            
            // Match the rotation of the camera (weapon points where camera looks)
            this.weapons[weaponType].model.quaternion.copy(this.camera.quaternion);
            
            // Apply weapon-specific scale
            this.weapons[weaponType].model.scale.set(scale, scale, scale);
        });
        
        // Also update weapon light position - direct reference for immediate update
        const weaponLight = this.scene.getObjectByName('weaponLight');
        if (weaponLight) {
            weaponLight.position.copy(cameraPosition);
        }
    }
    
    _verifyModelMaterials(model) {
        if (!model) {
            console.warn('Cannot verify materials for undefined model');
            return;
        }
        
        // Traverse through all children of the model
        model.traverse(child => {
            // Check if the child is a mesh with material
            if (child.isMesh) {
                console.log('Found mesh in weapon model:', child.name, child);
                
                // Ensure material exists
                if (!child.material) {
                    console.warn('Mesh is missing material:', child.name);
                    child.material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Add default red material
                }
                
                // Force material to be visible
                child.material.needsUpdate = true;
                child.visible = true;
                
                // Add userData for debugging
                child.userData.isWeaponPart = true;
            }
        });
        
        // Set the model to be visible
        model.visible = true;
        console.log('Model visibility set to:', model.visible);
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
        } else if (event.button === 2 && (this.currentWeapon === 'sniper' || this.currentWeapon === 'paintball')) { // Right click for scope - sniper and paintball sniper
            this.toggleScope(true);
        }
    }

    handleMouseUp(event) {
        if (event.button === 0) { // Left mouse button released
            this.autoFiring = false;
        } else if (event.button === 2 && (this.currentWeapon === 'sniper' || this.currentWeapon === 'paintball')) {
            this.toggleScope(false);
        }
    }

    /**
     * Toggles the sniper scope view based on input state
     * @param {boolean} scoped - Whether to enter or exit scoped view
     */
    toggleScope(scoped) {
        try {
            // Only continue if current weapon is a sniper rifle or paintball sniper
            if (this.currentWeapon !== 'sniper' && this.currentWeapon !== 'paintball') {
                console.log('Scope toggle only available for sniper rifles');
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
        // Map numeric keys to specific weapons
        if (event.key === '1') {
            this.switchToWeapon('rifle');
        } else if (event.key === '2') {
            this.switchToWeapon('sniper');
        } else if (event.key === '3') {
            this.switchToWeapon('paintball');
        }
    }

    /**
     * Switch to a specific weapon
     * @param {string} weaponType - Type of weapon to switch to ('rifle', 'sniper', or 'paintball')
     */
    switchToWeapon(weaponType) {
        // Validate weapon type
        if (!this.weapons[weaponType]) {
            console.error(`Invalid weapon type: ${weaponType}`);
            return;
        }
        
        // Don't switch if already using this weapon
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
        
        // Display the current mode to the player
        this.showWeaponModeMessage(weaponType);
        
        // Update weapon UI
        this.updateWeaponUI();
        
        // Add a small weapon switch animation
        const weaponModel = this.weapons[weaponType].model;
        this.switchState.active = true;
        this.switchState.startTime = Date.now();
        
        // Save the camera position at the start of the switch animation
        this.switchState.cameraPositionAtSwitchStart = this.camera.position.clone();
        
        // Save original position and rotation relative to the camera
        this.switchState.originalPosition = weaponModel.position.clone();
        this.switchState.originalRotation = weaponModel.rotation.clone();
    }

    generateSimplePaintballColor() {
        // Create a simple random color for paintball without using canvas
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00, 0x00ffff];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Handles shooting for the current weapon
     * @param {MouseEvent} event - The mouse event that triggered the shot
     */
    shoot(event) {
        try {
            // If event is provided, check if it's left click and start auto-firing
            if (event) {
                if (event.button !== 0) return;
                this.autoFiring = true;
            }
            
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
            
            // Update last shot time and reduce ammo (skip ammo reduction for paintball for testing)
            this.lastShot = now;
            if (this.currentWeapon !== 'paintball') {
                currentWeaponProps.currentAmmo--;
            } else {
                // Ensure paintball gun always has ammo for testing
                currentWeaponProps.currentAmmo = Math.max(currentWeaponProps.currentAmmo, 1);
            }
            
            // Update UI ammo count if available
            if (this.gameState.updateAmmoUI) {
                if (this.currentWeapon === 'paintball') {
                    // Display infinity symbol for paintball ammo
                    this.gameState.updateAmmoUI('∞', currentWeaponProps.maxAmmo, true);
                } else {
                    this.gameState.updateAmmoUI(currentWeaponProps.currentAmmo, currentWeaponProps.maxAmmo);
                }
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
        
        // Instead of saving the absolute position, save the relative offset from camera
        // This ensures the weapon stays attached to camera during movement
        this.recoilState.cameraPositionAtRecoilStart = this.camera.position.clone();
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
        let spreadFactor = 0.01; // Default spread
        
        // Different spread based on paintball weapon type
        if (weaponProps.weaponType === 'paintball_sniper') {
            spreadFactor = this.isScoped ? 0.0005 : 0.008; // Very accurate when scoped
        } else if (weaponProps.weaponType === 'paintball_rifle') {
            spreadFactor = 0.007; // Medium accuracy
        } else if (weaponProps.weaponType === 'paintball_pistol') {
            spreadFactor = 0.012; // Less accurate pistol
        }
        
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
        if (!weaponModel) return;
        
        // Set weapon-specific reload durations
        let reloadDuration = 1500; // Default reload duration
        
        if (this.currentWeapon === 'paintball') {
            // Paintball reloads are typically just checking/adjusting the hopper,
            // which can be shorter than magazine changes for other weapons
            reloadDuration = 1200;
            
            // Play a sound effect if sound system exists
            if (this.audioSystem && this.audioSystem.playSound) {
                this.audioSystem.playSound('hopperShake', 0.5);
            }
        } else if (this.currentWeapon === 'sniper') {
            // Sniper rifles might take longer to reload
            reloadDuration = 2000;
        }
        
        this.reloadState = {
            active: true,
            startTime: Date.now(),
            duration: reloadDuration,
            rotationStart: weaponModel.rotation.clone(),
            positionStart: weaponModel.position.clone()
        };
    }

    updateReload() {
        if (!this.reloadState.active) return;

        const weaponModel = this.weapons[this.currentWeapon].model;
        const elapsed = Date.now() - this.reloadState.startTime;
        const progress = Math.min(elapsed / this.reloadState.duration, 1);

        // Weapon-specific reload animations
        if (this.currentWeapon === 'paintball') {
            // Paintball gun reload animation - focusing on hopper manipulation
            if (progress < 0.3) {
                // First phase: Angle the gun and look at hopper
                weaponModel.rotation.x = this.reloadState.rotationStart.x + Math.PI * 0.15 * (progress / 0.3);
                weaponModel.rotation.z = this.reloadState.rotationStart.z + Math.PI * 0.08 * (progress / 0.3);
            } 
            else if (progress < 0.7) {
                // Second phase: Tap/adjust the hopper (common in paintball to ensure proper feed)
                // Keep the tilt
                weaponModel.rotation.x = this.reloadState.rotationStart.x + Math.PI * 0.15;
                weaponModel.rotation.z = this.reloadState.rotationStart.z + Math.PI * 0.08;
                
                // Add a tapping/shaking motion to the hopper
                const tapPhase = (progress - 0.3) / 0.4; // Normalize to 0-1 for this phase
                // Quick up-down motion for tapping
                weaponModel.position.y = this.reloadState.positionStart.y + 
                                    0.015 * Math.sin(tapPhase * Math.PI * 8);
                // Slight side to side shake
                weaponModel.rotation.y = this.reloadState.rotationStart.y + 
                                    0.02 * Math.sin(tapPhase * Math.PI * 6);
            } 
            else {
                // Final phase: Return to original position
                const returnPhase = (progress - 0.7) / 0.3; // Normalize to 0-1 for return
                weaponModel.rotation.x = this.reloadState.rotationStart.x + Math.PI * 0.15 * (1 - returnPhase);
                weaponModel.rotation.z = this.reloadState.rotationStart.z + Math.PI * 0.08 * (1 - returnPhase);
                weaponModel.rotation.y = this.reloadState.rotationStart.y + (0.02 * Math.sin((1-returnPhase) * Math.PI * 6) * (1-returnPhase));
                weaponModel.position.y = this.reloadState.positionStart.y;
            }
        } 
        else {
            // Standard reload animation for other weapons
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
        }

        if (progress >= 1) {
            this.reloadState.active = false;
            weaponModel.rotation.copy(this.reloadState.rotationStart);
            weaponModel.position.copy(this.reloadState.positionStart);
        }
    }

    /**
     * Displays a message showing the current weapon mode
     * @param {string} mode - The current weapon mode
     * @private
     */
    /**
     * Displays a message about the currently selected weapon
     * @param {string} mode - The weapon mode to display
     */
    showWeaponModeMessage(mode) {
        // Get mode name in a user-friendly format
        let modeName, modeColor, keyNumber;
        
        switch(mode) {
            case 'rifle':
                modeName = "ASSAULT RIFLE";
                modeColor = "#ff7700";
                keyNumber = "1";
                break;
            case 'sniper':
                modeName = "SNIPER RIFLE";
                modeColor = "#00aaff";
                keyNumber = "2";
                break;
            case 'paintball':
                modeName = "PAINTBALL GUN";
                modeColor = "#00ff00";
                keyNumber = "3";
                break;
            default:
                modeName = mode.toUpperCase();
                modeColor = "#ffffff";
                keyNumber = "";
        }
        
        // Create or update message element
        let msgElement = document.getElementById('weapon-mode-message');
        
        if (!msgElement) {
            msgElement = document.createElement('div');
            msgElement.id = 'weapon-mode-message';
            msgElement.style.position = 'fixed';
            msgElement.style.top = '60px'; // Moved to top to avoid overlapping with weapon selection UI
            msgElement.style.left = '50%';
            msgElement.style.transform = 'translateX(-50%)';
            msgElement.style.padding = '10px 15px';
            msgElement.style.background = 'rgba(0, 0, 0, 0.7)';
            msgElement.style.color = '#ffffff';
            msgElement.style.fontFamily = 'Arial, sans-serif';
            msgElement.style.fontSize = '18px';
            msgElement.style.fontWeight = 'bold';
            msgElement.style.borderRadius = '5px';
            msgElement.style.transition = 'opacity 0.5s';
            msgElement.style.zIndex = '9999';
            document.body.appendChild(msgElement);
        }
        
        // Set message content with key binding
        if (keyNumber) {
            msgElement.innerHTML = `<span style="color:${modeColor}">${modeName}</span> <span style="color:#aaaaaa">(Press ${keyNumber})</span>`;
        } else {
            msgElement.innerHTML = `<span style="color:${modeColor}">${modeName}</span>`;
        }
        msgElement.style.opacity = '1';
        
        // Fade out after 2 seconds
        setTimeout(() => {
            msgElement.style.opacity = '0';
        }, 2000);
    }
    
    /**
     * Generates procedural textures for weapon models
     * @param {string} weaponType - The type of weapon ('rifle', 'sniper', 'paintball')
     * @param {Object} options - Configuration options for the texture
     * @returns {THREE.CanvasTexture} - The generated texture
     */
    generateWeaponTexture(weaponType, options = {}) {
        // Set default options
        const defaults = {
            baseColor: 0x444444,     // Base weapon color
            patternColor: 0x222222,  // Pattern/detail color
            highlightColor: 0x888888, // Highlight color for wear edges
            wearLevel: 0.3,          // 0.0 to 1.0 level of wear (scratches/damage)
            resolution: 512          // Texture resolution
        };
        
        // Merge defaults with provided options
        const config = {...defaults, ...options};
        
        // Create canvas and get context
        const canvas = document.createElement('canvas');
        canvas.width = config.resolution;
        canvas.height = config.resolution;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = '#' + config.baseColor.toString(16).padStart(6, '0');
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply different patterns based on weapon type
        switch(weaponType) {
            case 'rifle':
                this.generateRiflePattern(ctx, canvas.width, canvas.height, config);
                break;
            case 'sniper':
                this.generateSniperPattern(ctx, canvas.width, canvas.height, config);
                break;
            case 'paintball':
                this.generatePaintballPattern(ctx, canvas.width, canvas.height, config);
                break;
            default:
                this.generateDefaultPattern(ctx, canvas.width, canvas.height, config);
        }
        
        // Apply wear/scratches over the base texture
        this.applyWearEffect(ctx, canvas.width, canvas.height, config);
        
        // Create and return canvas texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    /**
     * Generates pattern specific to the rifle weapon
     * @private
     */
    generateRiflePattern(ctx, width, height, config) {
        // Convert colors to strings
        const patternColor = '#' + config.patternColor.toString(16).padStart(6, '0');
        
        // Add grip texture (diagonal lines)
        ctx.strokeStyle = patternColor;
        ctx.lineWidth = 1;
        
        // Draw grip pattern
        for (let i = 0; i < width; i += 6) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i - height, height);
            ctx.stroke();
        }
        
        // Add small details
        ctx.fillStyle = patternColor;
        
        // Add small rectangles for details
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const w = 2 + Math.random() * 10;
            const h = 2 + Math.random() * 10;
            ctx.fillRect(x, y, w, h);
        }
    }
    
    /**
     * Generates pattern specific to the sniper weapon
     * @private
     */
    generateSniperPattern(ctx, width, height, config) {
        // Convert colors to strings
        const patternColor = '#' + config.patternColor.toString(16).padStart(6, '0');
        const highlightColor = '#' + config.highlightColor.toString(16).padStart(6, '0');
        
        // Create digital camo pattern
        ctx.fillStyle = patternColor;
        
        const blockSize = 20;
        for (let x = 0; x < width; x += blockSize) {
            for (let y = 0; y < height; y += blockSize) {
                if (Math.random() > 0.6) {
                    ctx.fillRect(x, y, blockSize, blockSize);
                }
            }
        }
        
        // Add precision stripes
        ctx.fillStyle = highlightColor;
        ctx.fillRect(0, height * 0.3, width, 2);
        ctx.fillRect(0, height * 0.7, width, 2);
    }
    
    /**
     * Generates pattern specific to the paintball weapon
     * @private
     */
    generatePaintballPattern(ctx, width, height, config) {
        // Create bright, colorful paintball gun texture
        const patternColor = '#' + config.patternColor.toString(16).padStart(6, '0');
        
        // Add bright paint splatter effects
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 3 + Math.random() * 15;
            
            // Random vibrant colors for splatter
            const r = Math.floor(Math.random() * 255);
            const g = Math.floor(Math.random() * 255);
            const b = Math.floor(Math.random() * 255);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add design stripes
        ctx.strokeStyle = patternColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.2);
        ctx.lineTo(width, height * 0.2);
        ctx.moveTo(0, height * 0.8);
        ctx.lineTo(width, height * 0.8);
        ctx.stroke();
    }
    
    /**
     * Generates a default pattern for any weapon type
     * @private
     */
    generateDefaultPattern(ctx, width, height, config) {
        // Simple pattern for fallback
        const patternColor = '#' + config.patternColor.toString(16).padStart(6, '0');
        
        // Add grid pattern
        ctx.strokeStyle = patternColor;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < width; i += width / 10) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        
        for (let i = 0; i < height; i += height / 10) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }
    }
    
    /**
     * Applies wear and scratches to the weapon texture
     * @private
     */
    applyWearEffect(ctx, width, height, config) {
        // Convert colors to strings
        const highlightColor = '#' + config.highlightColor.toString(16).padStart(6, '0');
        
        // Skip if wear level is zero
        if (config.wearLevel <= 0) return;
        
        // Calculate number of scratches based on wear level
        const scratchCount = Math.floor(config.wearLevel * 100);
        
        // Add scratches/wear marks
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < scratchCount; i++) {
            const x1 = Math.random() * width;
            const y1 = Math.random() * height;
            const length = 5 + Math.random() * 30;
            const angle = Math.random() * Math.PI * 2;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + Math.cos(angle) * length, y1 + Math.sin(angle) * length);
            ctx.stroke();
        }
        
        // Add edge wear
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 3;
        if (Math.random() > 0.5) {
            ctx.strokeRect(0, 0, width, height);
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
                case 'paintball_rifle':
                    particleCount = 20;  // More particles for bigger splatter
                    particleSize = 0.025;
                    particleVelocity = 0.18;
                    impactRadius = 0.15; // Larger impact
                    break;
                
                case 'paintball_sniper':
                    particleCount = 25;  // More particles for bigger splatter
                    particleSize = 0.03;
                    particleVelocity = 0.2;
                    impactRadius = 0.18; // Largest impact
                    break;
                    
                case 'paintball_pistol':
                    particleCount = 15;
                    particleSize = 0.02;
                    particleVelocity = 0.14;
                    impactRadius = 0.12;
                    break;
                    
                default: // other weapons
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
        
        // Create particle material if not already cached
        if (!this.particleMaterial) {
            this.particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,  // Will be modified per particle
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending // Changed to additive for more vibrant paint look
            });
        }
        
        // Create variety of geometries for different paint particle shapes
        if (!this.particleGeometries) {
            this.particleGeometries = [
                new THREE.SphereGeometry(1, 6, 6),               // Classic droplet
                new THREE.BoxGeometry(1, 0.3, 1),                // Flat splat
                new THREE.TetrahedronGeometry(1),                // Angular paint chip
                new THREE.PlaneGeometry(1, 1),                   // Flat spray
                new THREE.CircleGeometry(1, 8)                   // 2D splatter for wall impacts
            ];
        }
        
        // Create the impact particles
        for (let i = 0; i < count; i++) {
            // Clone the material to set unique color and opacity
            const particleMaterial = this.particleMaterial.clone();
            
            // Enhanced color variation for paint-like effect
            const colorVariation = 0.15;
            const hsl = new THREE.Color(baseColor).getHSL({});
            const newColor = new THREE.Color().setHSL(
                hsl.h + (Math.random() * 2 - 1) * 0.05,  // slight hue variation
                Math.min(1, Math.max(0, hsl.s + (Math.random() * 2 - 1) * colorVariation)),
                Math.min(1, Math.max(0, hsl.l + (Math.random() * 2 - 1) * colorVariation))
            );
            
            particleMaterial.color = newColor;
            
            // Select random geometry for varied particles
            const geometryIndex = Math.floor(Math.random() * this.particleGeometries.length);
            const particle = new THREE.Mesh(this.particleGeometries[geometryIndex], particleMaterial);
            particle.name = 'paintSplatterParticle';
            
            // More varied and paint-like scaling
            const particleScale = size * (0.3 + Math.random() * 0.8);
            
            // For some particles, create non-uniform scaling for more paint-like appearance
            if (Math.random() > 0.5) {
                particle.scale.set(
                    particleScale * (0.8 + Math.random() * 0.6), 
                    particleScale * (0.2 + Math.random() * 0.3), 
                    particleScale * (0.8 + Math.random() * 0.6)
                );
            } else {
                particle.scale.set(particleScale, particleScale, particleScale);
            }
            
            // Random rotation for more natural appearance
            particle.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            // Slightly varied starting position for more natural dispersion
            const posOffset = 0.05;
            particle.position.copy(position).add(
                new THREE.Vector3(
                    (Math.random() - 0.5) * posOffset,
                    (Math.random() - 0.5) * posOffset,
                    (Math.random() - 0.5) * posOffset
                )
            );
            
            // Create velocity vector for paint-like motion
            const particleVelocity = new THREE.Vector3();
            
            // Add normal component (bouncing off surface)
            particleVelocity.copy(normal).multiplyScalar(velocity * (0.3 + Math.random() * 0.8));
            
            // Add random spread component with wider spread for paint splatter effect
            const randomSpread = new THREE.Vector3(
                (Math.random() - 0.5) * velocity * 1.8,
                (Math.random() - 0.5) * velocity * 1.2,
                (Math.random() - 0.5) * velocity * 1.8
            );
            
            // Adjust for different surface types
            if (surfaceType === 'floor') {
                // Floor impacts: more upward spray with wide splash
                randomSpread.y = Math.abs(randomSpread.y) * 0.7;
                randomSpread.x *= 1.5;
                randomSpread.z *= 1.5;
            } else if (surfaceType === 'wall') {
                // Wall impacts: more horizontal spread with dripping tendency
                randomSpread.y *= 0.7;
                if (Math.random() > 0.6) randomSpread.y = -Math.abs(randomSpread.y) * 0.5; // Dripping effect
                randomSpread.x *= 1.8;
                randomSpread.z *= 1.8;
            }
            
            particleVelocity.add(randomSpread);
            
            // Store properties with the particle
            particle.userData = {
                velocity: particleVelocity,
                lifetime: 0.5 + Math.random() * 0.8, // 0.5 to 1.3 second lifetime for more variation
                startTime: Date.now(),
                gravity: surfaceType === 'floor' ? 0.001 : 0.003,
                isDripping: Math.random() > 0.7 && surfaceType === 'wall', // 30% chance of dripping on walls
                originalScale: particle.scale.clone(),
                surfaceNormal: normal.clone(),
                surfaceType: surfaceType
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
                const lifetimeFraction = elapsed / data.lifetime;
                
                if (elapsed < data.lifetime) {
                    allDone = false;
                    
                    // Update position based on velocity
                    particle.position.add(data.velocity);
                    
                    // Apply gravity 
                    data.velocity.y -= data.gravity;
                    
                    // Air resistance - paint is viscous so it slows down faster than normal particles
                    data.velocity.multiplyScalar(0.96);
                    
                    // Special behaviors based on particle properties
                    if (data.isDripping && lifetimeFraction > 0.3) {
                        // Dripping behavior for wall impacts
                        // Slow horizontal movement
                        data.velocity.x *= 0.9;
                        data.velocity.z *= 0.9;
                        
                        // Increase downward velocity for dripping effect
                        data.velocity.y -= 0.001;
                        
                        // Elongate the particle to simulate dripping
                        if (lifetimeFraction > 0.5) {
                            const stretchFactor = 1 + (lifetimeFraction - 0.5) * 3;
                            particle.scale.y = data.originalScale.y * stretchFactor;
                            particle.scale.x = data.originalScale.x * Math.max(0.5, 1 - (lifetimeFraction - 0.5));
                            particle.scale.z = data.originalScale.z * Math.max(0.5, 1 - (lifetimeFraction - 0.5));
                        }
                    } else if (lifetimeFraction > 0.7) {
                        // For particles near end of life, flatten against surface for splat effect
                        const flattenFactor = (lifetimeFraction - 0.7) / 0.3; // 0 to 1 over the last 30% of lifetime
                        
                        // Align with surface and flatten
                        if (!data.hasFlattened) {
                            // Orient to surface
                            if (data.surfaceType === 'wall') {
                                particle.lookAt(particle.position.clone().add(data.surfaceNormal));
                            }
                            data.hasFlattened = true;
                        }
                        
                        // Flatten against surface
                        particle.scale.y = data.originalScale.y * Math.max(0.1, 1 - flattenFactor * 0.9);
                        particle.scale.x = data.originalScale.x * (1 + flattenFactor * 0.3);
                        particle.scale.z = data.originalScale.z * (1 + flattenFactor * 0.3);
                        
                        // Slow movement drastically as particle sticks to surface
                        data.velocity.multiplyScalar(0.85);
                    }
                    
                    // Fade out based on lifetime
                    particle.material.opacity = 0.9 * (1 - lifetimeFraction * lifetimeFraction); // Quadratic fade for more natural look
                    
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
        canvas.width = 512; // Higher resolution for more detailed splatter
        canvas.height = 512;
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
        const splashRadius = surfaceType === 'wall' ? canvas.width / 2.3 : canvas.width / 2.8;
        
        // Create main paint blob with translucent center
        const mainGradient = context.createRadialGradient(
            centerX, centerY, splashRadius * 0.6,
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
        
        // Generate irregular blob with more points for more complex shape
        const points = 15 + Math.floor(Math.random() * 5);
        const angleStep = (Math.PI * 2) / points;
        const irregularity = 0.2;
        
        // Starting point
        const firstRadius = splashRadius * (1 - irregularity/2 + Math.random() * irregularity);
        const firstX = centerX + Math.cos(0) * firstRadius;
        const firstY = centerY + Math.sin(0) * firstRadius;
        context.moveTo(firstX, firstY);
        
        // Draw the rest using bezier curves for smoother, organic shape
        for (let i = 1; i <= points; i++) {
            const angle = i * angleStep;
            const prevAngle = (i - 1) * angleStep;
            
            // Random radius for this point with more variation
            const radius = splashRadius * (1 - irregularity/2 + Math.random() * irregularity);
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Control points for bezier curve - add more variance for paint-like appearance
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
        
        // Add paint "arms" - extending splatters from the main blob
        const numArms = 10 + Math.floor(Math.random() * 8); // 10-17 arms
        
        for (let i = 0; i < numArms; i++) {
            context.save();
            
            // Start from a random point near the edge of the main blob
            const angle = Math.random() * Math.PI * 2;
            const startRadius = splashRadius * (0.4 + Math.random() * 0.5);
            const startX = centerX + Math.cos(angle) * startRadius;
            const startY = centerY + Math.sin(angle) * startRadius;
            
            // Arm length and width
            const armLength = splashRadius * (0.3 + Math.random() * 0.7); // 30-100% of radius
            const armWidth = armLength * (0.1 + Math.random() * 0.2);
            
            // End point
            const endX = centerX + Math.cos(angle) * (startRadius + armLength);
            const endY = centerY + Math.sin(angle) * (startRadius + armLength);
            
            // Create gradient for the arm
            const armGradient = context.createLinearGradient(startX, startY, endX, endY);
            armGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
            armGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.7)`);
            armGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.2)`);
            
            // Draw the arm
            context.beginPath();
            context.moveTo(startX, startY);
            
            // Add slight curve to drip for realism
            const ctrlX = startX + (Math.random() - 0.5) * 15;
            const ctrlY = startY + armLength * 0.6;
            
            context.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
            context.lineWidth = armWidth;
            context.lineCap = 'round';
            context.strokeStyle = armGradient;
            context.stroke();
            
            // Add a paint droplet at the end of some arms
            if (Math.random() > 0.4) {
                // Base drop size on arm width
                const dropSize = armWidth * (1.2 + Math.random() * 0.5);
                
                context.beginPath();
                
                // Either teardrop or round droplet
                if (Math.random() > 0.5) {
                    context.arc(endX, endY, dropSize, 0, Math.PI * 2);
                } else {
                    // Teardrop shape
                    context.ellipse(
                        endX, 
                        endY, 
                        dropSize * 0.8, 
                        dropSize * 1.5, 
                        angle, 
                        0, 
                        Math.PI * 2
                    );
                }
                
                context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
                context.fill();
            }
            
            context.restore();
        }
        
        // Add small scattered droplets around the main splash
        const numDroplets = 20 + Math.floor(Math.random() * 15); // 20-34 droplets
        
        for (let i = 0; i < numDroplets; i++) {
            const dropAngle = Math.random() * Math.PI * 2;
            const dropDistance = splashRadius * (0.8 + Math.random() * 0.7); // Further from center
            const dropX = centerX + Math.cos(dropAngle) * dropDistance;
            const dropY = centerY + Math.sin(dropAngle) * dropDistance;
            
            const dropSize = 1 + Math.random() * 5;
            
            // Add slight color variation to droplets
            const colorVar = 20 * (Math.random() - 0.5);
            const dropR = Math.max(0, Math.min(255, r + colorVar));
            const dropG = Math.max(0, Math.min(255, g + colorVar));
            const dropB = Math.max(0, Math.min(255, b + colorVar));
            
            context.fillStyle = `rgba(${dropR}, ${dropG}, ${dropB}, ${0.4 + Math.random() * 0.5})`;
            
            context.beginPath();
            if (Math.random() > 0.3) {
                // Circular droplet
                context.arc(dropX, dropY, dropSize, 0, Math.PI * 2);
            } else {
                // Irregular droplet
                const irregularDropPoints = 4 + Math.floor(Math.random() * 3);
                const dropAngleStep = (Math.PI * 2) / irregularDropPoints;
                
                for (let j = 0; j <= irregularDropPoints; j++) {
                    const pointAngle = j * dropAngleStep;
                    const pointRadius = dropSize * (0.7 + Math.random() * 0.6);
                    const pointX = dropX + Math.cos(pointAngle) * pointRadius;
                    const pointY = dropY + Math.sin(pointAngle) * pointRadius;
                    
                    if (j === 0) {
                        context.moveTo(pointX, pointY);
                    } else {
                        context.lineTo(pointX, pointY);
                    }
                }
            }
            context.fill();
        }
        
        // Add surface-specific effects
        if (surfaceType === 'wall') {
            // For walls, add dripping effect
            const numDrips = 4 + Math.floor(Math.random() * 4); // 4-7 drips
            
            for (let i = 0; i < numDrips; i++) {
                // Start from bottom half of the splash
                const angle = Math.PI/2 + (Math.random() - 0.5) * Math.PI; // Mainly downward
                const dripStartRadius = splashRadius * (0.4 + Math.random() * 0.5);
                const dripStartX = centerX + Math.cos(angle) * dripStartRadius;
                const dripStartY = centerY + Math.sin(angle) * dripStartRadius;
                
                // Drip properties
                const dripLength = 30 + Math.random() * 70; // 30-100px
                const dripWidth = 4 + Math.random() * 8; // 4-12px
                
                // End point
                const dripEndX = dripStartX + Math.cos(angle + (Math.random() - 0.5) * 0.3) * dripLength;
                const dripEndY = dripStartY + Math.sin(angle + (Math.random() - 0.5) * 0.3) * dripLength;
                
                // Create gradient for drip
                const dripGradient = context.createLinearGradient(dripStartX, dripStartY, dripEndX, dripEndY);
                dripGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
                dripGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.7)`);
                dripGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.2)`);
                
                // Draw drip path
                context.beginPath();
                context.moveTo(dripStartX, dripStartY);
                
                // Add slight curve to drip for realism
                const ctrlX = dripStartX + (Math.random() - 0.5) * 15;
                const ctrlY = dripStartY + dripLength * 0.6;
                
                context.quadraticCurveTo(ctrlX, ctrlY, dripEndX, dripEndY);
                context.lineWidth = dripWidth;
                context.lineCap = 'round';
                context.strokeStyle = dripGradient;
                context.stroke();
                
                // Add droplet at end of drip
                if (Math.random() > 0.3) {
                    // Base drop size on drip width
                    const dropSize = dripWidth * (1.2 + Math.random() * 0.5);
                    
                    context.beginPath();
                    
                    // Either teardrop or round droplet
                    if (Math.random() > 0.5) {
                        context.arc(dripEndX, dripEndY, dropSize, 0, Math.PI * 2);
                    } else {
                        // Teardrop shape
                        context.ellipse(
                            dripEndX, 
                            dripEndY, 
                            dropSize * 0.8, 
                            dropSize * 1.5, 
                            angle, 
                            0, 
                            Math.PI * 2
                        );
                    }
                    
                    context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
                    context.fill();
                }
            }
        } else if (surfaceType === 'floor') {
            // For floors, add puddle effect
            context.save();
            
            // Create puddle underneath main splatter
            const puddleRadius = splashRadius * 1.3;
            const puddleGradient = context.createRadialGradient(
                centerX, centerY, splashRadius * 0.6,
                centerX, centerY, puddleRadius
            );
            
            puddleGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
            puddleGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.15)`);
            puddleGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            
            // Create irregular puddle shape
            context.beginPath();
            
            const puddlePoints = 15 + Math.floor(Math.random() * 5);
            const puddleAngleStep = (Math.PI * 2) / puddlePoints;
            const puddleIrregularity = 0.2;
            
            // Starting point
            const puddleFirstRadius = puddleRadius * (1 - puddleIrregularity/2 + Math.random() * puddleIrregularity);
            const puddleFirstX = centerX + Math.cos(0) * puddleFirstRadius;
            const puddleFirstY = centerY + Math.sin(0) * puddleFirstRadius;
            context.moveTo(puddleFirstX, puddleFirstY);
            
            // Draw the puddle outline
            for (let i = 1; i <= puddlePoints; i++) {
                const puddleAngle = i * puddleAngleStep;
                // Changed variable name to avoid shadowing the outer puddleRadius
                const currentPuddleRadius = puddleRadius * (1 - puddleIrregularity/2 + Math.random() * puddleIrregularity);
                const puddleX = centerX + Math.cos(puddleAngle) * currentPuddleRadius;
                const puddleY = centerY + Math.sin(puddleAngle) * currentPuddleRadius;
                
                const prevAngle = (i - 1) * puddleAngleStep;
                const cp1x = centerX + Math.cos(prevAngle + puddleAngleStep/3) * currentPuddleRadius * 1.1;
                const cp1y = centerY + Math.sin(prevAngle + puddleAngleStep/3) * currentPuddleRadius * 1.1;
                const cp2x = centerX + Math.cos(puddleAngle - puddleAngleStep/3) * currentPuddleRadius * 1.1;
                const cp2y = centerY + Math.sin(puddleAngle - puddleAngleStep/3) * currentPuddleRadius * 1.1;
                
                context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, puddleX, puddleY);
            }
            
            context.closePath();
            context.fillStyle = puddleGradient;
            context.fill();
            context.restore();
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
            if (Math.random() > 0.5) { // 50% chance
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
            // Update weapon positions to follow camera
            // Call this method first to prioritize weapon positioning
            this._updateWeaponPositions();
            
            // Update bullet positions and check collisions
            this.updateBullets(deltaTime);
            
            // Update weapon animations
            this.updateWeaponAnimations(deltaTime);
            
            // Force an additional weapon position update at the end of the frame
            // This ensures weapons stay synced with the camera even during fast movements
            requestAnimationFrame(() => {
                this._updateWeaponPositions();
            });
            
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
                // First update the basic weapon position to follow the camera
                // This ensures the weapon stays attached to the camera during movement
                this._updateWeaponPositions();
                
                // Different recoil based on weapon type
                let recoilAmount, recoilLift;
                
                switch (this.currentWeapon) {
                    case 'sniper':
                        recoilAmount = 0.08; // Strong backward recoil
                        recoilLift = 0.04;  // Significant upward recoil
                        break;
                    case 'paintball':
                        // Paintball guns have minimal recoil but have a distinctive cycling action
                        recoilAmount = 0.015; // Very light backward force
                        recoilLift = 0.005;  // Minimal vertical movement
                        break;
                    default: // rifle
                        recoilAmount = 0.05; // Medium backward recoil
                        recoilLift = 0.02;  // Medium upward recoil
                }
                
                // Get the current base position after weapon has been updated to follow camera
                const currentBasePosition = weaponModel.position.clone();
                
                // Calculate recoil offsets without directly modifying the position
                // This allows us to apply recoil on top of camera movement
                const recoilOffset = new THREE.Vector3();
                const recoilRotation = new THREE.Euler();
                
                if (this.currentWeapon === 'paintball') {
                    // Paintball guns have a distinctive cycling bolt/striker action when firing
                    recoilOffset.z = -recoilAmount * Math.sin(progress * Math.PI);
                    
                    // Add subtle vibration to simulate air/CO2 release
                    recoilOffset.x = 0.002 * Math.sin(progress * Math.PI * 6); // Rapid side-to-side vibration
                    recoilOffset.y = 0.001 * Math.sin(progress * Math.PI * 4);
                    
                    // Simulate the mechanical movement of internal parts
                    recoilRotation.z = 0.003 * Math.sin(progress * Math.PI * 3); // Slight twist
                    recoilRotation.x = -0.002 * Math.sin(progress * Math.PI * 2); // Minimal tilt
                } else {
                    // Standard recoil for other weapons
                    recoilOffset.z = -recoilAmount * Math.sin(progress * Math.PI);
                    recoilOffset.y = recoilLift * Math.sin(progress * Math.PI);
                    
                    // Add slight rotation for more realistic recoil
                    recoilRotation.x = -recoilLift * 2 * Math.sin(progress * Math.PI);
                }
                
                // Apply offsets to current position (after camera update)
                weaponModel.position.add(recoilOffset);
                
                // Apply rotations
                weaponModel.rotation.x += recoilRotation.x;
                weaponModel.rotation.z += recoilRotation.z;

                // Reset when animation completes
                if (progress >= 1) {
                    this.recoilState.active = false;
                    // No need to reset position as it's now continuously updated
                    weaponModel.rotation.x = 0;
                    weaponModel.rotation.z = 0;
                }
            }
        }

        // Update weapon switch animation
        if (this.switchState.active) {
            const elapsed = Date.now() - this.switchState.startTime;
            const progress = Math.min(elapsed / 300, 1); // 300ms duration
            
            const weaponModel = this.weapons[this.currentWeapon].model;
            if (weaponModel) {
                // First update the weapon position to follow the camera
                // This ensures the weapon stays attached to the camera during movement
                this._updateWeaponPositions();
                
                // Get the current position after being updated to follow camera
                const currentBasePosition = weaponModel.position.clone();
                const currentRotation = weaponModel.rotation.clone();
                
                // Calculate animation offsets
                let posYOffset = 0;
                let posZOffset = 0;
                let rotXOffset = 0;
                
                // More dynamic weapon switch animation
                if (progress < 1) {
                    // First half - weapon moving down and rotating out
                    if (progress < 0.5) {
                        const p = progress * 2; // Rescale 0-0.5 to 0-1
                        posYOffset = -0.2 * p;
                        rotXOffset = 0.3 * p;
                        posZOffset = 0.1 * p;
                    } 
                    // Second half - weapon moving back up and rotating in
                    else {
                        const p = (progress - 0.5) * 2; // Rescale 0.5-1 to 0-1
                        posYOffset = -0.2 * (1 - p);
                        rotXOffset = 0.3 * (1 - p);
                        posZOffset = 0.1 * (1 - p);
                    }
                    
                    // Apply the animation offsets on top of the current position
                    weaponModel.position.y += posYOffset;
                    weaponModel.position.z += posZOffset;
                    weaponModel.rotation.x += rotXOffset;
                } else {
                    // Animation complete - no need to reset position since it's continuously updated
                    this.switchState.active = false;
                }
            }
        }

        // Update reload animation
        this.updateReload();
    }
}