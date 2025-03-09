class Weapon {
  constructor() {
    // ...existing code...
    this.normal = this.initializeNormal(); // Ensure normal is initialized
    // ...existing code...
  }

  initializeNormal() {
    // Initialize the normal property with a default value
    return { /* default properties */ };
  }

  update() {
    // ...existing code...
    if (!this.normal) {
      this.normal = this.initializeNormal(); // Re-initialize if null
    }
    // Ensure normal is not null before accessing its properties
    // ...existing code...
  }
}
