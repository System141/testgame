class PaintballGun {
  // ...existing code...

  constructor() {
    // ...existing code...
    this.muzzleAnimation = this.loadMuzzleAnimation();
  }

  loadMuzzleAnimation() {
    // Load the muzzle animation from the JSON file
    const animationData = require('../animations/muzzle_animation.json');
    return new Animation(animationData);
  }

  fire() {
    // ...existing code...
    this.playMuzzleAnimation();
  }

  playMuzzleAnimation() {
    this.muzzleAnimation.play();
  }
}
