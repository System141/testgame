import * as THREE from '/node_modules/three/build/three.module.js';
import { Body, Box, Vec3 } from '/node_modules/cannon-es/dist/cannon-es.js';

export default class Enemy {
    constructor(scene, physicsWorld, position, gameState) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.gameState = gameState;
        this.position = position.clone();
        this.health = 100;
        this.isAlive = true;
        this.speed = 0.05;
        this.detectionRange = 20;
        this.attackRange = 5;
        this.attackDamage = 10;
        this.attackCooldown = 1000; // ms
        this.lastAttackTime = 0;
        
        this.createModel();
        this.createPhysicsBody();
    }
    
    createModel() {
        // Create enemy mesh
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Add health bar
        this.createHealthBar();
    }
    
    createHealthBar() {
        // Container for health bar
        this.healthBarContainer = new THREE.Group();
        
        // Background
        const bgGeometry = new THREE.PlaneGeometry(1.2, 0.2);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const background = new THREE.Mesh(bgGeometry, bgMaterial);
        
        // Health fill
        const fillGeometry = new THREE.PlaneGeometry(1, 0.15);
        const fillMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthFill = new THREE.Mesh(fillGeometry, fillMaterial);
        this.healthFill.position.z = 0.01; // Slightly in front of background
        
        this.healthBarContainer.add(background);
        this.healthBarContainer.add(this.healthFill);
        this.healthBarContainer.position.y = 1.5; // Above enemy
        this.healthBarContainer.position.z = 0.6; // Slightly in front
        
        this.mesh.add(this.healthBarContainer);
    }
    
    createPhysicsBody() {
        this.body = new Body({
            mass: 5,
            position: new Vec3(this.position.x, this.position.y, this.position.z),
            shape: new Box(new Vec3(0.5, 1, 0.5))
        });
        this.physicsWorld.addBody(this.body);
    }
    
    update() {
        if (!this.isAlive) return;
        
        // Find player position (typically the camera)
        const player = this.scene.getObjectByProperty('type', 'PerspectiveCamera');
        if (!player) return;
        
        // Calculate direction to player
        const playerPos = new THREE.Vector3();
        playerPos.setFromMatrixPosition(player.matrixWorld);
        
        const direction = new THREE.Vector3()
            .subVectors(playerPos, this.mesh.position)
            .normalize();
        
        // Get distance to player
        const distance = this.mesh.position.distanceTo(playerPos);
        
        // Look at player
        this.mesh.lookAt(playerPos);
        
        // Move towards player if in detection range but not too close
        if (distance < this.detectionRange && distance > this.attackRange) {
            this.mesh.position.x += direction.x * this.speed;
            this.mesh.position.z += direction.z * this.speed;
            this.body.position.x = this.mesh.position.x;
            this.body.position.z = this.mesh.position.z;
        }
        
        // Attack player if in range
        if (distance < this.attackRange) {
            this.attack();
        }
        
        // Update the physics body position
        this.body.position.copy(this.mesh.position);
        
        // Make health bar face the camera
        if (this.healthBarContainer) {
            this.healthBarContainer.lookAt(player.position);
        }
    }
    
    attack() {
        const now = Date.now();
        if (now - this.lastAttackTime > this.attackCooldown) {
            this.lastAttackTime = now;
            this.gameState.takeDamage(this.attackDamage);
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Update health bar
        const healthPercent = Math.max(0, this.health / 100);
        this.healthFill.scale.x = healthPercent;
        this.healthFill.position.x = (healthPercent - 1) / 2;
        
        if (this.health <= 0 && this.isAlive) {
            this.die();
        }
    }
    
    die() {
        this.isAlive = false;
        this.scene.remove(this.mesh);
        this.physicsWorld.removeBody(this.body);
        this.gameState.addScore(100);
    }
}