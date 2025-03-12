import * as THREE from '/node_modules/three/build/three.module.js';

export default class TextureGenerator {
    constructor() {
        // Cache for texture instances to avoid regenerating duplicate textures
        this.textureCache = {};
        
        // Prepare paintball color palette - standard paintball colors
        this.paintballColors = [
            '#ff0000', // Red
            '#0000ff', // Blue
            '#ffff00', // Yellow
            '#00ff00', // Green
            '#ff9900', // Orange
            '#8800ff'  // Purple
        ];
    }

    // Methods for loading image-based textures
    generateFloorTexture() {
        // Instead of loading from a file that might not exist, use our canvas-based texture directly
        return this.generatePaintballArenaFloorTexture();
        
        /* Original code - commented out to use our new texture directly
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_arena_floor.jpg', (texture) => {
            // Configure texture settings once it's loaded to prevent FOUC (flash of untextured content)
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(10, 10);
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;
        });
        return texture;
        */
    }

    generateWallTexture() {
        // Use our better canvas-based texture instead of loading from file
        return this.generateCanvasWallTexture();
        
        /* Original code - commented out to use our canvas texture
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_wall.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
        */
    }

    generateBunkerTexture() {
        // Use our better canvas-based texture
        return this.generateCanvasBunkerTexture();
        
        /* Original code - commented out to use our canvas texture
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_bunker.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
        */
    }

    generateBarrelTexture() {
        // Use our better canvas-based texture
        return this.generateCanvasBarrelTexture();
        
        /* Original code - commented out to use our canvas texture
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_barrel.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
        */
    }

    generateInflatableTexture() {
        // Use our better canvas-based texture
        return this.generateCanvasInflatableTexture();
        
        /* Original code - commented out to use our canvas texture
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_inflatable.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
        */
    }
    
    /**
     * Generates a realistic paintball arena floor texture
     * @returns {THREE.CanvasTexture} The generated floor texture
     */
    generatePaintballArenaFloorTexture() {
        // Create a larger canvas for higher resolution and less obvious tiling
        const canvas = document.createElement('canvas');
        canvas.width = 4096; // Much higher resolution for better detail
        canvas.height = 4096;
        const context = canvas.getContext('2d');

        // Base layer - astroturf green
        context.fillStyle = '#1a8e3c'; // Bright turf green
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add subtle texture variation to the base using a fine noise pattern
        this.addNoiseTexture(context, canvas.width, canvas.height, '#178438', 0.1);
        
        // Create field grid pattern (like a sports field) - larger scale to prevent obvious tiling
        this.drawFieldGridPattern(context, canvas.width, canvas.height, 128); // Larger grid size
        
        // Add field markings - create a single large field rather than repeating small ones
        this.addSingleFieldMarkings(context, canvas.width, canvas.height);
        
        // Add worn areas - these are areas where players commonly move/slide
        this.addWornAreas(context, canvas.width, canvas.height, 30); // More worn areas
        
        // Add subtle dirt/mud patches
        this.addDirtPatches(context, canvas.width, canvas.height, 40); // More dirt patches
        
        // Add some random paint splatters for character (it's a paintball field after all)
        this.addRandomPaintSplatters(context, canvas.width, canvas.height, 80); // More paint splatters
        
        const texture = new THREE.CanvasTexture(canvas);
        
        // Configure for optimal performance and minimal repetition
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Lower repeat values to avoid obvious tiling
        texture.repeat.set(2, 2); // Much lower repeat setting
        texture.anisotropy = 16; // Higher anisotropy for better appearance at angles
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        return texture;
    }
    
    /**
     * Draws a professional field grid pattern
     * @param {CanvasRenderingContext2D} context - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} gridSize - Size of grid cells 
     */
    drawFieldGridPattern(context, width, height, gridSize = 64) {
        // Draw field grid pattern (subtle lines)
        context.strokeStyle = '#1d7839';
        context.lineWidth = 2;
        
        // Draw horizontal grid lines
        for (let y = 0; y < height; y += gridSize) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }
        
        // Draw vertical grid lines
        for (let x = 0; x < width; x += gridSize) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }
    }
    
    /**
     * Adds field markings like boundary lines and zone markers designed for a single large field
     * @param {CanvasRenderingContext2D} context - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    addSingleFieldMarkings(context, width, height) {
        // Draw main field boundary
        context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        context.lineWidth = 16; // Thicker lines for better visibility
        
        // Main boundary - centered field relative to texture
        const margin = width * 0.05;
        context.beginPath();
        context.rect(margin, margin, width - margin * 2, height - margin * 2);
        context.stroke();
        
        // Center line
        context.beginPath();
        context.moveTo(width / 2, margin);
        context.lineTo(width / 2, height - margin);
        context.stroke();
        
        // Center circle
        context.beginPath();
        context.arc(width / 2, height / 2, width * 0.05, 0, Math.PI * 2);
        context.stroke();
        
        // Add zone markers
        context.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        // Four corner markers
        const cornerSize = width * 0.02;
        const cornerInset = margin + width * 0.02;
        
        // Top-left corner
        context.beginPath();
        context.moveTo(cornerInset, cornerInset);
        context.lineTo(cornerInset + cornerSize, cornerInset);
        context.lineTo(cornerInset, cornerInset + cornerSize);
        context.fill();
        
        // Top-right corner
        context.beginPath();
        context.moveTo(width - cornerInset, cornerInset);
        context.lineTo(width - cornerInset - cornerSize, cornerInset);
        context.lineTo(width - cornerInset, cornerInset + cornerSize);
        context.fill();
        
        // Bottom-left corner
        context.beginPath();
        context.moveTo(cornerInset, height - cornerInset);
        context.lineTo(cornerInset + cornerSize, height - cornerInset);
        context.lineTo(cornerInset, height - cornerInset - cornerSize);
        context.fill();
        
        // Bottom-right corner
        context.beginPath();
        context.moveTo(width - cornerInset, height - cornerInset);
        context.lineTo(width - cornerInset - cornerSize, height - cornerInset);
        context.lineTo(width - cornerInset, height - cornerInset - cornerSize);
        context.fill();
        
        // Add team bases - colored areas at opposite corners
        // Red team (top-left)
        const baseSize = width * 0.15;
        context.fillStyle = 'rgba(255, 0, 0, 0.1)';
        context.beginPath();
        context.arc(margin + baseSize/2, margin + baseSize/2, baseSize, 0, Math.PI * 2);
        context.fill();
        
        // Blue team (bottom-right)
        context.fillStyle = 'rgba(0, 0, 255, 0.1)';
        context.beginPath();
        context.arc(width - margin - baseSize/2, height - margin - baseSize/2, baseSize, 0, Math.PI * 2);
        context.fill();
    }
    
    /**
     * Adds worn areas to the floor where players commonly move
     * @param {CanvasRenderingContext2D} context - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} count - Number of worn areas to add
     */
    addWornAreas(context, width, height, count = 15) {
        // Create several worn paths/areas
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = width * 0.02 + Math.random() * width * 0.04;
            
            // Create worn area gradient
            const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(154, 194, 154, 0.7)'); // Worn turf
            gradient.addColorStop(0.7, 'rgba(154, 194, 154, 0.3)');
            gradient.addColorStop(1, 'rgba(154, 194, 154, 0)');
            
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
        
        // Add concentrated worn areas in key locations (center, bases, common routes)
        // Center field - heavy traffic area
        const centerX = width / 2;
        const centerY = height / 2;
        const centerRadius = width * 0.08;
        
        const centerGradient = context.createRadialGradient(centerX, centerY, centerRadius * 0.3, centerX, centerY, centerRadius);
        centerGradient.addColorStop(0, 'rgba(144, 184, 144, 0.8)');
        centerGradient.addColorStop(0.7, 'rgba(144, 184, 144, 0.4)');
        centerGradient.addColorStop(1, 'rgba(144, 184, 144, 0)');
        
        context.fillStyle = centerGradient;
        context.beginPath();
        context.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
        context.fill();
    }
    
    /**
     * Adds realistic dirt patches to the floor
     * @param {CanvasRenderingContext2D} context - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} count - Number of dirt patches to add
     */
    addDirtPatches(context, width, height, count = 20) {
        // Add dirt/mud patches especially in high-traffic areas
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = width * 0.005 + Math.random() * width * 0.015;
            
            const alpha = 0.2 + Math.random() * 0.3;
            context.fillStyle = `rgba(101, 80, 56, ${alpha})`;
            
            // Create irregular dirt patch
            context.beginPath();
            const points = 8 + Math.floor(Math.random() * 6);
            const angleStep = (Math.PI * 2) / points;
            
            // Starting point
            const startRadius = radius * (0.7 + Math.random() * 0.3);
            context.moveTo(
                x + Math.cos(0) * startRadius,
                y + Math.sin(0) * startRadius
            );
            
            // Create irregular perimeter
            for (let j = 1; j <= points; j++) {
                const angle = j * angleStep;
                const currentRadius = radius * (0.7 + Math.random() * 0.3);
                
                // Control points for bezier curve
                const cp1Angle = angle - angleStep * 0.5;
                const cp1Radius = radius * (0.7 + Math.random() * 0.5);
                const cp1x = x + Math.cos(cp1Angle) * cp1Radius;
                const cp1y = y + Math.sin(cp1Angle) * cp1Radius;
                
                const cp2Angle = angle - angleStep * 0.25;
                const cp2Radius = radius * (0.7 + Math.random() * 0.5);
                const cp2x = x + Math.cos(cp2Angle) * cp2Radius;
                const cp2y = y + Math.sin(cp2Angle) * cp2Radius;
                
                const endX = x + Math.cos(angle) * currentRadius;
                const endY = y + Math.sin(angle) * currentRadius;
                
                context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            }
            
            context.closePath();
            context.fill();
        }
    }
    
    /**
     * Adds random paint splatters to the floor texture
     * @param {CanvasRenderingContext2D} context - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} count - Number of paint splatters to add
     */
    addRandomPaintSplatters(context, width, height, count = 40) {
        // Add some random paintball splatter marks
        const paintColors = this.paintballColors;
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = width * 0.001 + Math.random() * width * 0.003;
            
            context.fillStyle = `rgba(${this.hexToRgb(paintColors[Math.floor(Math.random() * paintColors.length)])}, 0.3)`;
            
            // Create splatter
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
            
            // Add random drips/splashes from the main splatter
            const splashes = 2 + Math.floor(Math.random() * 5);
            for (let j = 0; j < splashes; j++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = radius * 0.5 + Math.random() * radius * 0.7;
                const splashX = x + Math.cos(angle) * distance;
                const splashY = y + Math.sin(angle) * distance;
                const splashRadius = radius * 0.1 + Math.random() * radius * 0.4;
                
                context.beginPath();
                context.arc(splashX, splashY, splashRadius, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        // Add some concentrated splatter areas near key gameplay areas
        this.addPaintballSplatterCluster(context, width * 0.5, height * 0.5, width * 0.08, 20); // Center
        this.addPaintballSplatterCluster(context, width * 0.2, height * 0.2, width * 0.05, 15); // Red base area
        this.addPaintballSplatterCluster(context, width * 0.8, height * 0.8, width * 0.05, 15); // Blue base area
    }
    
    /**
     * Creates a concentrated cluster of paint splatters in an area
     * @param {CanvasRenderingContext2D} context - Canvas context
     * @param {number} centerX - X coordinate of cluster center
     * @param {number} centerY - Y coordinate of cluster center
     * @param {number} radius - Radius of cluster area
     * @param {number} count - Number of splatters to create
     */
    addPaintballSplatterCluster(context, centerX, centerY, radius, count) {
        const paintColors = this.paintballColors;
        
        for (let i = 0; i < count; i++) {
            // Random position within the cluster area
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            // Splatter size
            const splatterRadius = radius * 0.02 + Math.random() * radius * 0.04;
            
            // Random color
            const color = paintColors[Math.floor(Math.random() * paintColors.length)];
            context.fillStyle = `rgba(${this.hexToRgb(color)}, ${0.3 + Math.random() * 0.3})`;
            
            // Draw splatter
            context.beginPath();
            context.arc(x, y, splatterRadius, 0, Math.PI * 2);
            context.fill();
            
            // Add drips
            const drips = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < drips; j++) {
                const dripAngle = Math.random() * Math.PI * 2;
                const dripLength = splatterRadius * (0.5 + Math.random() * 1.5);
                const dripWidth = splatterRadius * (0.1 + Math.random() * 0.3);
                
                const dripEndX = x + Math.cos(dripAngle) * dripLength;
                const dripEndY = y + Math.sin(dripAngle) * dripLength;
                
                // Create drip path
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(dripEndX, dripEndY);
                context.lineWidth = dripWidth;
                context.stroke();
                
                // Add drip end blob
                context.beginPath();
                context.arc(dripEndX, dripEndY, dripWidth * 1.2, 0, Math.PI * 2);
                context.fill();
            }
        }
    }

    generateCanvasTexture(primaryColor = '#3366ff', secondaryColor = '#222222', patternType = 'paintball') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Fill background with primary color
        context.fillStyle = primaryColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw pattern based on type
        switch (patternType) {
            case 'paintball':
                this.drawPaintballPattern(context, canvas.width, canvas.height, secondaryColor);
                break;
            case 'splatter':
                this.drawSplatterPattern(context, canvas.width, canvas.height, secondaryColor);
                break;
            case 'grid':
                this.drawGridPattern(context, canvas.width, canvas.height, secondaryColor);
                break;
            case 'worn':
                this.drawWornPattern(context, canvas.width, canvas.height, secondaryColor);
                break;
            default:
                this.drawPaintballPattern(context, canvas.width, canvas.height, secondaryColor);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    generateCanvasFloorTexture() {
        return this.generatePaintballArenaFloorTexture();
    }

    generateCanvasWallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; // Higher resolution for better detail
        canvas.height = 1024;
        const context = canvas.getContext('2d');

        // Draw a base color for indoor paintball arena wall
        const mainColor = '#E8E8E8'; // Light gray base
        context.fillStyle = mainColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add subtle noise texture for concrete/stucco feel
        for (let i = 0; i < 20000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2 + 0.5;
            const opacity = Math.random() * 0.15;
            const shade = Math.floor(Math.random() * 40) + 180; // Various light grays
            context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${opacity})`;
            context.fillRect(x, y, size, size);
        }

        // Create panel sections like those seen in indoor sports facilities
        context.strokeStyle = '#C0C0C0'; // Medium gray for panel lines
        context.lineWidth = 4;
        
        // Add large panel divisions
        for (let y = 0; y < canvas.height; y += 256) {
            for (let x = 0; x < canvas.width; x += 256) {
                context.strokeRect(x, y, 256, 256);
                
                // Add bolt/fastener details at panel corners
                this.drawBoltDetail(context, x + 12, y + 12);
                this.drawBoltDetail(context, x + 244, y + 12);
                this.drawBoltDetail(context, x + 12, y + 244);
                this.drawBoltDetail(context, x + 244, y + 244);
            }
        }
        
        // Add some random subtle paint splatters to walls for a used paintball arena feel
        this.addPaintSplattersToContext(context, canvas.width, canvas.height, 10, 0.05, true);
        
        // Add some scuff marks and wear at the bottom of the wall
        for (let x = 0; x < canvas.width; x += 40) {
            const scuffHeight = Math.random() * 30 + 10;
            const shade = Math.floor(Math.random() * 60) + 160;
            context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.3)`;
            context.fillRect(x, canvas.height - scuffHeight, 40, scuffHeight);
        }
        
        // Add warning stripes on some panels (industrial look)
        if (Math.random() < 0.3) { // 30% chance to add warning stripes
            const stripeY = Math.floor(Math.random() * 3) * 256 + 100;
            this.drawWarningStripes(context, 0, stripeY, canvas.width, 30);
        }
        
        // Add some paint splatters for character
        for (let i = 0; i < 8; i++) {
            this.drawPaintSplatter(
                context, 
                Math.random() * canvas.width, 
                Math.random() * canvas.height, 
                10 + Math.random() * 20, 
                this.getRandomPaintballColor(),
                0.7
            );
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5); // Less repetition for walls
        return texture;
    }
    
    generateCanvasBunkerTexture(teamColor = null) {
        // Create canvas for bunker texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Background color - black inflatable with team accent
        const baseColor = teamColor || '#222222'; // Dark gray/black default
        context.fillStyle = baseColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add fabric-like texture
        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            context.fillStyle = `rgba(255, 255, 255, 0.05)`;
            context.fillRect(x, y, size, size);
        }
        
        // Add highlight patterns
        const accentColor = teamColor ? this.lightenColor(teamColor, 30) : '#444444';
        context.strokeStyle = accentColor;
        context.lineWidth = 5;
        
        // Draw X pattern
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(canvas.width, canvas.height);
        context.stroke();
        
        context.beginPath();
        context.moveTo(canvas.width, 0);
        context.lineTo(0, canvas.height);
        context.stroke();
        
        // Draw border
        context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Add wear and tear - scuffs and paint splatters
        for (let i = 0; i < 15; i++) {
            // Add scuffs
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = 5 + Math.random() * 30;
            
            context.fillStyle = `rgba(255, 255, 255, ${0.05 + Math.random() * 0.1})`;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
            
            // Add paint splatters
            this.drawPaintSplatter(
                context, 
                Math.random() * canvas.width, 
                Math.random() * canvas.height, 
                5 + Math.random() * 15, 
                this.getRandomPaintballColor()
            );
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    generateCanvasBarrelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Main barrel color
        context.fillStyle = '#666666'; // Medium gray
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add metallic sheen/highlight
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add horizontal barrel bands/ridges
        context.strokeStyle = '#444444'; // Darker gray
        context.lineWidth = 8;
        for (let y = canvas.height/8; y < canvas.height; y += canvas.height/4) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
        }
        
        // Add rust and damage spots
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = 2 + Math.random() * 8;
            const rustColor = `rgba(${150 + Math.random() * 50}, ${50 + Math.random() * 50}, 0, ${0.4 + Math.random() * 0.3})`;
            
            context.fillStyle = rustColor;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
        
        // Add some paint splatters
        for (let i = 0; i < 5; i++) {
            this.drawPaintSplatter(
                context, 
                Math.random() * canvas.width, 
                Math.random() * canvas.height, 
                5 + Math.random() * 10, 
                this.getRandomPaintballColor()
            );
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    generateCanvasInflatableTexture(teamColor = null) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Base color - team color or default
        const baseColor = teamColor || '#ff3333'; // Red default
        context.fillStyle = baseColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create air-filled texture effect
        for (let x = 0; x < canvas.width; x += 16) {
            for (let y = 0; y < canvas.height; y += 16) {
                const shade = Math.random() * 30;
                context.fillStyle = this.adjustBrightness(baseColor, shade - 15); // Random slight variations
                context.fillRect(x, y, 16, 16);
            }
        }
        
        // Add highlight along edges to simulate inflated look
        const highlightColor = this.lightenColor(baseColor, 40);
        context.strokeStyle = highlightColor;
        context.lineWidth = 20;
        context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Add seams
        context.strokeStyle = this.darkenColor(baseColor, 20);
        context.lineWidth = 3;
        
        // Horizontal seams
        for (let y = canvas.height/4; y < canvas.height; y += canvas.height/2) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
        }
        
        // Vertical seams
        for (let x = canvas.width/4; x < canvas.width; x += canvas.width/2) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();
        }
        
        // Add paint splatters
        for (let i = 0; i < 8; i++) {
            this.drawPaintSplatter(
                context, 
                Math.random() * canvas.width, 
                Math.random() * canvas.height, 
                10 + Math.random() * 20, 
                this.getRandomPaintballColor()
            );
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    /**
     * Adds noise texture to create subtle variation in the base color
     * @param {CanvasRenderingContext2D} context - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {string} color - Color for the noise
     * @param {number} opacity - Opacity of the noise
     */
    addNoiseTexture(context, width, height, color, opacity = 0.2) {
        // Add subtle noise texture
        for (let x = 0; x < width; x += 4) {
            for (let y = 0; y < height; y += 4) {
                if (Math.random() > 0.5) {
                    context.fillStyle = `rgba(${this.hexToRgb(color)}, ${opacity * Math.random()})`;
                    context.fillRect(x, y, 4, 4);
                }
            }
        }
    }

    /**
     * Convert hex color to RGB values
     * @param {string} hex - Hex color code 
     * @returns {string} RGB values as comma-separated string
     */
    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex values to RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `${r}, ${g}, ${b}`;
    }
    
    drawPaintballPattern(context, width, height, color) {
        context.fillStyle = color;
        
        // Draw angular shapes like paintball bunkers
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 10 + Math.random() * 50;
            
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + size, y);
            context.lineTo(x + size - 10, y + size);
            context.lineTo(x - 10, y + size);
            context.closePath();
            context.fill();
        }
    }
    
    drawSplatterPattern(context, width, height, color) {
        // Create random paint splatters
        for (let i = 0; i < 20; i++) {
            this.drawPaintSplatter(
                context, 
                Math.random() * width, 
                Math.random() * height, 
                10 + Math.random() * 40, 
                color
            );
        }
    }
    
    drawGridPattern(context, width, height, color) {
        context.strokeStyle = color;
        context.lineWidth = 4;
        
        // Draw grid pattern
        for (let y = 0; y < height; y += 64) {
            for (let x = 0; x < width; x += 64) {
                context.strokeRect(x, y, 64, 64);
            }
        }
    }
    
    drawWornPattern(context, width, height, color) {
        context.fillStyle = color;
        
        // Add random scuffs and scratches
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const length = 5 + Math.random() * 30;
            const angle = Math.random() * Math.PI;
            const thickness = 1 + Math.random() * 3;
            
            context.lineWidth = thickness;
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            context.stroke();
        }
    }
    
    drawPaintSplatter(context, x, y, radius, color, opacity = 0.8) {
        // Main splatter
        context.fillStyle = `rgba(${this.hexToRgb(color)}, ${opacity})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        
        // Add drips and splatter detail
        const numDrops = 5 + Math.floor(Math.random() * 8);
        for (let i = 0; i < numDrops; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = radius * 0.5 + Math.random() * radius * 0.7;
            const dropX = x + Math.cos(angle) * distance;
            const dropY = y + Math.sin(angle) * distance;
            const dropSize = radius * 0.1 + Math.random() * radius * 0.4;
            
            context.beginPath();
            context.arc(dropX, dropY, dropSize, 0, Math.PI * 2);
            context.fill();
        }
    }
    
    addPaintSplattersToContext(context, width, height, count = 5, opacity = 0.2, subtle = false) {
        const colors = this.paintballColors;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = subtle ? (Math.random() * 10 + 5) : (Math.random() * 20 + 10);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const actualOpacity = subtle ? (opacity * 0.5) : opacity; // More transparent if subtle
            
            // Ensure color has proper hex format
            let hexColor = color;
            if (hexColor.charAt(0) !== '#') {
                hexColor = '#' + hexColor;
            }
            
            // Convert to rgba for better opacity control
            const r = parseInt(hexColor.substring(1, 3), 16);
            const g = parseInt(hexColor.substring(3, 5), 16);
            const b = parseInt(hexColor.substring(5, 7), 16);
            
            // Draw splatter
            context.fillStyle = `rgba(${r}, ${g}, ${b}, ${actualOpacity})`;
            context.beginPath();
            
            // Create irregular splatter shape instead of perfect circle
            if (Math.random() < 0.7 || !subtle) {
                // Irregular blob shape
                context.beginPath();
                const points = Math.floor(Math.random() * 5) + 5;
                for (let p = 0; p < points; p++) {
                    const angle = (p / points) * Math.PI * 2;
                    const spikeOut = Math.random() * 0.4 + 0.8;
                    const sx = x + Math.cos(angle) * size * spikeOut;
                    const sy = y + Math.sin(angle) * size * spikeOut;
                    
                    if (p === 0) {
                        context.moveTo(sx, sy);
                    } else {
                        context.lineTo(sx, sy);
                    }
                }
                context.closePath();
                context.fill();
            } else {
                // Simple circle for subtle splatters
                context.arc(x, y, size, 0, Math.PI * 2);
                context.fill();
            }
            
            // Add some droplets around the main splatter
            if (!subtle || Math.random() < 0.3) {
                const dropletCount = Math.floor(Math.random() * 8) + 3;
                for (let j = 0; j < dropletCount; j++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * size * 1.5 + size;
                    const dropletX = x + Math.cos(angle) * distance;
                    const dropletY = y + Math.sin(angle) * distance;
                    const dropletSize = Math.random() * 3 + 1;
                    
                    context.beginPath();
                    context.arc(dropletX, dropletY, dropletSize, 0, Math.PI * 2);
                    context.fill();
                }
            }
        }
    }
    
    getRandomPaintballColor() {
        const colors = this.paintballColors;
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Normal map generation for enhanced texture depth
    /**
     * Generates a normal map from a height map texture
     * @param {HTMLCanvasElement} sourceCanvas - Canvas containing the height map
     * @returns {THREE.CanvasTexture} Normal map texture
     */
    generateNormalMap(sourceCanvas, strength = 1.0) {
        // Create a new canvas for the normal map
        const canvas = document.createElement('canvas');
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;
        const ctx = canvas.getContext('2d');
        
        // Get the height map data
        const sourceCtx = sourceCanvas.getContext('2d');
        const heightData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const pixels = heightData.data;
        
        // Create output image data
        const normalData = ctx.createImageData(canvas.width, canvas.height);
        const normalPixels = normalData.data;
        
        // Calculate normals based on surrounding pixel heights
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                // Get heights of surrounding pixels
                const left = this.getPixelHeight(pixels, x - 1, y, canvas.width, canvas.height);
                const right = this.getPixelHeight(pixels, x + 1, y, canvas.width, canvas.height);
                const top = this.getPixelHeight(pixels, x, y - 1, canvas.width, canvas.height);
                const bottom = this.getPixelHeight(pixels, x, y + 1, canvas.width, canvas.height);
                
                // Calculate normal vector using central difference
                const dx = (right - left) * strength;
                const dy = (bottom - top) * strength;
                const dz = 1.0; // Fixed z component
                
                // Normalize the vector
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const nx = dx / length;
                const ny = dy / length;
                const nz = dz / length;
                
                // Convert from [-1,1] to [0,255] for RGB
                const index = (y * canvas.width + x) * 4;
                normalPixels[index] = Math.floor((nx + 1) * 127.5); // R: x component
                normalPixels[index + 1] = Math.floor((ny + 1) * 127.5); // G: y component
                normalPixels[index + 2] = Math.floor((nz + 1) * 127.5); // B: z component
                normalPixels[index + 3] = 255; // Alpha
            }
        }
        
        // Write the normal map to the canvas
        ctx.putImageData(normalData, 0, 0);
        
        // Create a Three.js texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    /**
     * Helper method to get pixel height at coordinates
     * @param {Uint8ClampedArray} pixels - The image pixel data
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {number} Pixel height value
     */
    getPixelHeight(pixels, x, y, width, height) {
        // Clamp coordinates to image bounds
        x = Math.max(0, Math.min(width - 1, x));
        y = Math.max(0, Math.min(height - 1, y));
        
        // Get pixel index
        const index = (y * width + x) * 4;
        
        // Return grayscale value (average of RGB)
        return (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
    }
    
    /**
     * Creates an optimized texture with pre-configured settings
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @param {Object} options - Texture options
     * @returns {THREE.CanvasTexture} The optimized texture
     */
    createOptimizedTexture(canvas, options = {}) {
        const defaults = {
            anisotropy: 16,
            repeat: [1, 1],
            mipmaps: true,
            minFilter: THREE.LinearMipMapLinearFilter,
            magFilter: THREE.LinearFilter
        };
        
        const settings = {...defaults, ...options};
        
        // Create the texture
        const texture = new THREE.CanvasTexture(canvas);
        
        // Configure wrapping
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(settings.repeat[0], settings.repeat[1]);
        
        // Configure filtering
        if (settings.mipmaps) {
            texture.generateMipmaps = true;
            texture.minFilter = settings.minFilter;
        } else {
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
        }
        texture.magFilter = settings.magFilter;
        
        // Set anisotropy
        texture.anisotropy = settings.anisotropy;
        
        return texture;
    }
    
    /**
     * Creates a complete material set for paintball arena objects
     * @param {string} textureType - Type of texture ('floor', 'wall', etc.)
     * @param {Object} options - Material options
     * @returns {THREE.MeshStandardMaterial} The complete material
     */
    createPaintballMaterial(textureType, options = {}) {
        // Check if already in cache
        const cacheKey = `${textureType}_${JSON.stringify(options)}`;
        if (this.textureCache[cacheKey]) {
            return this.textureCache[cacheKey];
        }
        
        let diffuseMap, normalMap, roughnessMap;
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Generate appropriate texture based on type
        switch(textureType) {
            case 'floor':
                // Draw height map for normal map generation
                this.drawPaintballFloorHeightMap(ctx, canvas.width, canvas.height);
                normalMap = this.generateNormalMap(canvas, 2.0);
                
                // Draw diffuse texture
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.drawPaintballFloorDiffuseMap(ctx, canvas.width, canvas.height);
                diffuseMap = this.createOptimizedTexture(canvas, {repeat: [8, 8]});
                break;
                
            case 'wall':
                // Similar structure for other texture types
                this.drawPaintballWallHeightMap(ctx, canvas.width, canvas.height);
                normalMap = this.generateNormalMap(canvas, 1.5);
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.drawPaintballWallDiffuseMap(ctx, canvas.width, canvas.height);
                diffuseMap = this.createOptimizedTexture(canvas, {repeat: [4, 4]});
                break;
                
            // Add other texture types as needed
        }
        
        // Create material
        const material = new THREE.MeshStandardMaterial({
            map: diffuseMap,
            normalMap: normalMap,
            roughness: options.roughness || 0.8,
            metalness: options.metalness || 0.1,
            side: options.doubleSided ? THREE.DoubleSide : THREE.FrontSide
        });
        
        // Cache the material
        this.textureCache[cacheKey] = material;
        
        return material;
    }
    
    // Helper methods for the advanced material creation
    drawPaintballFloorHeightMap(ctx, width, height) {
        // Create height variations for normal map generation
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid lines as slight elevations
        ctx.fillStyle = '#333333';
        const gridSize = 64;
        
        // Horizontal grid lines
        for (let y = 0; y < height; y += gridSize) {
            ctx.fillRect(0, y, width, 2);
        }
        
        // Vertical grid lines
        for (let x = 0; x < width; x += gridSize) {
            ctx.fillRect(x, 0, 2, height);
        }
        
        // Add random height variations
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 10 + Math.random() * 30;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawPaintballFloorDiffuseMap(ctx, width, height) {
        // Simply use our existing floor texture method
        ctx.fillStyle = '#1a8e3c'; // Base green
        ctx.fillRect(0, 0, width, height);
        
        // Add texture variations
        this.addNoiseTexture(ctx, width, height, '#178438', 0.2);
        this.drawFieldGridPattern(ctx, width, height);
        this.addWornAreas(ctx, width, height);
        this.addFieldMarkings(ctx, width, height);
        this.addDirtPatches(ctx, width, height);
        this.addRandomPaintSplatters(ctx, width, height);
    }
    
    drawPaintballWallHeightMap(ctx, width, height) {
        // Create height map for wall panels
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, width, height);
        
        // Add panel divisions as height changes
        ctx.fillStyle = '#666666';
        for (let y = 0; y < height; y += 256) {
            for (let x = 0; x < width; x += 256) {
                ctx.fillRect(x, y, 256, 256);
                
                // Panel edges
                ctx.fillStyle = '#999999';
                ctx.fillRect(x, y, 256, 4);
                ctx.fillRect(x, y, 4, 256);
                ctx.fillRect(x + 252, y, 4, 256);
                ctx.fillRect(x, y + 252, 256, 4);
                
                // Reset fill for next panel
                ctx.fillStyle = '#666666';
            }
        }
        
        // Add bolt/fastener bumps
        for (let y = 0; y < height; y += 256) {
            for (let x = 0; x < width; x += 256) {
                // Four corner bolts for each panel
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x + 12, y + 12, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(x + 244, y + 12, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(x + 12, y + 244, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(x + 244, y + 244, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    drawPaintballWallDiffuseMap(ctx, width, height) {
        // Create wall panel texture
        // Base panel color
        ctx.fillStyle = '#dddddd'; // Light gray
        ctx.fillRect(0, 0, width, height);
        
        // Add subtle panel noise
        for (let x = 0; x < width; x += 4) {
            for (let y = 0; y < height; y += 4) {
                if (Math.random() > 0.5) {
                    const shade = Math.floor(Math.random() * 10);
                    ctx.fillStyle = `rgba(200, 200, 200, ${shade / 10})`;
                    ctx.fillRect(x, y, 4, 4);
                }
            }
        }
        
        // Create panel sections
        ctx.strokeStyle = '#a0a0a0'; // Medium gray for panel lines
        ctx.lineWidth = 4;
        
        // Draw panel grid
        for (let y = 0; y < height; y += 256) {
            for (let x = 0; x < width; x += 256) {
                ctx.strokeRect(x, y, 256, 256);
                
                // Add bolt details at panel corners
                this.drawBoltDetail(ctx, x + 12, y + 12);
                this.drawBoltDetail(ctx, x + 244, y + 12);
                this.drawBoltDetail(ctx, x + 12, y + 244);
                this.drawBoltDetail(ctx, x + 244, y + 244);
            }
        }
        
        // Add some scuff marks and wear
        for (let x = 0; x < width; x += 40) {
            const scuffHeight = Math.random() * 30 + 10;
            const shade = Math.floor(Math.random() * 60) + 160;
            ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.3)`;
            ctx.fillRect(x, height - scuffHeight, 40, scuffHeight);
        }
        
        // Add warning stripes on some panels
        if (Math.random() < 0.3) {
            const stripeY = Math.floor(Math.random() * 3) * 256 + 100;
            this.drawWarningStripes(ctx, 0, stripeY, width, 30);
        }
        
        // Add paint splatters
        this.addPaintSplattersToContext(ctx, width, height, 15, 0.2, true);
    }
    
    // Color manipulation helpers
    colorToRgb(color) {
        if (typeof color === 'string') {
            // Handle string hex format like '#ff0000' or 'ff0000'
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            return { r, g, b };
        } else if (typeof color === 'number') {
            // Handle numeric format like 0xff0000
            const r = (color >> 16) & 255;
            const g = (color >> 8) & 255;
            const b = color & 255;
            
            return { r, g, b };
        }
        
        // Default fallback to black if invalid color
        console.warn('Invalid color format:', color);
        return { r: 0, g: 0, b: 0 };
    }
    
    // Convert RGB components to hex string
    rgbToHex(r, g, b) {
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }
    
    drawBoltDetail(context, x, y) {
        // Add a bolt/fastener at the specified position
        const boltSize = 6;
        
        // Draw bolt head
        context.fillStyle = '#999999';
        context.beginPath();
        context.arc(x, y, boltSize, 0, Math.PI * 2);
        context.fill();
        
        // Add highlight
        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        context.beginPath();
        context.arc(x - boltSize/4, y - boltSize/4, boltSize/3, 0, Math.PI * 2);
        context.fill();
        
        // Add bolt detail lines
        context.strokeStyle = '#777777';
        context.lineWidth = 1;
        
        // Cross pattern on bolt
        context.beginPath();
        context.moveTo(x - boltSize/2, y);
        context.lineTo(x + boltSize/2, y);
        context.moveTo(x, y - boltSize/2);
        context.lineTo(x, y + boltSize/2);
        context.stroke();
    }
    
    drawWarningStripes(context, x, y, width, height) {
        // Draw black and yellow warning stripes (like industrial caution tape)
        const stripeWidth = 20;
        context.save();
        
        // Add a background for the warning stripe
        context.fillStyle = '#000000';
        context.fillRect(x, y, width, height);
        
        // Draw the diagonal stripes
        context.fillStyle = '#FFCC00'; // Warning yellow
        for (let sx = -height*2; sx < width + height*2; sx += stripeWidth * 2) {
            context.beginPath();
            context.moveTo(sx, y);
            context.lineTo(sx + height, y + height);
            context.lineTo(sx + height + stripeWidth, y + height);
            context.lineTo(sx + stripeWidth, y);
            context.closePath();
            context.fill();
        }
        
        context.restore();
    }
    
    lightenColor(color, percent) {
        const { r, g, b } = this.colorToRgb(color);
        
        const newR = Math.min(255, r + (percent / 100) * 255);
        const newG = Math.min(255, g + (percent / 100) * 255);
        const newB = Math.min(255, b + (percent / 100) * 255);
        
        return this.rgbToHex(newR, newG, newB);
    }
    
    darkenColor(color, percent) {
        const { r, g, b } = this.colorToRgb(color);
        
        const newR = Math.max(0, r - (percent / 100) * 255);
        const newG = Math.max(0, g - (percent / 100) * 255);
        const newB = Math.max(0, b - (percent / 100) * 255);
        
        return this.rgbToHex(newR, newG, newB);
    }
    
    adjustBrightness(color, percent) {
        if (percent < 0) {
            return this.darkenColor(color, -percent);
        } else {
            return this.lightenColor(color, percent);
        }
    }
}
