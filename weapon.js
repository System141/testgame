import * as THREE from '/node_modules/three/build/three.module.js';

export default class Weapon {
    constructor(scene, camera, gameState) {
        this.scene = scene;
        this.camera = camera;
        this.gameState = gameState;
        this.bullets = [];
        this.paintSplatters = [];
        this.currentWeapon = 'rifle'; // Default weapon
        this.isScoped = false;
        this.defaultFOV = 75;
        this.scopedFOV = 20;
        
        // Weapon properties
        this.weapons = {
            rifle: {
                model: null,
                bulletSpeed: 1.5,
                damage: 10,
                shootingDelay: 250,
                bulletSize: 0.05,
                bulletColor: 0xff0000,
                modelScale: { x: 0.1, y: 0.1, z: 0.5 },
                position: { x: 0.3, y: -0.2, z: -0.5 }
            },
            sniper: {
                model: null,
                bulletSpeed: 3.0,
                damage: 50,
                shootingDelay: 1000,
                bulletSize: 0.08,
                bulletColor: 0x0000ff,
                modelScale: { x: 0.1, y: 0.1, z: 0.8 },
                position: { x: 0.3, y: -0.2, z: -0.7 }
            }
        };

        this.lastShot = 0;
        
        // Create weapon models
        this.createWeaponModels();
        
        // Create scope overlay
        this.createScopeOverlay();
        
        // Bind shooting and weapon switch events
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('keydown', (e) => this.handleWeaponSwitch(e));
    }

    createWeaponModels() {
        // Create rifle
        const rifleGeometry = new THREE.BoxGeometry(1, 1, 1);
        const rifleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        this.weapons.rifle.model = new THREE.Mesh(rifleGeometry, rifleMaterial);
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

        // Create sniper
        const sniperGeometry = new THREE.BoxGeometry(1, 1, 1);
        const sniperMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        this.weapons.sniper.model = new THREE.Mesh(sniperGeometry, sniperMaterial);
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

        // Initially show rifle and hide sniper
        this.camera.add(this.weapons.rifle.model);
        this.camera.add(this.weapons.sniper.model);
        this.weapons.sniper.model.visible = false;
    }

    createScopeOverlay() {
        // Create circular scope mask
        const scopeRadius = 0.15; // Reduced radius for smaller scope circle
        const segments = 32; // Smoothness of the circle
        
        // Create outer black overlay (full screen)
        const outerGeometry = new THREE.PlaneGeometry(2, 2);
        const outerMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthTest: false
        });
        this.scopeOverlay = new THREE.Mesh(outerGeometry, outerMaterial);
        this.scopeOverlay.position.z = -1;
        this.scopeOverlay.visible = false;
        
        // Create scope ring (border of the clear area)
        const ringGeometry = new THREE.RingGeometry(scopeRadius - 0.002, scopeRadius, segments);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1
        });
        this.scopeRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.scopeRing.position.z = -0.98;
        this.scopeRing.visible = false;

        // Create hole in the overlay (completely transparent)
        const holeGeometry = new THREE.CircleGeometry(scopeRadius - 0.002, segments);
        const holeMaterial = new THREE.MeshBasicMaterial({
            colorWrite: false,
            depthWrite: false,
            opacity: 0
        });
        this.scopeHole = new THREE.Mesh(holeGeometry, holeMaterial);
        this.scopeHole.position.z = -0.99;
        this.scopeHole.visible = false;

        // Create crosshair
        const crosshairSize = scopeRadius * 0.3;
        const crosshairGeometry = new THREE.BufferGeometry();
        const crosshairMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
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

        crosshairGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verticalLine, 3));
        this.crosshairVertical = new THREE.Line(crosshairGeometry, crosshairMaterial);
        
        const horizontalGeometry = new THREE.BufferGeometry();
        horizontalGeometry.setAttribute('position', new THREE.Float32BufferAttribute(horizontalLine, 3));
        this.crosshairHorizontal = new THREE.Line(horizontalGeometry, crosshairMaterial);

        this.crosshairVertical.visible = false;
        this.crosshairHorizontal.visible = false;

        // Add everything to camera
        this.camera.add(this.scopeOverlay);
        this.camera.add(this.scopeHole);
        this.camera.add(this.scopeRing);
        this.camera.add(this.crosshairVertical);
        this.camera.add(this.crosshairHorizontal);
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

    toggleScope(scoped) {
        if (this.isScoped === scoped) return;
        
        this.isScoped = scoped;
        const targetFOV = scoped ? this.scopedFOV : this.defaultFOV;
        
        // Show/hide scope overlay and crosshair
        this.scopeOverlay.visible = scoped;
        this.scopeHole.visible = scoped;
        this.scopeRing.visible = scoped;
        this.crosshairVertical.visible = scoped;
        this.crosshairHorizontal.visible = scoped;
        
        // Hide/show weapon model
        if (this.weapons[this.currentWeapon].model) {
            this.weapons[this.currentWeapon].model.visible = !scoped;
        }

        // Animate FOV change
        const startFOV = this.camera.fov;
        const duration = 200; // milliseconds
        const startTime = Date.now();

        const animateFOV = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.camera.fov = startFOV + (targetFOV - startFOV) * progress;
            this.camera.updateProjectionMatrix();

            if (progress < 1) {
                requestAnimationFrame(animateFOV);
            }
        };

        animateFOV();
    }

    handleWeaponSwitch(event) {
        if (event.key === '1') {
            this.switchWeapon('rifle');
        } else if (event.key === '2') {
            this.switchWeapon('sniper');
        }
    }

    switchWeapon(weaponType) {
        if (this.currentWeapon === weaponType) return;

        // Hide all weapons
        Object.values(this.weapons).forEach(weapon => {
            if (weapon.model) weapon.model.visible = false;
        });

        // Show selected weapon
        this.weapons[weaponType].model.visible = true;
        this.currentWeapon = weaponType;
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

    shoot(event) {
        if (event.button !== 0) return; // Only left click
        
        const now = Date.now();
        const currentWeaponProps = this.weapons[this.currentWeapon];
        
        if (now - this.lastShot < currentWeaponProps.shootingDelay) return;
        this.lastShot = now;

        // Create bullet
        const bulletGeometry = new THREE.SphereGeometry(currentWeaponProps.bulletSize);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: currentWeaponProps.bulletColor });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

        // Set bullet position
        bullet.position.copy(this.camera.position);

        // Get shooting direction from camera
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Create raycaster for bullet collision detection
        const raycaster = new THREE.Raycaster(bullet.position, direction);
        
        // Store bullet data
        this.bullets.push({
            mesh: bullet,
            direction: direction,
            distance: 0,
            damage: currentWeaponProps.damage,
            speed: currentWeaponProps.bulletSpeed,
            raycaster: raycaster
        });

        this.scene.add(bullet);
        this.createMuzzleFlash();
    }

    createPaintSplatter(position, normal) {
        // Generate paint splatter texture
        const texture = this.generateCanvasPaintSplatter();
        
        // Create paint splatter geometry
        const splatterGeometry = new THREE.PlaneGeometry(0.5, 0.5);
        const splatterMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });

        const splatter = new THREE.Mesh(splatterGeometry, splatterMaterial);
        
        // Position the splatter
        splatter.position.copy(position);
        
        // Align splatter with the surface
        if (Math.abs(normal.y) > 0.9) {
            // For ground/ceiling
            splatter.rotation.x = -Math.PI / 2;
            splatter.rotation.y = 0;
            splatter.rotation.z = Math.random() * Math.PI * 2;
        } else if (Math.abs(normal.x) > 0.9) {
            // For walls facing x-axis
            splatter.rotation.y = Math.PI / 2;
            splatter.rotation.z = Math.random() * Math.PI * 2;
        } else if (Math.abs(normal.z) > 0.9) {
            // For walls facing z-axis
            splatter.rotation.x = 0;
            splatter.rotation.y = 0;
            splatter.rotation.z = Math.random() * Math.PI * 2;
        } else {
            // For angled surfaces
            splatter.lookAt(position.clone().add(normal));
        }

        // Add random scale variation
        const scale = 0.3 + Math.random() * 0.3;
        splatter.scale.set(scale, scale, scale);

        this.scene.add(splatter);
        this.paintSplatters.push(splatter);

        // Limit the number of paint splatters
        if (this.paintSplatters.length > 50) {
            const oldestSplatter = this.paintSplatters.shift();
            this.scene.remove(oldestSplatter);
        }
    }

    createMuzzleFlash() {
        const flashGeometry = new THREE.SphereGeometry(0.1);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        
        // Position flash at gun muzzle
        const currentWeaponProps = this.weapons[this.currentWeapon];
        flash.position.copy(currentWeaponProps.model.position);
        flash.position.z -= 0.25;
        this.camera.add(flash);

        // Remove flash after short delay
        setTimeout(() => {
            this.camera.remove(flash);
        }, 50);
    }

    update() {
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Move bullet
            bullet.mesh.position.add(
                bullet.direction.clone().multiplyScalar(bullet.speed)
            );
            
            bullet.distance += bullet.speed;

            // Update raycaster position
            bullet.raycaster.set(bullet.mesh.position, bullet.direction);

            // Check for collisions
            const intersects = bullet.raycaster.intersectObjects(this.scene.children, true);
            
            if (intersects.length > 0 && intersects[0].distance < bullet.speed) {
                // Create paint splatter at collision point
                this.createPaintSplatter(intersects[0].point, intersects[0].face.normal);
                
                // Remove the bullet
                this.scene.remove(bullet.mesh);
                this.bullets.splice(i, 1);
                continue;
            }

            // Remove bullets that have traveled too far
            if (bullet.distance > 100) {
                this.scene.remove(bullet.mesh);
                this.bullets.splice(i, 1);
            }
        }
    }
}