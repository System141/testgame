# Test Game

A 3D first-person shooter game built with THREE.js for rendering and Cannon.js for physics.

## Project Structure

```
/
├── index.html                   # Main HTML entry point
├── package.json                 # Node.js package definition
├── package-lock.json            # Node.js package lock
└── src/                         # Source code directory
    ├── core/                    # Core game systems
    │   ├── main.js              # Main game loop and initialization
    │   └── gameState.js         # Game state management
    ├── entities/                # Game entities
    │   ├── enemy.js             # Enemy logic and behavior
    │   └── playerControls.js    # Player movement and controls
    ├── physics/                 # Physics-related code (for future expansion)
    ├── weapons/                 # Weapon systems
    │   ├── weapon.js            # Main weapon logic
    │   └── weaponModels.js      # Weapon model definitions
    ├── world/                   # World generation and management
    │   ├── map.js               # Map generation and management
    │   ├── skybox.js            # Skybox implementation
    │   └── skyboxGenerator.js   # Skybox generation utilities
    ├── assets/                  # Game assets
    │   ├── textures/            # Texture files
    │   ├── models/              # 3D models
    │   ├── animations/          # Animation data
    │   │   └── muzzle_animation.json # Muzzle flash animation
    │   └── sounds/              # Sound files
    ├── utils/                   # Utility functions
    │   └── textureGenerator.js  # Texture generation utilities
    └── server/                  # Server-related code
        └── server.js            # Development server
```

## Running the Game

To run the game:

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
node src/server/server.js
```

3. Navigate to http://localhost:5000 in your browser
