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
            
            // Create all weapon models
            this.createRifleModel(sharedBoxGeometry);
            this.createSniperModel(sharedBoxGeometry);
            this.createPaintballModel(sharedBoxGeometry);
            
            // Add weapon names for debugging
            this.weaponModels.rifle.name = 'rifle';
            this.weaponModels.sniper.name = 'sniper';
            this.weaponModels.paintball.name = 'paintball';
            
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
        // Advanced paintball gun materials with direct colors
        const paintballMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0x00cc00, // Keep a green tint
            roughness: 0.6,
            metalness: 0.2
        });
        
        // Materials for different parts
        const metalMaterial = new this.THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.3,
            metalness: 0.8
        });
        
        const gripMaterial = new this.THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const tankMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.2,
            metalness: 0.8
        });
        
        const hopperMaterial = new this.THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            transparent: true, 
            opacity: 0.7,
            roughness: 0.1
        });
        
        // Create more detailed paintball gun model
        this.weaponModels.paintball = new this.THREE.Group();
        
        // Main body (body of the marker)
        const mainBodyGeometry = new this.THREE.BoxGeometry(0.09, 0.08, 0.35);
        const mainBody = new this.THREE.Mesh(mainBodyGeometry, paintballMaterial);
        this.weaponModels.paintball.add(mainBody);
        
        // Add texture details to the body
        const detailsGeometry = new this.THREE.BoxGeometry(0.095, 0.01, 0.1);
        const details = new this.THREE.Mesh(detailsGeometry, metalMaterial);
        details.position.set(0, 0.045, 0.05);
        this.weaponModels.paintball.add(details);
        
        // Handle - ergonomic grip
        const handleGeometry = new this.THREE.BoxGeometry(0.06, 0.15, 0.08);
        const handle = new this.THREE.Mesh(handleGeometry, gripMaterial);
        handle.position.set(0, -0.11, 0.1);
        handle.rotation.set(-0.2, 0, 0);
        this.weaponModels.paintball.add(handle);
        
        // Trigger guard
        const guardGeometry = new this.THREE.BoxGeometry(0.06, 0.02, 0.05);
        const guard = new this.THREE.Mesh(guardGeometry, metalMaterial);
        guard.position.set(0, -0.04, 0.1);
        this.weaponModels.paintball.add(guard);
        
        // Trigger
        const triggerGeometry = new this.THREE.BoxGeometry(0.01, 0.04, 0.01);
        const trigger = new this.THREE.Mesh(triggerGeometry, metalMaterial);
        trigger.position.set(0, -0.06, 0.1);
        this.weaponModels.paintball.add(trigger);
        
        // CO2/HPA Tank with more detail
        const tankGeometry = new this.THREE.CylinderGeometry(0.04, 0.04, 0.25, 12);
        const tank = new this.THREE.Mesh(tankGeometry, tankMaterial);
        tank.rotation.set(0, 0, Math.PI/2);
        tank.position.set(0, -0.02, 0.2);
        this.weaponModels.paintball.add(tank);
        
        // Tank valve
        const valveGeometry = new this.THREE.CylinderGeometry(0.02, 0.02, 0.04, 8);
        const valve = new this.THREE.Mesh(valveGeometry, metalMaterial);
        valve.position.set(0, -0.02, 0.33);
        this.weaponModels.paintball.add(valve);
        
        // Barrel with more detail
        const barrelGeometry = new this.THREE.CylinderGeometry(0.015, 0.018, 0.35, 12);
        const barrel = new this.THREE.Mesh(barrelGeometry, metalMaterial);
        barrel.rotation.set(Math.PI/2, 0, 0);
        barrel.position.set(0, 0, -0.3);
        this.weaponModels.paintball.add(barrel);
        
        // Barrel tip (porting)
        const tipGeometry = new this.THREE.CylinderGeometry(0.022, 0.022, 0.05, 12);
        const tip = new this.THREE.Mesh(tipGeometry, paintballMaterial);
        tip.rotation.set(Math.PI/2, 0, 0);
        tip.position.set(0, 0, -0.45);
        this.weaponModels.paintball.add(tip);
        
        // Feed neck (connects hopper to body)
        const neckGeometry = new this.THREE.CylinderGeometry(0.02, 0.02, 0.05, 8);
        const neck = new this.THREE.Mesh(neckGeometry, metalMaterial);
        neck.position.set(0, 0.06, 0);
        this.weaponModels.paintball.add(neck);
        
        // Enhanced hopper with more realistic shape
        const hopperTopGeometry = new this.THREE.SphereGeometry(0.08, 12, 12, 0, Math.PI*2, 0, Math.PI/2);
        const hopperTop = new this.THREE.Mesh(hopperTopGeometry, hopperMaterial);
        hopperTop.rotation.set(Math.PI, 0, 0);
        hopperTop.position.set(0, 0.11, 0);
        this.weaponModels.paintball.add(hopperTop);
        
        // Hopper body
        const hopperBodyGeometry = new this.THREE.BoxGeometry(0.15, 0.08, 0.15);
        const hopperBody = new this.THREE.Mesh(hopperBodyGeometry, hopperMaterial);
        hopperBody.position.set(0, 0.15, 0);
        this.weaponModels.paintball.add(hopperBody);
        
        // Add a few paintballs in the hopper for visual effect
        for (let i = 0; i < 10; i++) {
            const paintballGeometry = new this.THREE.SphereGeometry(0.015, 6, 6);
            const paintballColor = new this.THREE.Color(
                Math.random(), 
                Math.random(), 
                Math.random()
            );
            const paintballMatl = new this.THREE.MeshStandardMaterial({ color: paintballColor });
            const paintball = new this.THREE.Mesh(paintballGeometry, paintballMatl);
            paintball.position.set(
                (Math.random() - 0.5) * 0.1, 
                0.14 + Math.random() * 0.05, 
                (Math.random() - 0.5) * 0.1
            );
            this.weaponModels.paintball.add(paintball);
        }
        
        // Accessories: sight/rail
        const railGeometry = new this.THREE.BoxGeometry(0.04, 0.01, 0.15);
        const rail = new this.THREE.Mesh(railGeometry, metalMaterial);
        rail.position.set(0, 0.045, -0.05);
        this.weaponModels.paintball.add(rail);
        
        // Apply weapon configuration settings
        if (this.weaponConfigs.paintball) {
            this.weaponModels.paintball.scale.set(
                this.weaponConfigs.paintball.modelScale.x,
                this.weaponConfigs.paintball.modelScale.y,
                this.weaponConfigs.paintball.modelScale.z
            );
            this.weaponModels.paintball.position.set(
                this.weaponConfigs.paintball.position.x,
                this.weaponConfigs.paintball.position.y,
                this.weaponConfigs.paintball.position.z
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
