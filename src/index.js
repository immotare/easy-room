import MemberListManager from "./modules/member";
import RemoteAudiosManager from "./modules/remoteaudio";
import PeerManager from "./modules/peer";
import LocalAudioManager from "./modules/localaudio";
import DraggableImage from "./modules/image";
import RemoteImgDrawManager from "./modules/remoteimage";

// variables selfPeerId, selfImage, credential, apiKey are declared in ejs.
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
let remoteAudios = null;
let localAudio = null;
let memberListManager = null;
let canvas = null;
let ctx = null;
let remoteImgDrawManager = null;
let draggableImage = null;

const audioInitEventName = typeof document.ontouchend !== "undefined" ? "touchend" : "mouseup";
document.addEventListener(audioInitEventName, initAudioContext);
function initAudioContext () {
  document.removeEventListener(audioInitEventName, initAudioContext);
  audioContext = new AudioContext();
  remoteAudios = new RemoteAudiosManager(audioContext);
};

const memberlistElementId = "room-members";
const roomNameElementId = "room-name";
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
    remoteAudios.removeAudioNodes([peerId]);
  },
  close: () => {
    const peerIds = peerManager.joinedRoom.members;
    memberListManager.removeMembers(peerIds);
    remoteAudios.removeAudioNodes(peerIds);
  },
  stream: (stream) => {
    remoteAudios.addAudioNode(stream, stream.peerId);
  },
  data: ({src, data}) => {
    if (data.type == "addImage") {
      // add image
    }

    if (data.type == "dragEvent") {
      // redraw image
    }
  }
};


async function connect () {
  if (!localAudio) {
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true});
    localAudio = new LocalAudioManager(localStream, audioContext);
  }
  await peerManager.makePeer(selfPeerId, credential, apiKey);
  const roomName = document.getElementById(roomNameElementId).value;
  peerManager.joinRoom(roomName, roomEventListener, localAudio.getFilteredStream());
}

function disconnect () { 
  peerManager.leaveRoom();
}

window.onload = (event) => {
  document.getElementById("connectbtn").addEventListener("click", connect);
  document.getElementById("disconnectbtn").addEventListener("click", disconnect);
  memberListManager = new MemberListManager(memberlistElementId);

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  remoteImgDrawManager = new RemoteImgDrawManager(canvas);
  draggableImage = new DraggableImage(canvas, selfImage);
};