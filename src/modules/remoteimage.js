export default class RemoteImgDrawManager {
  constructor (targetCanvas, avatorWidth, avatorHeight) {
    this.targetCanvas = targetCanvas;
    this.targetCtx = targetCanvas.getContext("2d");
    this.remoteImgDict = {};
    this.avatorWidth = avatorWidth;
    this.avatorHeight = avatorHeight;
  }

  addRemoteImg(targetPeerId, imageUrl, x, y) {
    if (this.remoteImgDict[targetPeerId])return;
    const self = this;
    const remoteImg = new Image();
    const remoteImgCanvas = document.createElement("canvas");
    const remoteCtx = remoteImgCanvas.getContext("2d");
    remoteImgCanvas.width = this.avatorWidth;
    remoteImgCanvas.height = this.avatorHeight; 
    remoteImg.onload = function () {
      remoteCtx.fillRect()
      remoteCtx.lineWidth = 1;
      remoteCtx.beginPath();
      remoteCtx.arc(this.avatorWidth/2, this.avatorHeight/2, this.avatorWidth/2, 0, Math.PI*2);
      remoteCtx.clip();
      remoteCtx.drawImage(remoteImg, 0, 0, this.avatorWidth, this.avatorHeight);
      remoteCtx.strokeStyle = "rgb(0, 0, 0)";
      remoteCtx.lineWidth = 3;
      remoteCtx.beginPath();
      remoteCtx.arc(this.avatorWidth/2, this.avatorHeight/2, this.avatorWidth/2, 0, Math.PI*2);
      remoteCtx.stroke();
      self.targetCtx.drawImage(remoteImgCanvas, x, y, this.avatorWidth, this.avatorHeight);
    }
    remoteImg.src = imageUrl;
    this.remoteImgDict[targetPeerId] = {remoteimgcanvas: remoteImgCanvas, x: x, y: y};
  }

  redrawRemoteImgsAll() {
    for (const peerId in this.remoteImgDict) {
      const {remoteimgcanvas, x, y} = this.remoteImgDict[peerId];
      this.targetCtx.drawImage(remoteimgcanvas, x, y, 100, 100);
    }
  }

  redrawRemoteImg(targetPeerId, x, y) {
    if (this.remoteImgDict[targetPeerId]) {
      this.remoteImgDict[targetPeerId].x = x;
      this.remoteImgDict[targetPeerId].y = y;
      for (const peerId in this.remoteImgDict) {
        const {remoteimgcanvas, x, y} = this.remoteImgDict[peerId];
        this.targetCtx.drawImage(remoteimgcanvas, x, y, 100, 100);
      }
    }
  }

  removeRemoteImg(targetPeerId) {
    this.remoteImgDict[targetPeerId].remoteimgcanvas.remove();
    delete this.remoteImgDict[targetPeerId];
    for (const peerId in this.remoteImgDict) {
      const {remoteimgcanvas, x, y} = this.remoteImgDict[peerId];
      this.targetCtx.drawImage(remoteimgcanvas, x, y, 100, 100);
    }
  }

  removeRemoteImgAll() {
    for (const peerId in this.remoteImgDict) {
      const remoteImgCanvas = this.remoteImgDict[peerId].remoteimgcanvas;
      remoteImgCanvas.remove();
    }
    this.remoteImgDict = {};
  }
}