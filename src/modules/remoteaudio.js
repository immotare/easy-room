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

      const memberSourceNode = this.audioContext.createMediaElementSource(memberAudioElement);
      const memberGainNode = this.audioContext.createGain();

      memberSourceNode.connect(memberGainNode);
      memberGainNode.connect(this.audioContext.destination);
      memberAudioElement.play();

      this.remoteAudioNodes[peerId] = {
          sourcenode: memberSourceNode,
          gainnode: memberGainNode
      };
      
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
}