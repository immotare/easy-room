export default class DraggableImage {
  constructor (targetCanvas, img) {
    this.targetCanvas = targetCanvas;
    this.targetCtx = targetCanvas.getContext("2d");
    this.imgSrcCanvas = document.createElement("canvas");
    this.imgSrcCanvas.width = 100;
    this.imgSrcCanvas.height = 100;
    document.body.appendChild(this.imgSrcCanvas);    
    this.width = 100;
    this.height = 100;
    this.x = null;
    this.y = null;
    this.relX = null;
    this.relY = null;
    this.dragging = false;

    const self = this;
    const canvasCtx = this.imgSrcCanvas.getContext("2d");
    const sourceImg = new Image();
    sourceImg.onload = function () {
      canvasCtx.beginPath();
      canvasCtx.arc(50, 50, 50, 0, Math.PI*2);
      canvasCtx.clip();
      canvasCtx.drawImage(sourceImg, 0, 0, 100, 100);
      self.targetCtx.drawImage(self.imgSrcCanvas, 0, 0, 100, 100);
    }
    sourceImg.src = img;
  }

  render (x, y) {
    this.x = x;
    this.y = y;
    console.log("render called");
    this.targetCtx.drawImage(this.imgSrcCanvas, x, y, this.width, this.height);
  }

  isHoldPos (x, y) {
    if (this.x <= x && x <= this.x + this.width && this.y <= y && y <= this.y + this.height)return true;
    else return false;
  }
}