import * as THREE from '/node_modules/three/build/three.module.js';

export default class TextureGenerator {
    // Methods for loading image-based textures
    generateFloorTexture() {
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_arena_floor.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }

    generateWallTexture() {
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_wall.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
    }

    generateBunkerTexture() {
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_bunker.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    generateBarrelTexture() {
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_barrel.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    generateInflatableTexture() {
        const texture = new THREE.TextureLoader().load('/src/assets/textures/realistic_inflatable.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }
    
    // Generic method for creating a repeatable canvas texture with two colors
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

    // Canvas-based texture generation methods
    generateCanvasFloorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');

        // Draw a turf/grass pattern for paintball field
        context.fillStyle = '#1A6B2F'; // Base green
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create grass-like texture pattern
        context.strokeStyle = '#165529';
        context.lineWidth = 1;
        
        // Draw random grass-like lines
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const length = 3 + Math.random() * 5;
            const angle = Math.random() * Math.PI;
            
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            context.stroke();
        }
        
        // Add some dirt patches
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = 5 + Math.random() * 20;
            
            context.fillStyle = `rgba(94, 66, 41, ${0.3 + Math.random() * 0.3})`;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
        return texture;
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
    
    // Helper methods for texture generation
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
        const colors = ['#ff0000', '#0000ff', '#ffff00', '#00ff00', '#ff00ff', '#00ffff', '#ff8800'];
        
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
        const colors = [
            '#ff3333', // Red
            '#3366ff', // Blue
            '#ffcc00', // Yellow
            '#66ff33', // Green
            '#ff9900', // Orange
            '#cc33ff', // Purple
            '#ff66cc'  // Pink
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Color manipulation helpers
    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }
    
    // Convert any color format to RGB components
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
