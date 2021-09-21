export default class LocalAudio {
    constructor (stream, AudioContext) {
        this.stream = stream;
        this.audioContext = AudioContext;
        this.audioSourceNode = this.audioContext.createMediaStreamSource(stream);
        this.gainNode = this.audioContext.createGain();
        this.audioDest = this.audioContext.createMediaStreamDestination();

        this.gainNode.gain.value = 1;
        this.audioSourceNode.connect(this.gainNode);
        this.gainNode.connect(this.audioDest);
    }

    getFilteredStream () {
        return this.audioDest.stream;
    }

    adjustGain(value) {
        this.gainNode.gain.value = value;
    }
}