export default class RemoteImgDrawManager {
  constructor (targetCanvas) {
    this.targetCanvas = targetCanvas;
    this.targetCtx = targetCanvas.getContext("2d");
    this.remoteImgCanvas = {};
  }

  addRemoteImgCanvas (targetPeerId, imageUrl, x, y) {
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
      targetCtx.drawImage(remoteImgCanvas, x, y, 100, 100);
    }
    remoteImg.src = imageUrl;
    this.remoteImgCanvas[targetPeerId] = {remoteimgcanvas: remoteImgCanvas, x: x, y: y};
  }

  redrawRemoteImgCanvas (targetPeerId, x, y) {
    if (this.remoteImgCanvas[targetPeerId]) {
      this.remoteImgCanvas[targetPeerId].x = x;
      this.remoteImgCanvas[targetPeerId].y = y;
      for (const peerId in this.remoteImgCanvas) {
        const {remoteimgcanvas, x, y} = this.remoteImgCanvas[peerId];
        this.targetCtx.drawImage(remoteimgcanvas, x, y, 100, 100);
      }
    }
  }

  removeRemoteImgCanvas (targetPeerId) {
    this.remoteImgCanvas[targetPeerId].remoteimgcanvas.remove();
    delete this.remoteImgCanvas[targetPeerId];
    for (const peerId in this.remoteImgCanvas) {
      const {remoteimgcanvas, x, y} = this.remoteImgCanvas[peerId];
      this.targetCtx.drawImage(remoteimgcanvas, x, y, 100, 100);
    }
  }

  removeRemoteImgCanvasAll () {
    for (const peerId in this.remoteImgCanvas) {
      const remoteImgCanvas = this.remoteImgCanvas[peerId].remoteimgcanvas;
      remoteImgCanvas.remove();
    }
    this.remoteImgCanvas = {};
  }
}