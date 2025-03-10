/**
 * Weapon Models Module
 * Contains all the code for creating and managing detailed weapon models
 */

class WeaponModels {
    /**
     * Creates weapon models for the game
     * @param {THREE} THREE - The THREE.js library 
     * @param {Object} weaponConfigs - Weapon configuration data
     * @param {THREE.Camera} camera - The player camera to attach weapons to
     */
    constructor(THREE, weaponConfigs, camera) {
        this.THREE = THREE;
        this.weaponConfigs = weaponConfigs;
        this.camera = camera;
        this.weaponModels = {};
    }

    /**
     * Initialize all weapon models
     * @returns {Object} The created weapon models
     */
    initializeModels() {
        try {
            // Create shared geometries for optimization
            const sharedBoxGeometry = new this.THREE.BoxGeometry(1, 1, 1);
            
            // Create all paintball-themed weapon models
            this.createPaintballPistolModel(sharedBoxGeometry);
            this.createPaintballRifleModel(sharedBoxGeometry);
            this.createPaintballSniperModel(sharedBoxGeometry);
            
            // Add weapon names for debugging
            this.weaponModels.rifle.name = 'paintball_pistol';
            this.weaponModels.sniper.name = 'paintball_rifle';
            this.weaponModels.paintball.name = 'paintball_sniper';
            
            // Models will be added to the camera in the Weapon class
            
            return this.weaponModels;
        } catch (error) {
            console.error('Error creating weapon models:', error);
            return {};
        }
    }

    /**
     * Creates the rifle weapon model
     * @param {THREE.BoxGeometry} sharedGeometry - Shared geometry for optimization
     * @private
     */
    createRifleModel(sharedGeometry) {
        // Create enhanced rifle materials with high visibility for debugging
        const rifleMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0xFF5533, // Bright orange for visibility
            roughness: 0.7,
            metalness: 0.4,
            emissive: 0x441111 // Add slight emissive glow
        });
        
        // Materials for different parts
        const metalMaterial = new this.THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.3,
            metalness: 0.8
        });
        
        const gripMaterial = new this.THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create detailed rifle model
        this.weaponModels.rifle = new this.THREE.Group();
        
        // Main body (more complex geometry)
        const mainBodyGeometry = new this.THREE.BoxGeometry(0.1, 0.08, 0.5);
        const mainBody = new this.THREE.Mesh(mainBodyGeometry, rifleMaterial);
        this.weaponModels.rifle.add(mainBody);
        
        // Upper receiver
        const upperGeometry = new this.THREE.BoxGeometry(0.1, 0.04, 0.3);
        const upperReceiver = new this.THREE.Mesh(upperGeometry, metalMaterial);
        upperReceiver.position.set(0, 0.06, -0.05);
        this.weaponModels.rifle.add(upperReceiver);
        
        // Grip
        const gripGeometry = new this.THREE.BoxGeometry(0.08, 0.12, 0.05);
        const grip = new this.THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(0, -0.1, 0.1);
        grip.rotation.set(-0.3, 0, 0);
        this.weaponModels.rifle.add(grip);
        
        // Magazine
        const magGeometry = new this.THREE.BoxGeometry(0.06, 0.15, 0.04);
        const magazine = new this.THREE.Mesh(magGeometry, rifleMaterial);
        magazine.position.set(0, -0.11, 0.05);
        this.weaponModels.rifle.add(magazine);
        
        // Barrel (more detailed)
        const barrelGeometry = new this.THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
        const barrel = new this.THREE.Mesh(barrelGeometry, metalMaterial);
        barrel.rotation.set(Math.PI/2, 0, 0);
        barrel.position.set(0, 0.02, -0.35);
        this.weaponModels.rifle.add(barrel);
        
        // Muzzle brake
        const muzzleGeometry = new this.THREE.CylinderGeometry(0.03, 0.03, 0.05, 8);
        const muzzle = new this.THREE.Mesh(muzzleGeometry, metalMaterial);
        muzzle.rotation.set(Math.PI/2, 0, 0);
        muzzle.position.set(0, 0.02, -0.55);
        this.weaponModels.rifle.add(muzzle);
        
        // Front sight
        const sightGeometry = new this.THREE.BoxGeometry(0.02, 0.04, 0.02);
        const frontSight = new this.THREE.Mesh(sightGeometry, metalMaterial);
        frontSight.position.set(0, 0.06, -0.45);
        this.weaponModels.rifle.add(frontSight);
        
        // Apply weapon configuration settings
        if (this.weaponConfigs.rifle) {
            // Set model position and scale from config
            this.weaponModels.rifle.scale.set(
                this.weaponConfigs.rifle.modelScale.x,
                this.weaponConfigs.rifle.modelScale.y,
                this.weaponConfigs.rifle.modelScale.z
            );
            this.weaponModels.rifle.position.set(
                this.weaponConfigs.rifle.position.x,
                this.weaponConfigs.rifle.position.y,
                this.weaponConfigs.rifle.position.z
            );
        }
        
        // Add userData for collision detection
        this.weaponModels.rifle.userData = {
            isWeapon: true,
            weaponType: 'rifle'
        };
    }
    
    /**
     * Creates the sniper rifle weapon model
     * @param {THREE.BoxGeometry} sharedGeometry - Shared geometry for optimization
     * @private
     */
    createSniperModel(sharedGeometry) {
        // Advanced sniper materials with direct color
        const sniperMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0x555555,
            roughness: 0.5,
            metalness: 0.6
        });
        
        // Materials for different parts
        const metalMaterial = new this.THREE.MeshStandardMaterial({
            color: 0x777777,
            roughness: 0.2,
            metalness: 0.9
        });
        
        const scopeMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            roughness: 0.1, 
            metalness: 0.9
        });
        
        const stockMaterial = new this.THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Create detailed sniper model group
        this.weaponModels.sniper = new this.THREE.Group();
        
        // Main body (longer and more slender)
        const mainBodyGeometry = new this.THREE.BoxGeometry(0.08, 0.06, 1.0);
        const mainBody = new this.THREE.Mesh(mainBodyGeometry, sniperMaterial);
        this.weaponModels.sniper.add(mainBody);
        
        // Barrel (longer, higher precision look)
        const barrelGeometry = new this.THREE.CylinderGeometry(0.015, 0.015, 0.8, 8);
        const barrel = new this.THREE.Mesh(barrelGeometry, metalMaterial);
        barrel.rotation.set(Math.PI/2, 0, 0);
        barrel.position.set(0, 0.01, -0.55);
        this.weaponModels.sniper.add(barrel);
        
        // Muzzle brake
        const muzzleGeometry = new this.THREE.CylinderGeometry(0.025, 0.02, 0.1, 8);
        const muzzle = new this.THREE.Mesh(muzzleGeometry, metalMaterial);
        muzzle.rotation.set(Math.PI/2, 0, 0);
        muzzle.position.set(0, 0.01, -0.9);
        this.weaponModels.sniper.add(muzzle);
        
        // Stock (buttstock for sniper rifle)
        const stockGeometry = new this.THREE.BoxGeometry(0.07, 0.1, 0.25);
        const stock = new this.THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.set(0, -0.03, 0.4);
        this.weaponModels.sniper.add(stock);
        
        // Grip
        const gripGeometry = new this.THREE.BoxGeometry(0.06, 0.12, 0.04);
        const grip = new this.THREE.Mesh(gripGeometry, stockMaterial);
        grip.position.set(0, -0.09, 0.2);
        grip.rotation.set(-0.2, 0, 0);
        this.weaponModels.sniper.add(grip);
        
        // Magazine
        const magGeometry = new this.THREE.BoxGeometry(0.05, 0.12, 0.03);
        const magazine = new this.THREE.Mesh(magGeometry, sniperMaterial);
        magazine.position.set(0, -0.09, 0.15);
        this.weaponModels.sniper.add(magazine);
        
        // Enhanced scope (more detailed)
        const scopeBaseGeometry = new this.THREE.BoxGeometry(0.04, 0.02, 0.15);
        const scopeBase = new this.THREE.Mesh(scopeBaseGeometry, metalMaterial);
        scopeBase.position.set(0, 0.04, -0.1);
        this.weaponModels.sniper.add(scopeBase);
        
        // Scope tube
        const scopeGeometry = new this.THREE.CylinderGeometry(0.025, 0.025, 0.25, 8);
        const scope = new this.THREE.Mesh(scopeGeometry, scopeMaterial);
        scope.rotation.set(Math.PI/2, 0, 0);
        scope.position.set(0, 0.06, -0.1);
        this.weaponModels.sniper.add(scope);
        
        // Scope lens (front)
        const lensGeometry = new this.THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
        const lensMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0x3399ff, 
            roughness: 0, 
            metalness: 0.5,
            transparent: true,
            opacity: 0.7
        });
        const frontLens = new this.THREE.Mesh(lensGeometry, lensMaterial);
        frontLens.rotation.set(Math.PI/2, 0, 0);
        frontLens.position.set(0, 0.06, -0.22);
        this.weaponModels.sniper.add(frontLens);
        
        // Scope lens (back)
        const backLens = new this.THREE.Mesh(lensGeometry, lensMaterial);
        backLens.rotation.set(Math.PI/2, 0, 0);
        backLens.position.set(0, 0.06, 0.02);
        this.weaponModels.sniper.add(backLens);
        
        // Bipod
        const bipodLegGeometry = new this.THREE.BoxGeometry(0.01, 0.15, 0.01);
        const bipodMaterial = new this.THREE.MeshStandardMaterial({ color: 0x444444 });
        
        // Left leg
        const leftLeg = new this.THREE.Mesh(bipodLegGeometry, bipodMaterial);
        leftLeg.position.set(-0.04, -0.08, -0.7);
        leftLeg.rotation.set(0, 0, Math.PI/6);
        this.weaponModels.sniper.add(leftLeg);
        
        // Right leg
        const rightLeg = new this.THREE.Mesh(bipodLegGeometry, bipodMaterial);
        rightLeg.position.set(0.04, -0.08, -0.7);
        rightLeg.rotation.set(0, 0, -Math.PI/6);
        this.weaponModels.sniper.add(rightLeg);
        
        // Apply weapon configuration settings
        if (this.weaponConfigs.sniper) {
            this.weaponModels.sniper.scale.set(
                this.weaponConfigs.sniper.modelScale.x,
                this.weaponConfigs.sniper.modelScale.y,
                this.weaponConfigs.sniper.modelScale.z
            );
            this.weaponModels.sniper.position.set(
                this.weaponConfigs.sniper.position.x,
                this.weaponConfigs.sniper.position.y,
                this.weaponConfigs.sniper.position.z
            );
        }
        
        // Add userData for collision detection
        this.weaponModels.sniper.userData = {
            isWeapon: true,
            weaponType: 'sniper'
        };
    }
    
    /**
     * Creates the paintball gun weapon model
     * @param {THREE.BoxGeometry} sharedGeometry - Shared geometry for optimization
     * @private
     */
    createPaintballModel(sharedGeometry) {
        // Advanced paintball gun materials with improved colors for realism
        const paintballMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0x009900, // Darker green for more realism
            roughness: 0.5,
            metalness: 0.3
        });
        
        // Materials for different parts with more realistic properties
        const metalMaterial = new this.THREE.MeshStandardMaterial({
            color: 0x777777,
            roughness: 0.2,
            metalness: 0.9
        });
        
        const gripMaterial = new this.THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const tankMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.2,
            metalness: 0.9
        });
        
        const hopperMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0x222222, 
            transparent: true, 
            opacity: 0.8,
            roughness: 0.2
        });
        
        // Create more detailed paintball gun model group
        this.weaponModels.paintball = new this.THREE.Group();
        
        // Positioning adjustment to make gun more centered and hold-like
        this.weaponModels.paintball.position.set(0, 0.05, -0.1); // Raise and bring forward
        
        // Main body (body of the marker) - larger and more substantial
        const mainBodyGeometry = new this.THREE.BoxGeometry(0.12, 0.1, 0.38);
        const mainBody = new this.THREE.Mesh(mainBodyGeometry, paintballMaterial);
        // Shift main body to make more centered
        mainBody.position.set(-0.02, 0, 0);
        this.weaponModels.paintball.add(mainBody);
        
        // Add brand/logo panel to the body
        const logoGeometry = new this.THREE.BoxGeometry(0.122, 0.03, 0.1);
        const logoMaterial = new this.THREE.MeshStandardMaterial({
            color: 0xdddddd,
            roughness: 0.4,
            metalness: 0.3
        });
        const logo = new this.THREE.Mesh(logoGeometry, logoMaterial);
        logo.position.set(-0.02, 0.02, 0.05);
        this.weaponModels.paintball.add(logo);
        
        // Add texture details to the body (rail system)
        const detailsGeometry = new this.THREE.BoxGeometry(0.125, 0.02, 0.2);
        const details = new this.THREE.Mesh(detailsGeometry, metalMaterial);
        details.position.set(-0.02, 0.06, 0.03);
        this.weaponModels.paintball.add(details);
        
        // Handle - ergonomic grip with better proportions
        const handleGeometry = new this.THREE.BoxGeometry(0.08, 0.18, 0.09);
        const handle = new this.THREE.Mesh(handleGeometry, gripMaterial);
        handle.position.set(-0.02, -0.13, 0.12);
        handle.rotation.set(-0.25, 0, 0); // Angled for ergonomics
        this.weaponModels.paintball.add(handle);
        
        // Add grip texture/pattern
        for (let i = 0; i < 3; i++) {
            const gripPatternGeometry = new this.THREE.BoxGeometry(0.082, 0.01, 0.03);
            const gripPattern = new this.THREE.Mesh(gripPatternGeometry, new this.THREE.MeshStandardMaterial({
                color: 0x000000,
                roughness: 1.0,
                metalness: 0.0
            }));
            gripPattern.position.set(-0.02, -0.08 - (i * 0.04), 0.12);
            gripPattern.rotation.set(-0.25, 0, 0);
            this.weaponModels.paintball.add(gripPattern);
        }
        
        // Trigger guard (more rounded)
        const guardGeometry = new this.THREE.BoxGeometry(0.08, 0.04, 0.07);
        guardGeometry.translate(0, -0.03, 0); // Offset to position bottom face correctly
        const guard = new this.THREE.Mesh(guardGeometry, metalMaterial);
        guard.position.set(-0.02, -0.03, 0.12);
        this.weaponModels.paintball.add(guard);
        
        // Trigger
        const triggerGeometry = new this.THREE.BoxGeometry(0.015, 0.06, 0.02);
        const trigger = new this.THREE.Mesh(triggerGeometry, metalMaterial);
        trigger.position.set(-0.02, -0.07, 0.12);
        this.weaponModels.paintball.add(trigger);
        
        // Regulator (connection between tank and marker)
        const regulatorGeometry = new this.THREE.CylinderGeometry(0.04, 0.04, 0.08, 16);
        const regulator = new this.THREE.Mesh(regulatorGeometry, metalMaterial);
        regulator.rotation.set(Math.PI/2, 0, 0);
        regulator.position.set(-0.02, -0.05, 0.26);
        this.weaponModels.paintball.add(regulator);
        
        // CO2/HPA Tank with more detail - larger and more visible
        const tankGeometry = new this.THREE.CylinderGeometry(0.05, 0.05, 0.3, 16);
        const tank = new this.THREE.Mesh(tankGeometry, tankMaterial);
        tank.rotation.set(Math.PI/2, 0, 0);
        tank.position.set(-0.02, -0.03, 0.4);
        this.weaponModels.paintball.add(tank);
        
        // Tank valve/regulator detail
        const valveGeometry = new this.THREE.CylinderGeometry(0.03, 0.03, 0.05, 12);
        const valve = new this.THREE.Mesh(valveGeometry, metalMaterial);
        valve.position.set(-0.02, -0.03, 0.57);
        this.weaponModels.paintball.add(valve);
        
        // Barrel with more detail - longer and more impressive
        const barrelGeometry = new this.THREE.CylinderGeometry(0.02, 0.022, 0.45, 16);
        const barrel = new this.THREE.Mesh(barrelGeometry, metalMaterial);
        barrel.rotation.set(Math.PI/2, 0, 0);
        barrel.position.set(-0.02, 0.01, -0.33);
        this.weaponModels.paintball.add(barrel);
        
        // Barrel porting (holes near the end of barrel)
        const portingGeometry = new this.THREE.CylinderGeometry(0.025, 0.025, 0.08, 16);
        const porting = new this.THREE.Mesh(portingGeometry, new this.THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.3,
            metalness: 0.8
        }));
        porting.rotation.set(Math.PI/2, 0, 0);
        porting.position.set(-0.02, 0.01, -0.5);
        this.weaponModels.paintball.add(porting);
        
        // Feed neck (connects hopper to body) - more substantial
        const neckGeometry = new this.THREE.CylinderGeometry(0.03, 0.03, 0.07, 12);
        const neck = new this.THREE.Mesh(neckGeometry, metalMaterial);
        neck.position.set(-0.02, 0.085, 0.02);
        this.weaponModels.paintball.add(neck);
        
        // Feed neck clamp (detail part)
        const clampGeometry = new this.THREE.BoxGeometry(0.045, 0.025, 0.04);
        const clamp = new this.THREE.Mesh(clampGeometry, paintballMaterial);
        clamp.position.set(0.02, 0.085, 0.02);
        this.weaponModels.paintball.add(clamp);
        
        // Enhanced hopper with more realistic shape - larger
        const hopperTopGeometry = new this.THREE.SphereGeometry(0.1, 16, 16, 0, Math.PI*2, 0, Math.PI/2);
        const hopperTop = new this.THREE.Mesh(hopperTopGeometry, hopperMaterial);
        hopperTop.rotation.set(Math.PI, 0, 0);
        hopperTop.position.set(-0.02, 0.14, 0.02);
        this.weaponModels.paintball.add(hopperTop);
        
        // Hopper body - larger and more prominent
        const hopperBodyGeometry = new this.THREE.BoxGeometry(0.2, 0.1, 0.2);
        const hopperBody = new this.THREE.Mesh(hopperBodyGeometry, hopperMaterial);
        hopperBody.position.set(-0.02, 0.19, 0.02);
        this.weaponModels.paintball.add(hopperBody);
        
        // Add more paintballs in the hopper for visual effect - realistic colors
        for (let i = 0; i < 15; i++) {
            const paintballGeometry = new this.THREE.SphereGeometry(0.015, 8, 8);
            
            // Use realistic paintball colors
            const paintballColors = [
                0xdd0000, // red
                0x0000dd, // blue
                0xdddd00, // yellow
                0x00dd00, // green
                0xdd00dd, // pink
                0xff7700  // orange
            ];
            
            const paintballColor = paintballColors[Math.floor(Math.random() * paintballColors.length)];
            const paintballMatl = new this.THREE.MeshStandardMaterial({ 
                color: paintballColor,
                roughness: 0.1,
                metalness: 0.0
            });
            
            const paintball = new this.THREE.Mesh(paintballGeometry, paintballMatl);
            paintball.position.set(
                -0.02 + (Math.random() - 0.5) * 0.15, 
                0.17 + Math.random() * 0.07, 
                0.02 + (Math.random() - 0.5) * 0.15
            );
            this.weaponModels.paintball.add(paintball);
        }
        
        // Accessories: enhanced sight rail
        const railGeometry = new this.THREE.BoxGeometry(0.05, 0.015, 0.2);
        const rail = new this.THREE.Mesh(railGeometry, metalMaterial);
        rail.position.set(-0.02, 0.055, -0.05);
        this.weaponModels.paintball.add(rail);
        
        // Add red dot sight for improved look
        const sightBaseGeometry = new this.THREE.BoxGeometry(0.04, 0.03, 0.06);
        const sightBase = new this.THREE.Mesh(sightBaseGeometry, metalMaterial);
        sightBase.position.set(-0.02, 0.07, -0.05);
        this.weaponModels.paintball.add(sightBase);
        
        // Sight lens/dot
        const sightLensGeometry = new this.THREE.CylinderGeometry(0.015, 0.015, 0.01, 12);
        const sightLens = new this.THREE.Mesh(sightLensGeometry, new this.THREE.MeshStandardMaterial({ 
            color: 0x990000, 
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            transparent: true, 
            opacity: 0.7 
        }));
        sightLens.rotation.set(0, 0, Math.PI/2);
        sightLens.position.set(-0.02, 0.07, -0.02);
        this.weaponModels.paintball.add(sightLens);
        
        // Apply weapon configuration settings with scale increase for better visibility
        if (this.weaponConfigs.paintball) {
            // Apply a scale multiplier to make the paintball gun bigger
            const scaleMultiplier = 1.35;
            
            this.weaponModels.paintball.scale.set(
                this.weaponConfigs.paintball.modelScale.x * scaleMultiplier,
                this.weaponConfigs.paintball.modelScale.y * scaleMultiplier,
                this.weaponConfigs.paintball.modelScale.z * scaleMultiplier
            );
            
            // Adjust position to be more centered in view
            this.weaponModels.paintball.position.set(
                this.weaponConfigs.paintball.position.x - 0.05, // More centered horizontally
                this.weaponConfigs.paintball.position.y + 0.05, // Higher in view
                this.weaponConfigs.paintball.position.z + 0.1   // Closer to camera
            );
        }
        
        // Add userData for collision detection
        this.weaponModels.paintball.userData = {
            isWeapon: true,
            weaponType: 'paintball'
        };
    }
    
    /**
     * Attaches all weapon models to the camera
     */
    attachModelsToCamera() {
        if (this.camera) {
            Object.values(this.weaponModels).forEach(model => {
                this.camera.add(model);
            });
        }
    }
    
    /**
     * Sets the visibility of a specific weapon
     * @param {string} weaponType - Type of weapon to set visibility for
     * @param {boolean} visible - Whether the weapon should be visible
     */
    setWeaponVisibility(weaponType, visible) {
        if (this.weaponModels[weaponType]) {
            this.weaponModels[weaponType].visible = visible;
        }
    }
    
    /**
     * Sets initial weapon visibility (showing only the default weapon)
     * @param {string} defaultWeapon - The default weapon to show
     */
    setInitialWeaponVisibility(defaultWeapon = 'rifle') {
        Object.keys(this.weaponModels).forEach(weaponType => {
            this.weaponModels[weaponType].visible = (weaponType === defaultWeapon);
        });
    }
    
    /**
     * Generates a simple color for paintballs
     * @returns {number} A color value
     */
    generatePaintballColor() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00, 0x00ffff];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Export the WeaponModels class
export { WeaponModels };
