import * as THREE from '../node_modules/three/build/three.module.js';

export default class TextureGenerator {
    generateFloorTexture() {
        const texture = new THREE.TextureLoader().load('/textures/realistic_arena_floor.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }

    generateWallTexture() {
        const texture = new THREE.TextureLoader().load('/textures/realistic_wall.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }

    generateBunkerTexture() {
        const texture = new THREE.TextureLoader().load('/textures/realistic_bunker.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    generateBarrelTexture() {
        const texture = new THREE.TextureLoader().load('/textures/realistic_barrel.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    generateInflatableTexture() {
        const texture = new THREE.TextureLoader().load('/textures/realistic_inflatable.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }
}
