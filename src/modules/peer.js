export default class PeerManager {
    constructor () {
        this.peer = null;
        this.joinedRoom = null;
    }

    async makePeer (peerId, credential, apiKey) {
      return new Promise ((resolve, reject) => {
        if (!this.peer) {
          this.peer = new Peer(peerId, {
            key: apiKey,
            credential: credential
          });
          this.peer.on("open", (id) => {
            resolve();
          });
          this.peer.on("error", (error) => {
            reject(error);
          });
        }
        else resolve();
      });
    }

    joinRoom (roomName, eventListeners, localStream) {
      this.joinedRoom = this.peer.joinRoom(roomName, {
        mode: "sfu",
        stream: localStream
      });

      this.joinedRoom.on("open", eventListeners.open);
      this.joinedRoom.on("peerJoin", eventListeners.peerJoin);
      this.joinedRoom.on("peerLeave", eventListeners.peerLeave);
      this.joinedRoom.on("close", eventListeners.close);
      this.joinedRoom.on("stream", eventListeners.stream);
      this.joinedRoom.on("data", eventListeners.data);
    }

    sendData (data) {
      if(this.joinedRoom)this.joinedRoom.send(data);
    }

    leaveRoom () {
      if(this.joinedRoom) {
        this.joinedRoom.close();
        this.joinedRoom = null;
      }
    }
}