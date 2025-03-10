#!/bin/bash

# Create the textures directory if it doesn't exist
mkdir -p src/assets/textures

# Create placeholder textures for testing
for texture in realistic_arena_floor realistic_wall realistic_bunker realistic_barrel realistic_inflatable; do
  # Create a simple SVG with the texture name
  cat > src/assets/textures/${texture}.jpg << SVG_CONTENT
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#444444" />
  <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="white">
    ${texture}
  </text>
</svg>
SVG_CONTENT
done

echo "Created placeholder texture files in src/assets/textures/"
