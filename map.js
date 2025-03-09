import * as THREE from '../node_modules/three/build/three.module.js';
import { Body, Box, Vec3 } from '../node_modules/cannon-es/dist/cannon-es.js';
import TextureGenerator from './textureGenerator.js';

// GameMap.js

export default class GameMap {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.textureGenerator = new TextureGenerator();
    this.createMap();
  }

  createMap() {
    // Generate textures
    const wallTexture = this.textureGenerator.generateWallTexture();

    console.log('Textures generated');

    // Walls
    this.createWall(0, 5, -25, 100, 10, 1, wallTexture); // Front wall
    this.createWall(0, 5, 25, 100, 10, 1, wallTexture); // Back wall
    this.createWall(-50, 5, 0, 1, 10, 50, wallTexture); // Left wall
    this.createWall(50, 5, 0, 1, 10, 50, wallTexture); // Right wall

    console.log('Map created with walls');
  }

  createWall(x, y, z, width, height, depth, texture) {
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMaterial = new THREE.MeshStandardMaterial({ map: texture });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    this.scene.add(wall);

    const wallBody = new Body({
      mass: 0,
      position: new Vec3(x, y, z),
      shape: new Box(new Vec3(width / 2, height / 2, depth / 2))
    });
    this.physicsWorld.addBody(wallBody);
  }
}
