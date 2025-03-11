import * as THREE from '/node_modules/three/build/three.module.js';
import { Body, Box, Vec3 } from '/node_modules/cannon-es/dist/cannon-es.js';
import TextureGenerator from '/src/utils/textureGenerator.js';

// GameMap.js - Competitive Paintball Arena

export default class GameMap {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.textureGenerator = new TextureGenerator();
    
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
    
    // Try to load image textures first, but use generated ones if they fail
    try {
      // Try to load image-based textures
      this.textures.wall = this.textureGenerator.generateWallTexture();
      this.textures.floor = this.textureGenerator.generateFloorTexture();
      this.textures.bunker = this.textureGenerator.generateBunkerTexture();
      this.textures.inflatable = this.textureGenerator.generateInflatableTexture();
      this.textures.barrel = this.textureGenerator.generateBarrelTexture();
      console.log('Image-based textures loaded successfully');
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
    // Create the arena floor first (so other objects sit on top of it)
    this.createArenaFloor();
    
    // Create the arena boundaries
    this.createBoundaryWalls();
    
    // Create field divider
    this.createFieldDivider();
    
    // Create team bases/spawn points
    this.createTeamBases();
    
    // Add paintball obstacles (bunkers, barrels, inflatables)
    this.createObstacles();
    
    console.log('Competitive paintball arena created');
  }
  
  createArenaFloor() {
    // Create a large floor plane for the arena
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    
    // Use a detailed floor texture with proper tiling
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.floor,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    // Set texture repeat for tiling effect
    if (this.textures.floor) {
      this.textures.floor.wrapS = THREE.RepeatWrapping;
      this.textures.floor.wrapT = THREE.RepeatWrapping;
      this.textures.floor.repeat.set(10, 10); // More tiling for the large floor
    }
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    
    // Position the floor properly
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.y = 0; // At ground level
    floor.receiveShadow = true;
    floor.userData.isFloor = true;
    
    this.scene.add(floor);
    
    // Add a simple physics body for the floor
    // This invisible plane prevents objects from falling through
    const floorBody = new Body({
      mass: 0, // Static body
      shape: new Box(new Vec3(50, 0.1, 50)),
      position: new Vec3(0, -0.1, 0) // Slightly below visual floor
    });
    
    floorBody.userData = { isFloor: true };
    this.physicsWorld.addBody(floorBody);
    
    return floor;
  }
  
  createBoundaryWalls() {
    // Perimeter walls
    this.createWall(0, 5, -40, 80, 10, 1, this.textures.wall, false); // Front wall
    this.createWall(0, 5, 40, 80, 10, 1, this.textures.wall, false); // Back wall
    this.createWall(-40, 5, 0, 1, 10, 80, this.textures.wall, false); // Left wall
    this.createWall(40, 5, 0, 1, 10, 80, this.textures.wall, false); // Right wall
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
  
  createObstacles() {
    // Create a rectangular field with two symmetrically placed bunkers as shown in the diagram
    // Generate a clean bunker texture for consistency
    const bunkerTexture = this.textureGenerator.generateCanvasBunkerTexture('#333333');
    
    // Main rectangular field boundaries
    // Side walls to define the rectangular field boundary
    this.createBunker(-40, 2, 0, 3, 4, 80, this.textures.wall); // Left wall
    this.createBunker(40, 2, 0, 3, 4, 80, this.textures.wall); // Right wall
    this.createBunker(0, 2, -40, 80, 4, 3, this.textures.wall); // Back wall
    this.createBunker(0, 2, 40, 80, 4, 3, this.textures.wall); // Front wall
    
    // Create the two main rectangular bunkers exactly like in the diagram
    // Bottom bunker (closer to viewer in diagram)
    this.createBunker(0, 1, 20, 25, 2, 8, bunkerTexture);
    
    // Top bunker (further from viewer in diagram) 
    this.createBunker(0, 1, -20, 25, 2, 8, bunkerTexture);
    
    // Create team-colored bases at opposite corners (maintaining the symmetrical competitive layout)
    // Red team base (bottom right)
    this.createBunker(35, 1, 35, 8, 3, 8, this.textures.redTeam);
    // Add team indicator without flag
    this.createTeamIndicator(38, 1, 38, this.teamColors.red);
    
    // Blue team base (top left)
    this.createBunker(-35, 1, -35, 8, 3, 8, this.textures.blueTeam);
    // Add team indicator without flag
    this.createTeamIndicator(-38, 1, -38, this.teamColors.blue);
    
    // Add a few barrels at strategic positions for additional cover
    // These maintain the symmetrical layout for balanced competitive play
    this.createBarrelStack(15, 1, 0, this.textures.barrel); // Middle right
    this.createBarrelStack(-15, 1, 0, this.textures.barrel); // Middle left
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
  
  createInflatable(x, y, z, texture) {
    // Create inflatable bunker (cylinder)
    const geometry = new THREE.CylinderGeometry(2, 2, 2, 16);
    
    // Use provided texture or generate one if none was provided
    const material = new THREE.MeshStandardMaterial({ 
      map: texture || this.textureGenerator.generateCanvasInflatableTexture(),
      roughness: 0.9,
      metalness: 0.1,
      // Add a subtle bump effect for realism
      bumpScale: 0.05
    });
    
    const inflatable = new THREE.Mesh(geometry, material);
    inflatable.position.set(x, y, z);
    inflatable.castShadow = true;
    inflatable.receiveShadow = true;
    inflatable.userData.isInflatable = true;
    inflatable.userData.isObstacle = true;
    inflatable.userData.type = 'inflatable';
    
    // Add air valve detail to the inflatable
    this.addInflatableDetail(inflatable);
    
    // Apply random rotation for variety
    inflatable.rotation.y = Math.random() * Math.PI * 2;
    
    // Randomly add paint splatters to some inflatables (30% chance)
    if (Math.random() < 0.3) {
      this.addCylindricalPaintSplatters(inflatable);
    }
    
    this.scene.add(inflatable);
    
    // Create physics body - using a box for simplicity
    // In a more advanced implementation, a cylinder shape would be better
    const inflatableBody = new Body({
      mass: 0,
      position: new Vec3(x, y, z),
      shape: new Box(new Vec3(1.5, 1, 1.5)) // Slightly smaller than visual to account for cylinder vs box
    });
    
    // Link mesh and physics body for proper synchronization
    inflatable.userData.physicsBody = inflatableBody;
    inflatableBody.userData = { mesh: inflatable };
    
    this.physicsWorld.addBody(inflatableBody);
    
    return inflatable;
  }
  
  // Add visual detail to inflatable objects
  addInflatableDetail(inflatable) {
    // Create air valve/cap detail
    const valveGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const valveMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.8
    });
    
    const valve = new THREE.Mesh(valveGeometry, valveMaterial);
    
    // Position valve on the side of the inflatable
    valve.position.set(1.9, 0, 0);
    valve.rotation.z = Math.PI / 2;
    inflatable.add(valve);
  }
  
  // Add paint splatters to cylindrical objects
  addCylindricalPaintSplatters(object) {
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
      
      // Position on a random spot on the cylinder
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 1.6; // Random height along cylinder
      
      // Position splatter on cylinder surface
      const radius = 2 + 0.01; // Cylinder radius + small offset
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      splatter.position.set(x, height, z);
      
      // Orient splatter to face outward from cylinder surface
      splatter.lookAt(splatter.position.clone().add(new THREE.Vector3(x, 0, z).normalize()));
      
      // Add random rotation around the normal for variety
      splatter.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.random() * Math.PI * 2);
      
      object.add(splatter);
    }
  }
  
  createBarrel(x, y, z, texture) {
    // Create barrel (cylinder)
    const geometry = new THREE.CylinderGeometry(1, 1, 2, 16);
    
    // Use provided texture or generate one if none was provided
    const material = new THREE.MeshStandardMaterial({ 
      map: texture || this.textureGenerator.generateCanvasBarrelTexture(),
      roughness: 0.7,
      metalness: 0.3,
      bumpScale: 0.05
    });
    
    const barrel = new THREE.Mesh(geometry, material);
    barrel.position.set(x, y, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    barrel.userData.isBarrel = true;
    barrel.userData.isObstacle = true;
    barrel.userData.type = 'barrel';
    
    // Add barrel rim details for more realism
    this.addBarrelDetails(barrel);
    
    // Apply random rotation for variety
    barrel.rotation.y = Math.random() * Math.PI * 2;
    
    // Randomly add paint splatters to some barrels (35% chance)
    if (Math.random() < 0.35) {
      this.addCylindricalPaintSplatters(barrel);
    }
    
    this.scene.add(barrel);
    
    // Create physics body
    const barrelBody = new Body({
      mass: 0,
      position: new Vec3(x, y, z),
      shape: new Box(new Vec3(1, 1, 1)) // Box approximation of cylinder
    });
    
    // Link mesh and physics body for proper synchronization
    barrel.userData.physicsBody = barrelBody;
    barrelBody.userData = { mesh: barrel };
    
    this.physicsWorld.addBody(barrelBody);
    
    return barrel;
  }
  
  // Add detailed rim features to barrels
  addBarrelDetails(barrel) {
    // Add top and bottom rims to barrels
    const addRim = (yPos) => {
      const rimGeometry = new THREE.TorusGeometry(1.05, 0.1, 8, 16);
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
    
    // Add top and bottom rims
    addRim(1); // Top rim
    addRim(-1); // Bottom rim
    
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
      logo.position.set(0, 0, 1.05); // Slightly offset from surface
      logo.rotation.x = Math.PI / 2;
      logo.rotation.y = Math.PI / 2;
      
      barrel.add(logo);
    };
    
    // Add logo with 60% probability
    if (Math.random() < 0.6) {
      addBarrelLogo();
    }
  }
  
  createBarrelStack(x, y, z, texture) {
    // Create a stack of two barrels with slight offsets for realism
    const bottomBarrel = this.createBarrel(x, y, z, texture);
    
    // Create a slightly offset barrel on top
    const offsetX = (Math.random() - 0.5) * 0.3;
    const offsetZ = (Math.random() - 0.5) * 0.3;
    this.createBarrel(x + offsetX, y + 2, z + offsetZ, texture);
    
    // Sometimes add a third barrel for more complexity (30% chance)
    if (Math.random() < 0.3) {
      const offsetX2 = (Math.random() - 0.5) * 0.4;
      const offsetZ2 = (Math.random() - 0.5) * 0.4;
      this.createBarrel(x + offsetX2, y + 4, z + offsetZ2, texture);
    }
  }
}
