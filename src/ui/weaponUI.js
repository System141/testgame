/**
 * WeaponUI - Enhanced weapon UI system that integrates with the existing game
 * Provides improved visual-only ammo display without numeric counter
 */

export class WeaponUI {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Cache UI elements
        this.ammoBar = document.getElementById('ammo-fill');
        this.weaponName = document.getElementById('weapon-name');
        
        // Initialize the UI
        this.initialize();
    }
    
    /**
     * Initialize the weapon UI system
     */
    initialize() {
        // Extend the gameState object with our updateAmmoUI method if it doesn't exist
        if (!this.gameState.updateAmmoUI) {
            this.gameState.updateAmmoUI = this.updateAmmoUI.bind(this);
        }
        
        // Apply initial UI update
        this.updateAmmoDisplay();
        
        console.log('Weapon UI system initialized');
    }
    
    /**
     * Update the ammo UI with current weapon data - visual only, no numeric display
     * @param {number|string} currentAmmo - Current ammo in the weapon
     * @param {number} maxAmmo - Maximum ammo capacity
     * @param {boolean} isInfinite - Whether weapon has infinite ammo
     */
    updateAmmoUI(currentAmmo, maxAmmo, isInfinite = false) {
        // Update gameState ammo values if not infinite
        if (!isInfinite && typeof currentAmmo === 'number') {
            this.gameState.currentAmmo = currentAmmo;
            this.gameState.maxAmmo = maxAmmo;
        }
        
        // Update weapon name based on ammo capacity and type
        if (this.weaponName) {
            let weaponType = 'Paintball Pistol';
            
            if (isInfinite) {
                weaponType = 'Paintball Gun';
            } else if (maxAmmo > 30) {
                weaponType = 'Paintball Rifle';
            }
            
            this.weaponName.textContent = weaponType;
        }
        
        // Update the visual ammo display
        this.updateAmmoDisplay();
    }
    
    /**
     * Update the visual display of ammo with enhanced feedback
     */
    updateAmmoDisplay() {
        // Update ammo bar fill
        if (this.ammoBar) {
            const percentage = Math.max(0, Math.min(100, 
                (this.gameState.currentAmmo / this.gameState.maxAmmo) * 100
            ));
            
            this.ammoBar.style.width = `${percentage}%`;
            
            // Change color and patterns based on ammo level
            if (percentage <= 25) {
                // Critical low ammo - red with faster pattern animation
                this.ammoBar.style.background = '#ff3333'; // Red when low
                this.ammoBar.style.backgroundImage = 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)';
                this.ammoBar.style.backgroundSize = '16px 16px';
                this.ammoBar.style.animation = 'move 1s linear infinite';
            } else if (percentage <= 50) {
                // Medium ammo - orange with medium pattern
                this.ammoBar.style.background = '#ff9933'; // Orange when medium
                this.ammoBar.style.backgroundImage = 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)';
                this.ammoBar.style.backgroundSize = '16px 16px';
                this.ammoBar.style.animation = 'move 2s linear infinite';
            } else {
                // High ammo - yellow with slow pattern
                this.ammoBar.style.background = '#ffcc00'; // Yellow when high
                this.ammoBar.style.backgroundImage = 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)';
                this.ammoBar.style.backgroundSize = '16px 16px';
                this.ammoBar.style.animation = 'move 3s linear infinite';
            }
            
            // Add markers to represent ammo capacity in the bar
            // This gives a more tactical feel to the ammo display
            const segments = Math.ceil(this.gameState.maxAmmo / 5); // One marker every 5 rounds
            const segmentWidth = 100 / segments;
            
            // Add ammo count to weapon name for immediate feedback without numeric counter
            if (this.weaponName) {
                // Display ammo status in the weapon name as text description
                const ammoStatus = percentage <= 25 ? ' [LOW AMMO]' : '';
                const currentWeaponText = this.weaponName.textContent.split(' [')[0]; // Remove any previous status
                this.weaponName.textContent = currentWeaponText + ammoStatus;
            }
        }
    }
    
    /**
     * Show reloading animation
     * @param {boolean} isReloading - Whether the weapon is currently reloading
     */
    showReloading(isReloading) {
        const ammoContainer = document.getElementById('ammo-container');
        if (!ammoContainer) return;
        
        if (isReloading) {
            // Add reloading class to container to trigger CSS animation
            ammoContainer.classList.add('reloading');
            if (this.weaponName) {
                this.weaponName.innerHTML = 'RELOADING<span class="reload-dots">...</span>';
            }
        } else {
            // Remove reloading class
            ammoContainer.classList.remove('reloading');
        }
    }
}

/**
 * Initialize the weapon UI system
 * This function should be called after the game is initialized
 * @param {Object} gameState - The game state object
 */
export function initWeaponUI(gameState) {
    return new WeaponUI(gameState);
}
