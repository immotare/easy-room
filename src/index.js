import MemberListManager from "./modules/member";
import RemoteAudiosManager from "./modules/remoteaudio";
import PeerManager from "./modules/peer";
import LocalAudioManager from "./modules/localaudio"

// variables selfPeerId, credential, apiKey are declared in ejs.

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
let remoteAudios = null;
let localAudio = null;
const audioInitEventName = typeof document.ontouchend !== "undefined" ? "touchend" : "mouseup";
document.addEventListener(eventName, initAudioContext);
const initAudioContext = () => {
  document.removeEventListener(audioInitEventName, initAudioContext);
  audioContext = new AudioContext();
  remoteAudios = new RemoteAudiosManager(audioContext);
};

const memberlistElementId = "room-members";
const memberListManager = new MemberListManager(memberlistElementId);
const peerManager = new PeerManager();

const roomEventListener = {
  open: () => {
    let peerIds = peerManager.joinedRoom.members;
    peerIds.push(selfPeerId);
    memberListManager.addMembers(peerIds);
  },
  peerJoin: (peerId) => {
    memberListManager.addMembers([peerId]);
  },
  peerLeave: (peerId) => {
    memberListManager.removeMembers([peerId]);
    removeAudioNodes([peerId]);
  },
  close: () => {
    const peerIds = peerManager.joinedRoom.members;
    memberListManager.removeMembers(peerIds);
    removeAudioNodes(peerIds);
  },
  stream: (stream) => {
    remoteAudios.addAudioNode(stream, stream.peerId);
  }
};

const roomNameElementId = "room-name";
async function connect () {
  if (!localAudio) {
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true});
    localAudio = new LocalAudioManager(localStream, audioContext);
  }
  await peerManager.makePeer(selfPeerId, credential, apiKey);
  const roomName = document.getElementById(roomNameElementId).nodeValue;
  peerManager.joinRoom(roomName, roomEventListener, localAudio.getFilteredStream());
}

function disconnect () { 
  peerManager.leaveRoom();
}