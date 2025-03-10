/**
 * AmmoUI - Enhanced ammo counter display system
 * Handles updating and displaying ammo information with visual indicators
 */
export class AmmoUI {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Initialize UI elements
        this.ammoContainer = document.getElementById('ammo-container');
        this.ammoCounter = document.getElementById('ammo-counter');
        this.weaponName = document.getElementById('weapon-name');
        this.ammoFill = document.getElementById('ammo-fill');
        
        // Initial update
        this.update();
    }
    
    /**
     * Updates the ammo display based on current weapon state
     * @param {number} currentAmmo - Current ammo in weapon
     * @param {number} maxAmmo - Maximum ammo capacity
     * @param {number} reserveAmmo - Reserve ammo available
     * @param {string} weaponDisplayName - Name of current weapon to display
     */
    update(currentAmmo, maxAmmo, reserveAmmo, weaponDisplayName) {
        // Use provided values or fallback to gameState if not provided
        currentAmmo = currentAmmo ?? this.gameState.currentAmmo;
        maxAmmo = maxAmmo ?? this.gameState.maxAmmo;
        reserveAmmo = reserveAmmo ?? this.gameState.reserveAmmo;
        
        // Update counter text
        if (this.ammoCounter) {
            this.ammoCounter.textContent = `${currentAmmo} / ${reserveAmmo}`;
        }
        
        // Update ammo bar
        if (this.ammoFill) {
            const percentage = Math.max(0, Math.min(100, (currentAmmo / maxAmmo) * 100));
            this.ammoFill.style.width = `${percentage}%`;
            
            // Change color based on ammo level
            if (percentage <= 25) {
                this.ammoFill.style.background = '#ff3333'; // Red when low
            } else if (percentage <= 50) {
                this.ammoFill.style.background = '#ff9933'; // Orange when medium
            } else {
                this.ammoFill.style.background = '#ffcc00'; // Yellow when high
            }
        }
        
        // Update weapon name if provided
        if (this.weaponName && weaponDisplayName) {
            this.weaponName.textContent = weaponDisplayName;
        }
    }
    
    /**
     * Show reloading animation/indicator
     * @param {boolean} isReloading - Whether the weapon is currently reloading
     */
    showReloading(isReloading) {
        if (!this.ammoContainer) return;
        
        if (isReloading) {
            // Add reloading class to container to show animation via CSS
            this.ammoContainer.classList.add('reloading');
            
            // Update text to show reloading
            if (this.weaponName) {
                this.weaponName.innerHTML = 'RELOADING <span class="reload-dots">...</span>';
            }
        } else {
            // Remove reloading class
            this.ammoContainer.classList.remove('reloading');
        }
    }
}
