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
function initAudioContext() {
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
    console.log("opened room.");
    peerManager.sendData({
      type: "addImage",
      imageUrl: selfImage,
      posX: draggableImage.x,
      posY: draggableImage.y
    });
  },
  peerJoin: (peerId) => {
    memberListManager.addMembers([peerId]);
    peerManager.sendData({
      type: "addImage",
      imageUrl: selfImage,
      posX: draggableImage.x,
      posY: draggableImage.y
    });
  },
  peerLeave: (peerId) => {
    memberListManager.removeMembers([peerId]);
    remoteAudios.removeAudioNodes([peerId]);
    ctx.clearRect(0, 0, 800, 600);
    draggableImage.render(draggableImage.x, draggableImage.y);
    remoteImgDrawManager.removeRemoteImg(peerId);
  },
  close: () => {
    const peerIds = peerManager.joinedRoom.members;
    memberListManager.removeMembers(peerIds);
    remoteAudios.removeAudioNodes(peerIds);
    ctx.clearRect(0, 0, 800, 600);
    draggableImage.render(draggableImage.x, draggableImage.y);
    remoteImgDrawManager.removeRemoteImgAll();
  },
  stream: (stream) => {
    remoteAudios.addAudioNode(stream, stream.peerId);
  },
  data: ({ src, data }) => {
    if (data.type == "addImage") {
      // add image
      remoteImgDrawManager.addRemoteImg(src, data.imageUrl, data.posX, data.posY);
    }
    if (data.type == "drawEvent") {
      // redraw image
      ctx.clearRect(0, 0, 800, 600);
      remoteImgDrawManager.redrawRemoteImgSpec(src, data.posX, data.posY);
      draggableImage.render(draggableImage.x, draggableImage.y);
    }
  }
};


async function connect() {
  if (!localAudio) {
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localAudio = new LocalAudioManager(localStream, audioContext);
  }
  await peerManager.makePeer(selfPeerId, credential, apiKey);
  const roomName = document.getElementById(roomNameElementId).value;
  peerManager.joinRoom(roomName, roomEventListener, localAudio.getFilteredStream());
}

function disconnect() {
  peerManager.leaveRoom();
}

function canvasOnMouseDown(e) {
  const offsetX = canvas.getBoundingClientRect().left;
  const offsetY = canvas.getBoundingClientRect().top;


  const canvasX = e.clientX - offsetX;
  const canvasY = e.clientY - offsetY;
  if (draggableImage.isHoldPos(canvasX, canvasY)) {
    draggableImage.dragging = true;
    draggableImage.relX = draggableImage.x - canvasX;
    draggableImage.relY = draggableImage.y - canvasY;
  }
}

function canvasOnMouseMove(e) {
  const offsetX = canvas.getBoundingClientRect().left;
  const offsetY = canvas.getBoundingClientRect().top;

  const canvasX = e.clientX - offsetX;
  const canvasY = e.clientY - offsetY;

  if (draggableImage.dragging) {
    ctx.clearRect(0, 0, 800, 600);
    const nX = draggableImage.relX + canvasX;
    const nY = draggableImage.relY + canvasY;
    draggableImage.render(nX, nY);
    if (remoteImgDrawManager) {
      remoteImgDrawManager.redrawRemoteImgsAll();
    }
  }
}

function canvasOnMouseUp(e) {
  draggableImage.dragging = false;
}

function imgPosNotify() {
  if (peerManager && draggableImage) {
    peerManager.sendData({
      type: "drawEvent",
      posX: draggableImage.x,
      posY: draggableImage.y
    });
  }
}



window.onload = (event) => {
  document.getElementById("connectbtn").addEventListener("click", connect);
  document.getElementById("disconnectbtn").addEventListener("click", disconnect);
  document.getElementById("drawbtn").addEventListener("click", draw);
  memberListManager = new MemberListManager(memberlistElementId);

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  remoteImgDrawManager = new RemoteImgDrawManager(canvas);
  draggableImage = new DraggableImage(canvas, selfImage);

  canvas.addEventListener("mousemove", canvasOnMouseMove);
  canvas.addEventListener("mousedown", canvasOnMouseDown);
  canvas.addEventListener("mouseup", canvasOnMouseUp);

  let intervalId = setInterval(imgPosNotify, 300);
};