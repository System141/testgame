import * as THREE from '/node_modules/three/build/three.module.js';

export default class Weapon {
    constructor(scene, camera, gameState) {
        this.scene = scene;
        this.camera = camera;
        this.gameState = gameState;
        this.bullets = [];
        this.bulletSpeed = 1.5;
        this.damage = 10;
        this.lastShot = 0;
        this.shootingDelay = 250; // milliseconds between shots
        this.paintSplatters = []; // Array to store paint splatters
        
        // Create weapon model
        this.createWeaponModel();
        
        // Bind shooting event
        document.addEventListener('mousedown', (e) => this.shoot(e));
    }

    createWeaponModel() {
        // Create a simple gun model
        const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
        const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        this.model = new THREE.Mesh(gunGeometry, gunMaterial);
        
        // Position the weapon
        this.model.position.set(0.3, -0.2, -0.5);
        this.camera.add(this.model);
    }

    createPaintSplatter(position, normal) {
        // Random paint color
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00, 0x00ffff];
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Create paint splatter geometry
        const splatterGeometry = new THREE.CircleGeometry(0.3, 8);
        const splatterMaterial = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        const splatter = new THREE.Mesh(splatterGeometry, splatterMaterial);
        
        // Position the splatter slightly above the surface to prevent z-fighting
        splatter.position.copy(position).add(normal.multiplyScalar(0.01));
        
        // Calculate rotation based on surface normal
        const upVector = new THREE.Vector3(0, 1, 0);
        const rightVector = new THREE.Vector3();
        
        // If the normal is mostly vertical (like on the ground), use a different up vector
        if (Math.abs(normal.dot(upVector)) > 0.9) {
            rightVector.set(1, 0, 0); // Use world right vector for ground
        } else {
            rightVector.crossVectors(upVector, normal).normalize();
        }
        
        const upVectorFinal = new THREE.Vector3();
        upVectorFinal.crossVectors(normal, rightVector);
        
        // Create rotation matrix from vectors
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeBasis(rightVector, upVectorFinal, normal);
        splatter.setRotationFromMatrix(rotationMatrix);
        
        // Add random rotation around normal axis for variety
        splatter.rotateOnAxis(normal, Math.random() * Math.PI * 2);
        
        // Add random scale variation
        const scale = 0.5 + Math.random() * 0.5;
        splatter.scale.set(scale, scale, scale);

        this.scene.add(splatter);
        this.paintSplatters.push(splatter);

        // Limit the number of paint splatters to prevent performance issues
        if (this.paintSplatters.length > 50) {
            const oldestSplatter = this.paintSplatters.shift();
            this.scene.remove(oldestSplatter);
        }
    }

    shoot(event) {
        if (event.button !== 0) return; // Only left click
        
        const now = Date.now();
        if (now - this.lastShot < this.shootingDelay) return;
        this.lastShot = now;

        // Create bullet
        const bulletGeometry = new THREE.SphereGeometry(0.05);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

        // Set bullet position to camera position
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
            raycaster: raycaster
        });

        this.scene.add(bullet);

        // Add muzzle flash effect
        this.createMuzzleFlash();
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
        flash.position.copy(this.model.position);
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
            
            // Update bullet position
            bullet.mesh.position.add(bullet.direction.clone().multiplyScalar(this.bulletSpeed));
            bullet.distance += this.bulletSpeed;

            // Update raycaster position
            bullet.raycaster.set(bullet.mesh.position, bullet.direction);

            // Check for collisions
            const intersects = bullet.raycaster.intersectObjects(this.scene.children, true);
            
            if (intersects.length > 0 && intersects[0].distance < this.bulletSpeed) {
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