import * as THREE from '/node_modules/three/build/three.module.js';

export default class TextureGenerator {
    generateFloorTexture() {
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_arena_floor.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }

    generateWallTexture() {
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_wall.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }

    generateBunkerTexture() {
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_bunker.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    generateBarrelTexture() {
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_barrel.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    generateInflatableTexture() {
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_inflatable.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    generateCanvasFloorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');

        // Draw a realistic floor pattern
        context.fillStyle = '#A9A9A9';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = '#808080';
        context.lineWidth = 2;
        for (let y = 0; y < canvas.height; y += 64) {
            for (let x = 0; x < canvas.width; x += 64) {
                context.strokeRect(x, y, 64, 64);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }

    generateCanvasWallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');

        // Draw a realistic wall pattern
        context.fillStyle = '#8B8B8B';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = '#6B6B6B';
        context.lineWidth = 4;
        for (let y = 0; y < canvas.height; y += 64) {
            for (let x = 0; x < canvas.width; x += 128) {
                context.strokeRect(x, y, 128, 64);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }
}
