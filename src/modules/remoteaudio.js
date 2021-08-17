class RemoteAudios {
    constructor (AudioContext) {
        this.audioContext = AudioContext;
        this.remoteAudioNodes = {};
    }

    addAudioNode (stream, peerId) {
        const memberAudioElement = document.createElement("audio");
        memberAudioElement.id = "audio-" + peerId;
        memberAudioElement.srcObject = stream;
        document.body.appendChild(memberAudioElement);

        const memberSourceNode = this.audioContext.createMediaElementSource(memberAudio);
        const memberGainNode = this.auidioContext.createGain();

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
            const memberAudioElement = document.getElementById(peerId);
            memberAudioElement.remove();
            const memberSourceNode = remoteAudioNodes[peerId].sourcenode;
            const memberGainNode = this.remoteAudioNodes[peerId].gainnode;

            memberGainNode.disconnect();
            memberSourceNode.disconnect();
            memberAudioElement.remove();
            delete this.remoteAudioNodes[peerId];
        }
    }
}