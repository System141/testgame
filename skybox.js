import * as THREE from '/node_modules/three/build/three.module.js';
import SkyboxGenerator from './skyboxGenerator.js';

export default class Skybox {
    constructor(scene) {
        this.scene = scene;
        this.skyboxGenerator = new SkyboxGenerator();
        this.createSkybox();
    }

    createSkybox() {
        const textures = this.skyboxGenerator.generateSkybox();
        const materialArray = textures.map(texture => new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }));

        const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
        const skybox = new THREE.Mesh(skyboxGeometry, materialArray);
        this.scene.add(skybox);
    }
}
