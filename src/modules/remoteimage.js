export default class RemoteImgDrawManager {
  constructor (targetCanvas) {
    this.targetCanvas = targetCanvas;
    this.targetCtx = targetCanvas.getContext("2d");
    this.remoteImgDict = {};
  }

  addRemoteImg(targetPeerId, imageUrl, x, y) {
    if (this.remoteImgDict[targetPeerId])return;
    const self = this;
    const remoteImg = new Image();
    const remoteImgCanvas = document.createElement("canvas");
    const remoteCtx = remoteImgCanvas.getContext("2d");
    remoteImgCanvas.width = 100;
    remoteImgCanvas.height = 100;
    remoteImg.onload = function () {
      remoteCtx.beginPath();
      remoteCtx.arc(50, 50, 50, 0, Math.PI*2);
      remoteCtx.clip();
      remoteCtx.drawImage(remoteImg, 0, 0, 100, 100);
      self.targetCtx.drawImage(remoteImgCanvas, x, y, 100, 100);
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

  redrawRemoteImgSpec (targetPeerId, x, y) {
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