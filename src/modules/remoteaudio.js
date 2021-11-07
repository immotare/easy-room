export default class RemoteAudio {
  constructor (audioContext, masterGain, pannerRadius) {
    this.audioContext = audioContext;
    this.masterGain = masterGain;
    this.remoteAudioNodes = {};
    this.pannerRadius = pannerRadius;
    this.pannerGainCoef = 1;
  }

  addAudioNode (stream, peerId) {
    if (this.remoteAudioNodes[peerId])return;
    const memberAudioElement = document.createElement("audio");
    memberAudioElement.id = "audio-" + peerId;
    memberAudioElement.srcObject = stream;
    document.body.appendChild(memberAudioElement);
    const memberPanningGainNode = this.audioContext.createGain();
    const memberPannerNode = this.audioContext.createStereoPanner();
    const memberGainNode = this.audioContext.createGain();
    memberGainNode.gain.value = 1;
    memberPanningGainNode.gain.value = 1;

    memberAudioElement.onloadedmetadata = () => {
      const memberSourceNode = this.audioContext.createMediaStreamSource(memberAudioElement.srcObject);
      memberAudioElement.play();
      memberAudioElement.muted = true;
      memberSourceNode.connect(memberPanningGainNode);
      memberPanningGainNode.connect(memberPannerNode);
      memberPannerNode.connect(memberGainNode);
      memberGainNode.connect(this.masterGain);

      this.remoteAudioNodes[peerId] = {
        sourcenode: memberSourceNode,
        panninggainnode: memberPanningGainNode,
        pannernode: memberPannerNode,
        gainnode: memberGainNode
      };
    }
  }

  removeAudioNodes (peerIds) {
    for (const peerId of peerIds) {
      if (!this.remoteAudioNodes[peerId])continue;
      const memberAudioElement = document.getElementById("audio-" + peerId);
      memberAudioElement.remove();
      
      const memberSourceNode = this.remoteAudioNodes[peerId].sourcenode;
      const memberPanningGainNode = this.remoteAudioNodes[peerId].panninggainnode;
      const memberPannerNode = this.remoteAudioNodes[peerId].pannernode;
      const memberGainNode = this.remoteAudioNodes[peerId].gainnode;

      memberGainNode.disconnect();
      memberPannerNode.disconnect();
      memberPanningGainNode.disconnect();
      memberSourceNode.disconnect();
      memberAudioElement.remove();
      delete this.remoteAudioNodes[peerId];
    }
  }

  adjustGain(value, peerId) {
    if (!this.remoteAudioNodes[peerId])return;
    const memberGainNode = this.remoteAudioNodes[peerId].gainnode;
    memberGainNode.gain.value = value;
  }

  adjustPanning(localX, localY, remoteX, remoteY, peerId) {
    if (!this.remoteAudioNodes[peerId])return;
    const memberPanningGainNode = this.remoteAudioNodes[peerId].panninggainnode;
    const memberPanner = this.remoteAudioNodes[peerId].pannernode;

    const dX = remoteX - localX;
    const sign = dX > 0 ? 1 : -1;
    const dY = remoteY - localY;
    const d2 = Math.sqrt(dX * dX + dY * dY);
    const panValue = dX == 0 ? 0 : sign * Math.abs((Math.PI / 2 -  Math.atan(dY / dX))) * 0.5;
    memberPanner.pan.value = panValue;
    const gainValue = Math.exp(-d2 / (this.pannerRadius  * this.pannerGainCoef));
    memberPanningGainNode.gain.value = gainValue;
  }

  setPannerGainCoef(pannerGainCoef) {
    this.pannerGainCoef = pannerGainCoef;
  }
}