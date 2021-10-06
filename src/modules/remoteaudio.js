export default class RemoteAudio {
  constructor (AudioContext, panningGainCoef, pannerCoef) {
    this.audioContext = AudioContext;
    this.remoteAudioNodes = {};
    this.panningGainCoef = panningGainCoef;
    this.pannerCoef = pannerCoef;
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

    memberAudioElement.onloadedmetadata = () => {
      const memberSourceNode = this.audioContext.createMediaStreamSource(memberAudioElement.srcObject);
      memberAudioElement.play();
      memberAudioElement.muted = true;
      memberSourceNode.connect(memberPanningGainNode);
      memberPanningGainNode.connect(memberPannerNode);
      memberPannerNode.connect(memberGainNode);
      memberGainNode.connect(this.audioContext.destination);
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
    console.log(memberGainNode);
  }

  adjustPanning(localX, localY, remoteX, remoteY, peerId) {
    if (!this.remoteAudioNodes[peerId])return;
    const memberPanningGainNode = this.remoteAudioNodes[peerId].panninggainnode;
    const memberPanner = this.remoteAudioNodes[peerId].pannernode;

    const dX = remoteX - localX;
    const dY = remoteY - localY;
    const d = Math.sqrt(dX * dX + dY * dY);

    memberPanner.pan.value = this.clampPanValue(this.pannerCoef * dX);
    const gainValue = Math.max(1 - d * this.panningGainCoef, 0);
    memberPanningGainNode.gain.value = gainValue;
  }

  clampPanValue(value) {
    if (value < -1)return -1;
    else if(value > 1)return 1;
    else return value;
  }
}