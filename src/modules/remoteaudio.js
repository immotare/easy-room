export default class RemoteAudios {
    constructor (AudioContext) {
      this.audioContext = AudioContext;
      this.remoteAudioNodes = {};
    }

    addAudioNode (stream, peerId) {
      if (this.remoteAudioNodes[peerId])return;
      const memberAudioElement = document.createElement("audio");
      memberAudioElement.id = "audio-" + peerId;
      memberAudioElement.srcObject = stream;
      document.body.appendChild(memberAudioElement);
      const memberGainNode = this.audioContext.createGain();
      memberGainNode.gain.value = 1;

      memberAudioElement.onloadedmetadata = () => {
        const memberSourceNode = this.audioContext.createMediaStreamSource(memberAudioElement.srcObject);
        memberAudioElement.play();
        memberAudioElement.muted = true;
        memberSourceNode.connect(memberGainNode);
        memberGainNode.connect(this.audioContext.destination);
        this.remoteAudioNodes[peerId] = {
          sourcenode: memberSourceNode,
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
      const memberGainNode = this.remoteAudioNodes[peerId].gainnode;

      memberGainNode.disconnect();
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
}