export default class LocalAudio {
    constructor (stream, AudioContext) {
        this.stream = stream;
        this.audioContext = AudioContext;
        this.audioSource = this.audioContext.createMediaStreamSource(stream);
        this.gain = this.audioContext.createGain();
        this.audioDest = this.audioContext.createMediaStreamDestination();

        this.audioSource.connect(this.gain);
        this.gain.connect(this.audioDest);
    }

    getFilteredStream () {
        return this.audioDest.stream;
    }
}