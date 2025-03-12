import * as THREE from '/node_modules/three/build/three.module.js';
import { Body, Box, Vec3 } from '/node_modules/cannon-es/dist/cannon-es.js';
import TextureGenerator from '/src/utils/textureGenerator.js';

// GameMap.js - Competitive Paintball Arena

export default class GameMap {
  constructor(scene, physicsWorld, renderer) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.textureGenerator = new TextureGenerator();
    this.renderer = renderer;
    
    // Map colors
    this.teamColors = {
      red: 0xd82800,
      blue: 0x0066cc
    };
    
    // Load textures
    this.loadTextures();
    
    // Create the map
    this.createMap();
  }
  
  loadTextures() {
    this.textures = {};
    
    // Use enhanced paintball-specific materials with normal maps for better visual quality
    try {
      // Generate optimized textures with normal maps
      this.textures.wall = this.textureGenerator.generateWallTexture();
      this.textures.floor = this.textureGenerator.generateFloorTexture();
      this.textures.bunker = this.textureGenerator.generateBunkerTexture();
      this.textures.inflatable = this.textureGenerator.generateInflatableTexture();
      this.textures.barrel = this.textureGenerator.generateBarrelTexture();
      
      // Create advanced materials (with optional normal maps) for key objects
      this.materials = {};
      
      // If advanced material generation is available, use it
      if (typeof this.textureGenerator.createPaintballMaterial === 'function') {
        try {
          // Advanced material for floor with normal mapping
          this.materials.floor = this.textureGenerator.createPaintballMaterial('floor', {
            roughness: 0.9,
            metalness: 0.1,
            doubleSided: true
          });
          
          // Advanced material for walls with normal mapping
          this.materials.wall = this.textureGenerator.createPaintballMaterial('wall', {
            roughness: 0.7,
            metalness: 0.3,
            doubleSided: false
          });
          
          console.log('Enhanced materials with normal maps created successfully');
        } catch (e) {
          console.warn('Could not create enhanced materials, falling back to basic textures', e);
        }
      }
      
      console.log('Paintball arena textures loaded successfully');
    } catch (e) {
      console.warn('Could not load image textures, generating canvas textures', e);
      // Use canvas-generated textures as fallback
      this.generateCanvasTextures();
    }
    
    // Generate team-colored textures for team-specific objects
    this.textures.redTeam = this.textureGenerator.generateCanvasInflatableTexture(this.teamColors.red);
    this.textures.blueTeam = this.textureGenerator.generateCanvasInflatableTexture(this.teamColors.blue);
    
    // Configure texture properties
    Object.values(this.textures).forEach(texture => {
      if (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
      }
    });
    
    console.log('Paintball arena textures loaded');
  }
  
  // Fallback method to generate textures if image loading fails
  generateCanvasTextures() {
    this.textures.wall = this.textureGenerator.generateCanvasWallTexture();
    this.textures.floor = this.textureGenerator.generateCanvasFloorTexture();
    this.textures.bunker = this.textureGenerator.generateCanvasBunkerTexture();
    this.textures.inflatable = this.textureGenerator.generateCanvasInflatableTexture();
    this.textures.barrel = this.textureGenerator.generateCanvasBarrelTexture();
  }

  createMap() {
    console.log('Creating paintball arena map...');
    
    // Create arena floor
    this.createArenaFloor();
    
    // Create arena boundaries
    this.createBoundaryWalls();
    
    /*
    // --- TEMPORARILY DISABLED ALL OBSTACLES ---
    
    // Create field divider
    this.createFieldDivider();
    
    // Create team bases/spawn points
    this.createTeamBases();
    
    // Add paintball obstacles (bunkers, barrels, inflatables)
    this.createObstacles();
    */
    
    console.log('Paintball arena map created successfully');
  }
  
  createArenaFloor() {
    // Create a large floor plane for the arena
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    
    let floorMaterial;
    
    // Use enhanced material with normal maps if available, otherwise fall back to standard material
    if (this.materials && this.materials.floor) {
      // Use our pre-configured enhanced material with normal maps
      floorMaterial = this.materials.floor;
      console.log('Using enhanced floor material with normal maps');
    } else {
      // Use a detailed floor texture with proper tiling
      floorMaterial = new THREE.MeshStandardMaterial({
        map: this.textures.floor,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      
      // Set texture properties for optimal performance and visual quality
      if (this.textures.floor) {
        // The texture is already configured with repeat settings in the TextureGenerator
        // Do not modify the repeat values here to avoid duplication issues
        
        // Enable mipmapping to prevent texture shimmer at a distance
        this.textures.floor.generateMipmaps = true;
        this.textures.floor.minFilter = THREE.LinearMipMapLinearFilter;
        this.textures.floor.magFilter = THREE.LinearFilter;
        
        // Set anisotropy for sharper textures at glancing angles
        const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
        this.textures.floor.anisotropy = maxAnisotropy;
      }
    }
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    
    // Position the floor properly
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.y = 0; // At ground level
    floor.receiveShadow = true;
    
    // Set comprehensive userData for collision and paint splatter detection
    floor.userData = {
      isFloor: true,
      isStatic: true,
      name: 'floor',
      id: 'arena_floor',
      type: 'ground',
      reflective: false, // Whether the floor should have reflection effects
      friction: 0.8     // Higher friction for player movement
    };
    
    // Store reference to the floor for potential future use
    this.arenaFloor = floor;
    
    // Add to scene
    this.scene.add(floor);
    
    // Create corresponding physics body with proper properties
    const floorShape = new Box(new Vec3(50, 0.1, 50));
    const floorBody = new Body({
      mass: 0, // Static body
      position: new Vec3(0, -0.1, 0), // Slightly below visual floor to prevent z-fighting
      type: Body.STATIC
    });
    
    floorBody.addShape(floorShape);
    
    // Add matching userData to the physics body for consistency
    floorBody.userData = { 
      isFloor: true,
      isStatic: true,
      name: 'floor',
      id: 'arena_floor',
      type: 'ground',
      meshRef: floor    // Reference to the visual mesh
    };
    
    // Store reference to the physics body
    this.arenaFloorBody = floorBody;
    
    // Cross-reference between mesh and physics body
    floor.userData.bodyRef = floorBody;
    
    // Add to physics world
    this.physicsWorld.addBody(floorBody);
    
    return floor;
  }
  
  createBoundaryWalls() {
    const wallHeight = 4; // Height of arena walls
    const wallThickness = 0.5; // Thickness of walls
    const arenaWidth = 60; // Width of the arena
    const arenaLength = 60; // Length of the arena
    
    // Use advanced wall material if available, otherwise use basic texture
    let wallMaterial;
    if (this.materials && this.materials.wall) {
      wallMaterial = this.materials.wall;
      console.log('Using enhanced wall material with normal maps');
    } else {
      wallMaterial = new THREE.MeshStandardMaterial({
        map: this.textures.wall,
        roughness: 0.7,
        metalness: 0.3
      });
    }
    
    // Create four walls to enclose the arena
    const walls = [
      // North wall (back wall from red team perspective)
      { 
        position: new THREE.Vector3(0, wallHeight / 2, -arenaLength / 2),
        size: new THREE.Vector3(arenaWidth + wallThickness, wallHeight, wallThickness),
        rotation: new THREE.Euler(0, 0, 0),
        physicPos: new Vec3(0, wallHeight / 2, -arenaLength / 2),
        physicSize: new Vec3((arenaWidth + wallThickness) / 2, wallHeight / 2, wallThickness / 2)
      },
      // South wall (back wall from blue team perspective)
      {
        position: new THREE.Vector3(0, wallHeight / 2, arenaLength / 2),
        size: new THREE.Vector3(arenaWidth + wallThickness, wallHeight, wallThickness),
        rotation: new THREE.Euler(0, 0, 0),
        physicPos: new Vec3(0, wallHeight / 2, arenaLength / 2),
        physicSize: new Vec3((arenaWidth + wallThickness) / 2, wallHeight / 2, wallThickness / 2)
      },
      // East wall
      {
        position: new THREE.Vector3(arenaWidth / 2, wallHeight / 2, 0),
        size: new THREE.Vector3(wallThickness, wallHeight, arenaLength),
        rotation: new THREE.Euler(0, 0, 0),
        physicPos: new Vec3(arenaWidth / 2, wallHeight / 2, 0),
        physicSize: new Vec3(wallThickness / 2, wallHeight / 2, arenaLength / 2)
      },
      // West wall
      {
        position: new THREE.Vector3(-arenaWidth / 2, wallHeight / 2, 0),
        size: new THREE.Vector3(wallThickness, wallHeight, arenaLength),
        rotation: new THREE.Euler(0, 0, 0),
        physicPos: new Vec3(-arenaWidth / 2, wallHeight / 2, 0),
        physicSize: new Vec3(wallThickness / 2, wallHeight / 2, arenaLength / 2)
      }
    ];
    
    // Create all arena walls
    walls.forEach((wallConfig, index) => {
      // Create mesh
      const wallGeometry = new THREE.BoxGeometry(
        wallConfig.size.x, 
        wallConfig.size.y, 
        wallConfig.size.z
      );
      
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      
      // Position wall
      wall.position.copy(wallConfig.position);
      wall.rotation.copy(wallConfig.rotation);
      wall.castShadow = true;
      wall.receiveShadow = true;
      
      // Add metadata for game logic and collision detection
      wall.userData = {
        isWall: true,
        isStatic: true,
        name: `arena_wall_${index}`,
        id: `arena_wall_${index}`,
        type: 'boundary_wall'
      };
      
      // Add to scene
      this.scene.add(wall);
      
      // Create physics body
      const wallShape = new Box(wallConfig.physicSize);
      const wallBody = new Body({
        mass: 0, // Static body
        position: wallConfig.physicPos,
        type: Body.STATIC
      });
      
      wallBody.addShape(wallShape);
      
      // Add matching userData to the physics body for consistency
      wallBody.userData = {
        isWall: true,
        isStatic: true,
        name: `arena_wall_${index}`,
        id: `arena_wall_${index}_physics`,
        type: 'boundary_wall',
        meshRef: wall
      };
      
      // Cross-reference between mesh and physics body
      wall.userData.bodyRef = wallBody;
      
      // Add to physics world
      this.physicsWorld.addBody(wallBody);
    });
    
    console.log('Arena boundary walls created');
  }
  
  createFieldDivider() {
    // Center field marking - just visual, no physics body
    const dividerGeometry = new THREE.PlaneGeometry(80, 0.5);
    const dividerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
    divider.rotation.x = -Math.PI / 2;
    divider.position.set(0, 0.01, 0); // Just above the floor
    this.scene.add(divider);
  }
  
  createTeamBases() {
    // Red team base - back of the field
    this.createBase(-30, 0.1, -30, this.teamColors.red, this.textures.redTeam);
    
    // Add team-colored bunkers near bases
    this.createBunker(-35, 1, -35, 3, 2, 3, this.textures.redTeam);
    this.createInflatable(-25, 1, -35, this.textures.redTeam);
    
    // Blue team base - front of the field
    this.createBase(30, 0.1, 30, this.teamColors.blue, this.textures.blueTeam);
    
    // Add team-colored bunkers near bases
    this.createBunker(35, 1, 35, 3, 2, 3, this.textures.blueTeam);
    this.createInflatable(25, 1, 35, this.textures.blueTeam);
  }
  
  createObstacles() {
    // Create a longer paintball field with taller objects for better player coverage
    // Generate textures for variety
    const bunkerTexture = this.textureGenerator.generateCanvasBunkerTexture('#333333');
    const redTexture = this.textureGenerator.generateCanvasInflatableTexture('#cc3333');
    const blueTexture = this.textureGenerator.generateCanvasInflatableTexture('#3333cc');
    
    // Field boundaries (the gray barriers on the sides) - lengthened and taller
    this.createBunker(-50, 2, 0, 2, 5, 120, this.textures.wall); // Left wall
    this.createBunker(50, 2, 0, 2, 5, 120, this.textures.wall); // Right wall
    
    // Create the zigzag/W-shaped bunkers at top and bottom (taller and moved further apart)
    // Top zigzag
    this.createBunker(-20, 1, -35, 8, 3.5, 2, bunkerTexture); // Left segment
    this.createBunker(-10, 1, -35, 8, 3.5, 2, bunkerTexture); // Left-Center segment
    this.createBunker(0, 1, -35, 8, 3.5, 2, bunkerTexture);   // Center segment
    this.createBunker(10, 1, -35, 8, 3.5, 2, bunkerTexture);  // Right-Center segment
    this.createBunker(20, 1, -35, 8, 3.5, 2, bunkerTexture);  // Right segment
    
    // Bottom zigzag
    this.createBunker(-20, 1, 35, 8, 3.5, 2, bunkerTexture); // Left segment
    this.createBunker(-10, 1, 35, 8, 3.5, 2, bunkerTexture); // Left-Center segment
    this.createBunker(0, 1, 35, 8, 3.5, 2, bunkerTexture);   // Center segment
    this.createBunker(10, 1, 35, 8, 3.5, 2, bunkerTexture);  // Right-Center segment
    this.createBunker(20, 1, 35, 8, 3.5, 2, bunkerTexture);  // Right segment
    
    // Create the center cross object - taller for better cover
    this.createBunker(0, 1, 0, 3, 3.5, 10, bunkerTexture); // Vertical bar
    this.createBunker(0, 1, 0, 10, 3.5, 3, bunkerTexture); // Horizontal bar
    
    // Corner diamonds/squares - taller and larger
    this.createBunker(-20, 1, -20, 5, 3.5, 5, bunkerTexture); // Top left
    this.createBunker(20, 1, -20, 5, 3.5, 5, bunkerTexture);  // Top right
    this.createBunker(-20, 1, 20, 5, 3.5, 5, bunkerTexture);  // Bottom left
    this.createBunker(20, 1, 20, 5, 3.5, 5, bunkerTexture);   // Bottom right
    
    // Side barriers - taller and repositioned for longer field
    this.createBunker(-35, 1, -10, 3, 3.5, 5, bunkerTexture);  // Left upper
    this.createBunker(-35, 1, 10, 3, 3.5, 5, bunkerTexture);   // Left lower
    this.createBunker(35, 1, -10, 3, 3.5, 5, bunkerTexture);   // Right upper
    this.createBunker(35, 1, 10, 3, 3.5, 5, bunkerTexture);    // Right lower
    
    // Add circular inflatables (larger and taller for better cover)
    // Top half of the field
    this.createInflatable(-40, 1, -30, redTexture, 2, 3.5);  // Far left - bigger and taller
    this.createInflatable(-30, 1, -15, redTexture, 2, 3.5);  // Left area
    this.createInflatable(-15, 1, -45, redTexture, 2, 3.5);  // Top left
    this.createInflatable(0, 1, -20, redTexture, 2, 3.5);    // Top center
    this.createInflatable(15, 1, -45, redTexture, 2, 3.5);   // Top right
    this.createInflatable(30, 1, -15, redTexture, 2, 3.5);   // Right area
    this.createInflatable(40, 1, -30, redTexture, 2, 3.5);   // Far right
    
    // Bottom half of the field
    this.createInflatable(-40, 1, 30, redTexture, 2, 3.5);   // Far left
    this.createInflatable(-30, 1, 15, redTexture, 2, 3.5);   // Left area
    this.createInflatable(-15, 1, 45, redTexture, 2, 3.5);   // Bottom left
    this.createInflatable(0, 1, 20, redTexture, 2, 3.5);     // Bottom center
    this.createInflatable(15, 1, 45, redTexture, 2, 3.5);    // Bottom right
    this.createInflatable(30, 1, 15, redTexture, 2, 3.5);    // Right area
    this.createInflatable(40, 1, 30, redTexture, 2, 3.5);    // Far right
    
    // Add triangular objects - taller for better coverage
    this.createTriangularBunker(-30, 1, -45, bunkerTexture, 3.5); // Top left - taller
    this.createTriangularBunker(30, 1, -45, bunkerTexture, 3.5);  // Top right - taller
    this.createTriangularBunker(-30, 1, 45, bunkerTexture, 3.5);  // Bottom left - taller
    this.createTriangularBunker(30, 1, 45, bunkerTexture, 3.5);   // Bottom right - taller
    
    // Team base indicators - moved further out for longer field
    this.createTeamIndicator(-45, 1, -55, this.teamColors.blue); // Blue team (top left)
    this.createTeamIndicator(45, 1, 55, this.teamColors.red);    // Red team (bottom right)
  }
  
  // Create a team base indicator object with team color  
  createTeamIndicator(x, y, z, color) {
    // Create a pole
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.7,
      metalness: 0.3
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y + 2.5, z); // Position pole with bottom at ground level
    pole.castShadow = true;
    pole.userData.isObstacle = true;
    pole.userData.type = 'teamIndicator';
    
    this.scene.add(pole);
    
    // Create colored sphere on top
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.5,
      metalness: 0.3,
      emissive: color,
      emissiveIntensity: 0.5 // Glowing effect
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(x, y + 5, z);
    sphere.castShadow = true;
    sphere.userData.isObstacle = true;
    sphere.userData.type = 'teamIndicator';
    
    this.scene.add(sphere);
    
    // Add physics body for the pole (simple and static)
    const indicatorBody = new Body({
      mass: 0,
      position: new Vec3(x, y + 2.5, z),
      shape: new Box(new Vec3(0.2, 2.5, 0.2))
    });
    
    indicatorBody.userData = { isObstacle: true, type: 'teamIndicator' };
    this.physicsWorld.addBody(indicatorBody);
    
    return { pole, sphere, body: indicatorBody };
  }
  
  // Creates a triangular bunker obstacle (for the diagonal corners in the paintball map)
  createTriangularBunker(x, y, z, texture, height = 2) {
    // Create a triangular prism using a custom geometry
    // Allow custom height for taller cover
    const length = 4;
    
    // Define the triangular shape
    const geometry = new THREE.BufferGeometry();
    
    // Define the vertices (triangular prism)
    const vertices = new Float32Array([
      // Front triangle
      -length/2, 0, length/2,       // bottom left
      length/2, 0, length/2,        // bottom right
      0, height, 0,                 // top center
      
      // Back triangle
      -length/2, 0, -length/2,      // bottom left
      length/2, 0, -length/2,       // bottom right
      0, height, 0,                 // top center
      
      // Left side (rectangle)
      -length/2, 0, -length/2,      // bottom back
      -length/2, 0, length/2,       // bottom front
      0, height, 0,                 // top center front
      
      // Right side (rectangle)
      length/2, 0, -length/2,       // bottom back
      length/2, 0, length/2,        // bottom front
      0, height, 0,                 // top center
      
      // Bottom (rectangle)
      -length/2, 0, -length/2,      // bottom left back
      length/2, 0, -length/2,       // bottom right back
      -length/2, 0, length/2,       // bottom left front
      length/2, 0, length/2         // bottom right front
    ]);
    
    // Define the indices (how vertices connect to form triangles)
    const indices = [
      0, 1, 2,           // front triangle
      3, 4, 5,           // back triangle
      6, 7, 8,           // left side
      9, 10, 11,         // right side
      12, 13, 14,        // bottom part 1
      13, 15, 14         // bottom part 2
    ];
    
    // Set the attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    
    // Compute vertex normals for proper lighting
    geometry.computeVertexNormals();
    
    // Create the material
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Create the mesh
    const triangle = new THREE.Mesh(geometry, material);
    triangle.position.set(x, y, z);
    triangle.castShadow = true;
    triangle.receiveShadow = true;
    
    // Add userData for collision detection and game logic
    triangle.userData.isObstacle = true;
    triangle.userData.type = 'triangularBunker';
    
    this.scene.add(triangle);
    
    // Create a physics body (box approximation for the triangle)
    const triangleBody = new Body({
      mass: 0, // Static body
      position: new Vec3(x, y + height/2, z),
      shape: new Box(new Vec3(length/2, height/2, length/2))
    });
    
    // Link mesh and physics body
    triangle.userData.physicsBody = triangleBody;
    triangleBody.userData = { mesh: triangle, isObstacle: true, type: 'triangularBunker' };
    this.physicsWorld.addBody(triangleBody);
    
    return triangle;
  }
  
  // Create X-shaped cross barriers for additional tactical cover
  createCrossBarrierLeft(x, y, z) {
    // Create a cross-shaped arrangement of bunkers
    const crossTexture = this.textureGenerator.generateCanvasBunkerTexture();
    
    // Main bunker
    this.createBunker(x, y, z, 2, 2, 2, crossTexture);
    
    // Surrounding smaller bunkers
    this.createBunker(x - 3, y, z - 3, 2, 2, 2, crossTexture);
    this.createBunker(x + 3, y, z + 3, 2, 2, 2, crossTexture);
    this.createBunker(x - 3, y, z + 3, 2, 2, 2, crossTexture);
    this.createBunker(x + 3, y, z - 3, 2, 2, 2, crossTexture);
  }
  
  createCrossBarrierRight(x, y, z) {
    // Create a mirror of the left cross barrier
    const crossTexture = this.textureGenerator.generateCanvasBunkerTexture();
    
    // Main bunker
    this.createBunker(x, y, z, 2, 2, 2, crossTexture);
    
    // Surrounding smaller bunkers
    this.createBunker(x - 3, y, z - 3, 2, 2, 2, crossTexture);
    this.createBunker(x + 3, y, z + 3, 2, 2, 2, crossTexture);
    this.createBunker(x - 3, y, z + 3, 2, 2, 2, crossTexture);
    this.createBunker(x + 3, y, z - 3, 2, 2, 2, crossTexture);
  }
  
  createWall(x, y, z, width, height, depth, texture, castShadow = true) {
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      map: texture,
      roughness: 0.7,
      metalness: 0.2
    });
    
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    wall.castShadow = castShadow;
    wall.receiveShadow = true;
    wall.userData.isWall = true;
    this.scene.add(wall);

    const wallBody = new Body({
      mass: 0, // Static body
      position: new Vec3(x, y, z),
      shape: new Box(new Vec3(width / 2, height / 2, depth / 2))
    });
    
    // Link mesh and physics body
    wall.userData.physicsBody = wallBody;
    wallBody.userData = { mesh: wall };
    
    this.physicsWorld.addBody(wallBody);
  }
  
  createBunker(x, y, z, width, height, depth, texture) {
    // Create bunker mesh
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    // Use provided texture or generate one if none was provided
    const material = new THREE.MeshStandardMaterial({ 
      map: texture || this.textureGenerator.generateCanvasBunkerTexture(),
      roughness: 0.9,
      metalness: 0.1
    });
    
    const bunker = new THREE.Mesh(geometry, material);
    bunker.position.set(x, y, z);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    bunker.userData.isBunker = true;
    bunker.userData.isObstacle = true;
    bunker.userData.type = 'bunker';
    
    // Randomly add paint splatters to some bunkers (40% chance)
    if (Math.random() < 0.4) {
      this.addPaintSplatters(bunker, width, height, depth);
    }
    
    this.scene.add(bunker);
    
    // Create physics body
    const bunkerBody = new Body({
      mass: 0, // Static body
      position: new Vec3(x, y, z),
      shape: new Box(new Vec3(width / 2, height / 2, depth / 2))
    });
    
    // Link mesh and physics body for proper synchronization
    bunker.userData.physicsBody = bunkerBody;
    bunkerBody.userData = { mesh: bunker };
    
    this.physicsWorld.addBody(bunkerBody);
    
    return bunker;
  }
  
  // Add paint splatters to objects for a used, played-in look
  addPaintSplatters(object, width, height, depth) {
    const colors = ['#ff3333', '#3366ff', '#33ff33', '#ffff33', '#ff33ff'];
    const splatterCount = Math.floor(Math.random() * 4) + 1; // 1-4 splatters
    
    for (let i = 0; i < splatterCount; i++) {
      // Create a paint splatter
      const splatterSize = Math.random() * 0.5 + 0.2; // Random size between 0.2 and 0.7
      const splatterGeometry = new THREE.CircleGeometry(splatterSize, 8);
      const splatterMaterial = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      const splatter = new THREE.Mesh(splatterGeometry, splatterMaterial);
      
      // Position on a random face of the object
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const halfDepth = depth / 2;
      
      const face = Math.floor(Math.random() * 6); // 6 faces on a box
      let position, rotation;
      
      switch(face) {
        case 0: // front face (z+)
          position = new THREE.Vector3(
            (Math.random() - 0.5) * width * 0.8,
            (Math.random() - 0.5) * height * 0.8,
            halfDepth + 0.01
          );
          rotation = new THREE.Euler(0, 0, Math.random() * Math.PI * 2);
          break;
        case 1: // back face (z-)
          position = new THREE.Vector3(
            (Math.random() - 0.5) * width * 0.8,
            (Math.random() - 0.5) * height * 0.8,
            -halfDepth - 0.01
          );
          rotation = new THREE.Euler(0, Math.PI, Math.random() * Math.PI * 2);
          break;
        case 2: // right face (x+)
          position = new THREE.Vector3(
            halfWidth + 0.01,
            (Math.random() - 0.5) * height * 0.8,
            (Math.random() - 0.5) * depth * 0.8
          );
          rotation = new THREE.Euler(0, Math.PI / 2, Math.random() * Math.PI * 2);
          break;
        case 3: // left face (x-)
          position = new THREE.Vector3(
            -halfWidth - 0.01,
            (Math.random() - 0.5) * height * 0.8,
            (Math.random() - 0.5) * depth * 0.8
          );
          rotation = new THREE.Euler(0, -Math.PI / 2, Math.random() * Math.PI * 2);
          break;
        case 4: // top face (y+)
          position = new THREE.Vector3(
            (Math.random() - 0.5) * width * 0.8,
            halfHeight + 0.01,
            (Math.random() - 0.5) * depth * 0.8
          );
          rotation = new THREE.Euler(-Math.PI / 2, 0, Math.random() * Math.PI * 2);
          break;
        case 5: // bottom face (y-)
          position = new THREE.Vector3(
            (Math.random() - 0.5) * width * 0.8,
            -halfHeight - 0.01,
            (Math.random() - 0.5) * depth * 0.8
          );
          rotation = new THREE.Euler(Math.PI / 2, 0, Math.random() * Math.PI * 2);
          break;
      }
      
      splatter.position.copy(position);
      splatter.rotation.copy(rotation);
      object.add(splatter);
    }
  }
  
  createInflatable(x, y, z, texture, radius = 2, height = 2) {
    // Create inflatable bunker (cylinder) with custom radius and height
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
    
    // Use provided texture or generate one if none was provided
    const material = new THREE.MeshStandardMaterial({ 
      map: texture || this.textureGenerator.generateCanvasInflatableTexture(),
      roughness: 0.9,
      metalness: 0.1,
      // Add a subtle bump effect for realism
      bumpScale: 0.05
    });
    
    // Position adjusted to account for height
    const inflatable = new THREE.Mesh(geometry, material);
    inflatable.position.set(x, y + height/2, z);
    inflatable.castShadow = true;
    inflatable.receiveShadow = true;
    inflatable.userData.isInflatable = true;
    inflatable.userData.isObstacle = true;
    inflatable.userData.type = 'inflatable';
    
    // Add air valve detail to the inflatable
    this.addInflatableDetail(inflatable, radius);
    
    // Apply random rotation for variety
    inflatable.rotation.y = Math.random() * Math.PI * 2;
    
    // Randomly add paint splatters to some inflatables (30% chance)
    if (Math.random() < 0.3) {
      this.addCylindricalPaintSplatters(inflatable, height);
    }
    
    this.scene.add(inflatable);
    
    // Create physics body - using a box for simplicity
    // Scale physics body based on radius and height
    const inflatableBody = new Body({
      mass: 0,
      position: new Vec3(x, y + height/2, z),
      shape: new Box(new Vec3(radius * 0.8, height/2, radius * 0.8)) // Slightly smaller than visual
    });
    
    // Link mesh and physics body for proper synchronization
    inflatable.userData.physicsBody = inflatableBody;
    inflatableBody.userData = { mesh: inflatable, isObstacle: true, type: 'inflatable' };
    
    this.physicsWorld.addBody(inflatableBody);
    
    return inflatable;
  }
  
  // Add visual detail to inflatable objects
  addInflatableDetail(inflatable, radius = 2) {
    // Create air valve/cap detail
    const valveGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const valveMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.8
    });
    
    const valve = new THREE.Mesh(valveGeometry, valveMaterial);
    
    // Position valve on the side of the inflatable (adjusted for radius)
    valve.position.set(radius * 0.95, 0, 0);
    valve.rotation.z = Math.PI / 2;
    inflatable.add(valve);
  }
  
  // Add paint splatters to cylindrical objects
  addCylindricalPaintSplatters(object, height = 2) {
    const colors = ['#ff3333', '#3366ff', '#33ff33', '#ffff33', '#ff33ff'];
    const splatterCount = Math.floor(Math.random() * 3) + 1; // 1-3 splatters
    
    for (let i = 0; i < splatterCount; i++) {
      // Create a paint splatter
      const splatterSize = Math.random() * 0.5 + 0.2; // Random size between 0.2 and 0.7
      const splatterGeometry = new THREE.CircleGeometry(splatterSize, 8);
      const splatterMaterial = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      const splatter = new THREE.Mesh(splatterGeometry, splatterMaterial);
      
      // Position on a random spot on the cylinder (adjusted for height)
      const angle = Math.random() * Math.PI * 2;
      const heightPos = (Math.random() - 0.5) * (height * 0.8); // Random height along cylinder (scaled to object height)
      
      // Position splatter on cylinder surface
      const radius = 2 + 0.01; // Cylinder radius + small offset
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      splatter.position.set(x, heightPos, z);
      
      // Orient splatter to face outward from cylinder surface
      splatter.lookAt(splatter.position.clone().add(new THREE.Vector3(x, 0, z).normalize()));
      
      // Add random rotation around the normal for variety
      splatter.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.random() * Math.PI * 2);
      
      object.add(splatter);
    }
  }
  
  createBarrel(x, y, z, texture, radius = 1, height = 2) {
    // Create barrel (cylinder) with custom radius and height
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
    
    // Use provided texture or generate one if none was provided
    const material = new THREE.MeshStandardMaterial({ 
      map: texture || this.textureGenerator.generateCanvasBarrelTexture(),
      roughness: 0.7,
      metalness: 0.3,
      bumpScale: 0.05
    });
    
    // Position adjusted to account for height
    const barrel = new THREE.Mesh(geometry, material);
    barrel.position.set(x, y + height/2, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    barrel.userData.isBarrel = true;
    barrel.userData.isObstacle = true;
    barrel.userData.type = 'barrel';
    
    // Add barrel rim details for more realism
    this.addBarrelDetails(barrel, radius, height);
    
    // Apply random rotation for variety
    barrel.rotation.y = Math.random() * Math.PI * 2;
    
    // Randomly add paint splatters to some barrels (35% chance)
    if (Math.random() < 0.35) {
      this.addCylindricalPaintSplatters(barrel, height);
    }
    
    this.scene.add(barrel);
    
    // Create physics body scaled to barrel dimensions
    const barrelBody = new Body({
      mass: 0,
      position: new Vec3(x, y + height/2, z),
      shape: new Box(new Vec3(radius, height/2, radius)) // Box approximation of cylinder
    });
    
    // Link mesh and physics body for proper synchronization
    barrel.userData.physicsBody = barrelBody;
    barrelBody.userData = { mesh: barrel, isObstacle: true, type: 'barrel' };
    
    this.physicsWorld.addBody(barrelBody);
    
    return barrel;
  }
  
  // Add detailed rim features to barrels
  addBarrelDetails(barrel, radius = 1, height = 2) {
    // Add top and bottom rims to barrels
    const addRim = (yPos) => {
      const rimGeometry = new THREE.TorusGeometry(radius * 1.05, radius * 0.1, 8, 16);
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 0.5,
        metalness: 0.7
      });
      
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.position.y = yPos;
      rim.rotation.x = Math.PI / 2; // Orient horizontally
      barrel.add(rim);
    };
    
    // Add top and bottom rims (adjusted for height)
    addRim(height/2); // Top rim
    addRim(-height/2); // Bottom rim
    
    // Add a barrel logo/marking as a decal
    const addBarrelLogo = () => {
      const logoGeometry = new THREE.PlaneGeometry(0.8, 0.8);
      const logoMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xffff00 : 0xff3333, // Yellow or red
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      
      const logo = new THREE.Mesh(logoGeometry, logoMaterial);
      
      // Position logo on the side of the barrel
      logo.position.set(0, 0, radius * 1.05); // Slightly offset from surface
      logo.rotation.x = Math.PI / 2;
      logo.rotation.y = Math.PI / 2;
      
      barrel.add(logo);
    };
    
    // Add logo with 60% probability
    if (Math.random() < 0.6) {
      addBarrelLogo();
    }
  }
  
  createBarrelStack(x, y, z, texture, radius = 1, height = 2) {
    // Create a stack of two barrels with slight offsets for realism
    const bottomBarrel = this.createBarrel(x, y, z, texture, radius, height);
    
    // Create a slightly offset barrel on top
    const offsetX = (Math.random() - 0.5) * 0.3;
    const offsetZ = (Math.random() - 0.5) * 0.3;
    this.createBarrel(x + offsetX, y + height, z + offsetZ, texture, radius, height);
    
    // Sometimes add a third barrel for more complexity (30% chance)
    if (Math.random() < 0.3) {
      const offsetX2 = (Math.random() - 0.5) * 0.4;
      const offsetZ2 = (Math.random() - 0.5) * 0.4;
      this.createBarrel(x + offsetX2, y + height * 2, z + offsetZ2, texture, radius, height);
    }
  }
  
  createBase(x, y, z, color, texture) {
    // Base platform with stylized team texture
    const baseGeometry = new THREE.BoxGeometry(15, 0.2, 15);
    
    // Create a multi-material for the base platform
    // Top face with texture, sides with team color
    const materials = [
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.2 }),  // Right side
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.2 }),  // Left side
      texture ? new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }) :  // Top with texture if available
               new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.2 }),  // Bottom
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.2 }),  // Front side
      new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.2 })   // Back side
    ];
    
    const base = new THREE.Mesh(baseGeometry, materials);
    base.position.set(x, y, z);
    base.receiveShadow = true;
    base.userData.isBase = true;
    base.userData.teamColor = color;
    base.userData.teamBase = true;
    this.scene.add(base);
    
    // Add team flag/marker
    this.createTeamFlag(x, y + 3, z, color);
    
    // No need for physics body as players can walk through it
    // It's just a visual marker for the spawn area
  }
  
  createTeamFlag(x, y, z, color) {
    // Create flag pole
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y, z);
    pole.castShadow = true;
    this.scene.add(pole);
    
    // Create flag
    const flagGeometry = new THREE.PlaneGeometry(2, 1.5);
    const flagMaterial = new THREE.MeshStandardMaterial({ 
      color: color,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1
    });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(x + 1, y + 2, z);
    flag.rotation.y = Math.PI / 2;
    flag.castShadow = true;
    this.scene.add(flag);
  }
  
  /**
   * Creates a test platform specifically for testing paint splatter effects
   * This elevated horizontal surface is perfect for testing floor/horizontal splatter effects
   */
  createTestPlatform() {
    // Create a test platform near the player spawn for easy testing
    const platformSize = { width: 10, height: 0.5, depth: 10 };
    const platformPosition = { x: 0, y: 2, z: -10 }; // Positioned where player can easily shoot it
    
    // Create the visual mesh
    const platformGeometry = new THREE.BoxGeometry(
      platformSize.width, 
      platformSize.height, 
      platformSize.depth
    );
    
    // Use a distinctly colored material to make it obvious for testing
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x22ff22, // Bright green to easily identify
      roughness: 0.8,
      metalness: 0.2
    });
    
    const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
    platformMesh.position.set(
      platformPosition.x,
      platformPosition.y,
      platformPosition.z
    );
    platformMesh.receiveShadow = true;
    platformMesh.castShadow = true;
    
    // Important! Tag this as a floor in userData so paint splatter code knows how to handle it
    platformMesh.userData.isFloor = true;
    
    this.scene.add(platformMesh);
    
    // Create the physics body
    const platformBody = new Body({
      mass: 0, // Static body
      shape: new Box(new Vec3(
        platformSize.width / 2,
        platformSize.height / 2,
        platformSize.depth / 2
      )),
      position: new Vec3(
        platformPosition.x,
        platformPosition.y,
        platformPosition.z
      )
    });
    
    // Tag the physics body as well
    platformBody.userData = { isFloor: true };
    
    // Add the physics body to the world
    this.physicsWorld.addBody(platformBody);
    
    console.log('Created test platform for paint splatter testing');
    
    return { mesh: platformMesh, body: platformBody };
  }
}
