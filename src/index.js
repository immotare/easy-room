import MemberListManager from "./modules/member";
import RemoteAudiosManager from "./modules/remoteaudio";
import PeerManager from "./modules/peer";
import LocalAudioManager from "./modules/localaudio";
import DraggableImage from "./modules/image";
import RemoteImgDrawManager from "./modules/remoteimage";

// variables selfPeerId, selfImgUrl, credential, apiKey are declared in ejs.
const sidebarBeforeEntering = document.getElementById("room-content-before-enter");
const sidebarAfterEntering = document.getElementById("room-content-after-enter");

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
let remoteAudios = null;
let localAudio = null;
const audioInitEventName = typeof document.ontouchend !== "undefined" ? "touchend" : "mouseup";
document.addEventListener(audioInitEventName, initAudioContext);

function initAudioContext() {
  document.removeEventListener(audioInitEventName, initAudioContext);
  audioContext = new AudioContext();
  remoteAudios = new RemoteAudiosManager(audioContext);
};

const volumeSliderChangeListener = (event) => {
  const volumeSlider = event.target;
  const targetPeerId = volumeSlider.dataset.peerId;
  if (targetPeerId == selfPeerId) {
    localAudio.adjustGain(volumeSlider.value);
  }
  else {
    remoteAudios.adjustGain(volumeSlider.value, targetPeerId);
  }
};

const memberListManager = new MemberListManager(document.getElementById("room-members-container"), volumeSliderChangeListener);

const canvas = document.getElementById("target-canvas");
const ctx = canvas.getContext("2d");
const remoteImgDrawManager = new RemoteImgDrawManager(canvas, selfImgUrl);
const draggableImage = new DraggableImage(canvas, selfImgUrl, 100, 100);


const roomNameInput = document.getElementById("room-name-input");
const roomName = document.getElementById("room-name-guide");
const peerManager = new PeerManager();


const sfuRoomEventListeners = {
  open: () => {
    let peerIds = peerManager.joinedRoom.members;
    peerIds.push(selfPeerId);
    memberListManager.addMembers(peerIds);
    memberListManager.assignImgSrc(selfPeerId, selfImgUrl);
    peerManager.sendData({
      type: "addImage",
      imageUrl: selfImgUrl,
      posX: draggableImage.x,
      posY: draggableImage.y
    });

    roomName.textContent = roomNameInput.value;
    roomNameInput.value = "";
    sidebarBeforeEntering.style.display = "none";
    sidebarAfterEntering.style.display = "block";
  },
  peerJoin: (peerId) => {
    memberListManager.addMembers([peerId]);
    peerManager.sendData({
      type: "addImage",
      imageUrl: selfImgUrl,
      posX: draggableImage.x,
      posY: draggableImage.y
    });
  },
  peerLeave: (peerId) => {
    memberListManager.removeMembers([peerId]);
    remoteAudios.removeAudioNodes([peerId]);
    ctx.clearRect(0, 0, 1100, 720);
    draggableImage.render(draggableImage.x, draggableImage.y);
    remoteImgDrawManager.removeRemoteImg(peerId);
  },
  close: () => {
    sidebarAfterEntering.style.display = "none";
    sidebarBeforeEntering.style.display = "block";
    roomName.textContent = "";
    const peerIds = peerManager.joinedRoom.members;
    memberListManager.removeMembers(peerIds);
    remoteAudios.removeAudioNodes(peerIds);
    ctx.clearRect(0, 0, 1100, 720);
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
      // assign img url
      memberListManager.assignImgSrc(src, data.imageUrl);
    }
    if (data.type == "drawEvent") {
      // redraw image
      ctx.clearRect(0, 0, 1100, 720);
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
  const roomName = roomNameInput.value;
  peerManager.joinRoom(roomName, sfuRoomEventListeners, localAudio.getFilteredStream());
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
    ctx.clearRect(0, 0, 1100, 720);
    let nX = draggableImage.relX + canvasX;
    let nY = draggableImage.relY + canvasY;
    nX = Math.min(Math.max(nX, 0), 1000);
    nY = Math.min(Math.max(nY, 0), 620);
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
  if (peerManager.joinedRoom && draggableImage) {
    peerManager.sendData({
      type: "drawEvent",
      posX: draggableImage.x,
      posY: draggableImage.y
    });
  }
}


document.getElementById("connect-btn").addEventListener("click", connect);
document.getElementById("disconnect-btn").addEventListener("click", disconnect);
canvas.addEventListener("mousemove", canvasOnMouseMove);
canvas.addEventListener("mousedown", canvasOnMouseDown);
canvas.addEventListener("mouseup", canvasOnMouseUp);

let intervalId = setInterval(imgPosNotify, 300);