class Animation {
  constructor(data) {
    this.frames = data.animation.frames;
    this.loop = data.animation.loop;
    this.currentFrame = 0;
  }

  play() {
    this.currentFrame = 0;
    this.showFrame();
  }

  showFrame() {
    if (this.currentFrame < this.frames.length) {
      const frame = this.frames[this.currentFrame];
      // Display the frame image (implementation depends on your rendering logic)
      console.log(`Displaying frame: ${frame.image}`);
      setTimeout(() => {
        this.currentFrame++;
        this.showFrame();
      }, frame.duration);
    } else if (this.loop) {
      this.play();
    }
  }
}

module.exports = Animation;
