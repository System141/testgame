export default class GameState {
    constructor() {
        this.health = 100;
        this.maxHealth = 100;
        this.score = 0;
        this.currentAmmo = 30;
        this.reserveAmmo = 90;
        this.maxAmmo = 30;
        this.isReloading = false;
        this.isSprinting = false;
        this.isCrouching = false;

        // UI elements
        this.healthBar = document.getElementById('health-fill');
        this.ammoCounter = document.getElementById('ammo-counter');
        this.scoreElement = document.getElementById('score');

        this.updateUI();
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateUI();
        return this.health <= 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateUI();
    }

    addScore(points) {
        this.score += points;
        this.updateUI();
    }

    useAmmo() {
        if (this.currentAmmo > 0 && !this.isReloading) {
            this.currentAmmo--;
            this.updateUI();
            return true;
        }
        return false;
    }

    reload() {
        if (this.isReloading || this.currentAmmo >= this.maxAmmo || this.reserveAmmo <= 0) return false;
        
        this.isReloading = true;
        setTimeout(() => {
            const neededAmmo = this.maxAmmo - this.currentAmmo;
            const reloadAmount = Math.min(neededAmmo, this.reserveAmmo);
            this.currentAmmo += reloadAmount;
            this.reserveAmmo -= reloadAmount;
            this.isReloading = false;
            this.updateUI();
        }, 2000); // 2 second reload time

        return true;
    }

    updateUI() {
        if (this.healthBar) {
            this.healthBar.style.width = `${(this.health / this.maxHealth) * 100}%`;
        }
        if (this.ammoCounter) {
            this.ammoCounter.textContent = `${this.currentAmmo} / ${this.reserveAmmo}`;
        }
        if (this.scoreElement) {
            this.scoreElement.textContent = `Score: ${this.score}`;
        }
    }
} 