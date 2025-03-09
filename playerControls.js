// playerControls.js
import * as THREE from '../node_modules/three/build/three.module.js';
import { Body, Box, Vec3 } from '../node_modules/cannon-es/dist/cannon-es.js';

export default class PlayerControls {
    constructor(camera, scene, physicsWorld) {
        this.camera = camera;
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.player = {
            position: camera.position.clone(),
            speed: 5.0,
            velocity: new THREE.Vector3(0, 0, 0),
            isOnGround: true,
            radius: 0.5
        };
        this.keys = {};
        this.mouse = new THREE.Vector2();
        this.mouseLocked = false;
        this.isPaused = false;
        this.lockButton = null;

        this.yaw = 0;
        this.pitch = 0;

        this.objects = [];
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh && object !== this.camera) {
                this.objects.push(object);
            }
        });

        this.playerBody = new Body({
            mass: 1,
            position: new Vec3(this.player.position.x, this.player.position.y, this.player.position.z),
            shape: new Box(new Vec3(this.player.radius, this.player.radius, this.player.radius))
        });
        this.physicsWorld.addBody(this.playerBody);

        this.createPlayerModel();
        this.initControls();
    }

    createPlayerModel() {
        const geometry = new THREE.BoxGeometry(0.5, 1.8, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.playerModel = new THREE.Mesh(geometry, material);
        this.playerModel.position.set(this.player.position.x, this.player.position.y - 0.9, this.player.position.z);
        this.playerModel.scale.set(1, 1, 1);
        this.scene.add(this.playerModel);

        this.mixer = new THREE.AnimationMixer(this.playerModel);
        this.animations = {
            idle: this.createIdleAnimation(),
            walk: this.createWalkAnimation(),
            jump: this.createJumpAnimation()
        };
        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
    }

    createIdleAnimation() {
        const idleClip = new THREE.AnimationClip('idle', -1, [
            new THREE.VectorKeyframeTrack('.position', [0, 1], [0, 0, 0, 0, 0, 0]),
            new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1])
        ]);
        return this.mixer.clipAction(idleClip);
    }

    createWalkAnimation() {
        const walkClip = new THREE.AnimationClip('walk', -1, [
            new THREE.VectorKeyframeTrack('.position', [0, 0.5, 1], [0, 0, 0, 0, 0.1, 0, 0, 0, 0]),
            new THREE.QuaternionKeyframeTrack('.quaternion', [0, 0.5, 1], [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1])
        ]);
        return this.mixer.clipAction(walkClip);
    }

    createJumpAnimation() {
        const jumpClip = new THREE.AnimationClip('jump', -1, [
            new THREE.VectorKeyframeTrack('.position', [0, 0.5, 1], [0, 0, 0, 0, 0.5, 0, 0, 0, 0]),
            new THREE.QuaternionKeyframeTrack('.quaternion', [0, 0.5, 1], [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1])
        ]);
        return this.mixer.clipAction(jumpClip);
    }

    initControls() {
        this.lockButton = document.createElement('button');
        this.lockButton.textContent = 'Click to Play';
        this.lockButton.style.position = 'absolute';
        this.lockButton.style.top = '10px';
        this.lockButton.style.left = '10px';
        document.body.appendChild(this.lockButton);

        this.lockButton.addEventListener('click', () => this.lockMouse());
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('pointerlockerror', () => this.onPointerLockError());
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        window.addEventListener('blur', () => this.onWindowBlur());
        window.addEventListener('focus', () => this.onWindowFocus());
    }

    lockMouse() {
        this.lockButton.style.display = 'none';
        document.body.requestPointerLock();
    }

    unlockMouse() {
        document.exitPointerLock();
        this.mouseLocked = false;
        this.lockButton.style.display = 'block';
        this.keys = {};
        this.mouse.set(0, 0);
    }

    onPointerLockChange() {
        if (document.pointerLockElement === document.body) {
            this.mouseLocked = true;
        } else {
            this.unlockMouse();
        }
    }

    onPointerLockError() {
        this.lockButton.style.display = 'block';
    }

    onKeyDown(event) {
        this.keys[event.code] = true;
        if (event.code === 'Space' && this.player.isOnGround) {
            this.playerBody.velocity.y = 5;
            this.player.isOnGround = false;
            this.playAnimation('jump');
        }
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
    }

    onMouseMove(event) {
        if (this.mouseLocked) {
            this.yaw -= event.movementX * 0.002;
            this.pitch -= event.movementY * 0.002;
            this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
            this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
        }
    }

    onWindowBlur() {
        this.isPaused = true;
        this.unlockMouse();
    }

    onWindowFocus() {
        this.isPaused = false;
    }

    playAnimation(name) {
        if (this.currentAnimation) {
            this.currentAnimation.stop();
        }
        this.currentAnimation = this.animations[name];
        this.currentAnimation.play();
    }

    update() {
        if (this.isPaused || !this.mouseLocked) return;

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        right.y = 0;
        right.normalize();

        const velocity = new Vec3();

        if (this.keys['KeyW']) {
            velocity.x += forward.x * this.player.speed;
            velocity.z += forward.z * this.player.speed;
            this.playAnimation('walk');
        }
        if (this.keys['KeyS']) {
            velocity.x -= forward.x * this.player.speed;
            velocity.z -= forward.z * this.player.speed;
            this.playAnimation('walk');
        }
        if (this.keys['KeyA']) {
            velocity.x -= right.x * this.player.speed;
            velocity.z -= right.z * this.player.speed;
            this.playAnimation('walk');
        }
        if (this.keys['KeyD']) {
            velocity.x += right.x * this.player.speed;
            velocity.z += right.z * this.player.speed;
            this.playAnimation('walk');
        }

        if (!this.keys['KeyW'] && !this.keys['KeyS'] && !this.keys['KeyA'] && !this.keys['KeyD']) {
            this.playAnimation('idle');
        }

        this.playerBody.velocity.x = velocity.x;
        this.playerBody.velocity.z = velocity.z;
        this.playerBody.velocity.y -= 0.01;

        if (this.playerBody.position.y <= 1) {
            this.playerBody.position.y = 1;
            this.playerBody.velocity.y = 0;
            this.player.isOnGround = true;
        }

        this.objects.forEach((object) => {
            const objectBox = new THREE.Box3().setFromObject(object);
            const playerBox = new THREE.Box3().setFromCenterAndSize(
                new THREE.Vector3(this.playerBody.position.x, this.playerBody.position.y, this.playerBody.position.z),
                new THREE.Vector3(this.player.radius * 2, this.player.radius * 2, this.player.radius * 2)
            );

            if (playerBox.intersectsBox(objectBox)) {
                const collisionNormal = new THREE.Vector3().subVectors(this.playerBody.position, object.position).normalize();
                const penetrationDepth = playerBox.max.sub(playerBox.min).length() / 2;
                this.playerBody.position.add(collisionNormal.multiplyScalar(penetrationDepth));
            }
        });

        this.player.position.copy(this.playerBody.position);
        this.playerModel.position.copy(this.player.position);
        this.playerModel.position.y -= 0.9;
        this.camera.position.copy(this.player.position);
        this.camera.position.y += 1.6;
        this.mixer.update(0.01);
    }
}