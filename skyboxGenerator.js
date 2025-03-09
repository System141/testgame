import * as THREE from '/node_modules/three/build/three.module.js';

export default class SkyboxGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 1024;
        this.context = this.canvas.getContext('2d');
    }

    generateSkyTexture(isTop = false) {
        const gradient = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
        
        if (isTop) {
            gradient.addColorStop(0, '#4682B4');
            gradient.addColorStop(1, '#87CEEB');
        } else {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#B0E0E6');
        }

        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!isTop) {
            this.context.fillStyle = 'rgba(255, 255, 255, 0.5)';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * (this.canvas.height / 2);
                const size = Math.random() * 100 + 50;
                
                this.context.beginPath();
                this.context.arc(x, y, size / 2, 0, Math.PI * 2);
                this.context.arc(x + size / 3, y - size / 4, size / 3, 0, Math.PI * 2);
                this.context.arc(x - size / 3, y - size / 4, size / 3, 0, Math.PI * 2);
                this.context.fill();
            }
        }

        return new THREE.CanvasTexture(this.canvas);
    }

    generateRealisticSkyTexture(isTop = false) {
        const gradient = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
        
        if (isTop) {
            gradient.addColorStop(0, '#4682B4');
            gradient.addColorStop(1, '#87CEEB');
        } else {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#B0E0E6');
        }

        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!isTop) {
            this.context.fillStyle = 'rgba(255, 255, 255, 0.5)';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * (this.canvas.height / 2);
                const size = Math.random() * 100 + 50;
                
                this.context.beginPath();
                this.context.arc(x, y, size / 2, 0, Math.PI * 2);
                this.context.arc(x + size / 3, y - size / 4, size / 3, 0, Math.PI * 2);
                this.context.arc(x - size / 3, y - size / 4, size / 3, 0, Math.PI * 2);
                this.context.fill();
            }
        }

        return new THREE.CanvasTexture(this.canvas);
    }

    generateSkybox() {
        const textures = [];
        
        for (let i = 0; i < 4; i++) {
            textures.push(this.generateSkyTexture());
        }
        
        textures.push(this.generateSkyTexture(true));
        
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        textures.push(new THREE.CanvasTexture(this.canvas));

        return textures;
    }
}
