import * as THREE from '../node_modules/three/build/three.module.js';

export default class TextureGenerator {
    loadTexture(path) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                path,
                texture => resolve(texture),
                undefined,
                error => reject(error)
            );
        });
    }

    async generateFloorTexture() {
        try {
            const texture = await this.loadTexture('./textures/realistic_arena_floor.jpg');
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(10, 10);
            return texture;
        } catch (error) {
            console.error('Error loading floor texture:', error);
        }
    }

    async generateWallTexture() {
        try {
            const texture = await this.loadTexture('./textures/realistic_wall.jpg');
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(10, 10);
            return texture;
        } catch (error) {
            console.error('Error loading wall texture:', error);
        }
    }

    async generateBunkerTexture() {
        try {
            const texture = await this.loadTexture('./textures/realistic_bunker.jpg');
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            return texture;
        } catch (error) {
            console.error('Error loading bunker texture:', error);
        }
    }

    async generateBarrelTexture() {
        try {
            const texture = await this.loadTexture('./textures/realistic_barrel.jpg');
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            return texture;
        } catch (error) {
            console.error('Error loading barrel texture:', error);
        }
    }

    async generateInflatableTexture() {
        try {
            const texture = await this.loadTexture('./textures/realistic_inflatable.jpg');
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            return texture;
        } catch (error) {
            console.error('Error loading inflatable texture:', error);
        }
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
