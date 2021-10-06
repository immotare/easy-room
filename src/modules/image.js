export default class DraggableImage {
  constructor (targetCanvas, img, avatorWidth, avatorHeight) {
    this.width = avatorWidth;
    this.height = avatorHeight;

    this.targetCanvas = targetCanvas;
    this.targetCtx = targetCanvas.getContext("2d");
    this.imgSrcCanvas = document.createElement("canvas");
    this.imgSrcCanvas.width = avatorWidth;
    this.imgSrcCanvas.height = avatorHeight;
    this.x = 0;
    this.y = 0;
    this.relX = null;
    this.relY = null;
    this.dragging = false;

    const self = this;
    const canvasCtx = this.imgSrcCanvas.getContext("2d");
    const sourceImg = new Image();
    sourceImg.onload = function () {
      canvasCtx.beginPath();
      canvasCtx.arc(avatorWidth/2, avatorHeight/2, avatorWidth/2, 0, Math.PI*2);
      canvasCtx.clip();
      canvasCtx.drawImage(sourceImg, 0, 0, avatorWidth, avatorHeight);
      self.targetCtx.drawImage(self.imgSrcCanvas, 0, 0, avatorWidth, avatorHeight);
    }
    sourceImg.src = img;
  }

  render (x, y) {
    this.x = x;
    this.y = y;
    this.targetCtx.drawImage(this.imgSrcCanvas, x, y, this.width, this.height);
  }

  isHoldPos (x, y) {
    if (this.x <= x && x <= this.x + this.width && this.y <= y && y <= this.y + this.height)return true;
    else return false;
  }
}