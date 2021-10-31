import MemberListManager from "./modules/member";
import RemoteAudiosManager from "./modules/remoteaudio";
import PeerManager from "./modules/peer";
import LocalAudioManager from "./modules/localaudio";
import DraggableImage from "./modules/image";
import RemoteImgDrawManager from "./modules/remoteimage";

// variables selfPeerId, selfImgUrl, credential, apiKey are declared in ejs.
const sidebarBeforeEntering = document.getElementById("room-content-before-enter");
const sidebarAfterEntering = document.getElementById("room-content-after-enter");


const canvasWidth = 1100;
const canvasHeight = 750;
const avatorWidth = 100;
const avatorHeight = 100;

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
let remoteAudio = null;
let localAudio = null;
let masterGain = null;
const audioInitEventName = typeof document.ontouchend !== "undefined" ? "touchend" : "mouseup";
document.addEventListener(audioInitEventName, initAudioContext);

function initAudioContext() {
  document.removeEventListener(audioInitEventName, initAudioContext);
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(audioContext.destination)
  remoteAudio = new RemoteAudiosManager(audioContext, masterGain, 1, 10);
};

const masterVolumeSlider = document.getElementById("master-volume");

masterVolumeSlider.oninput = () => {
  const value = masterVolumeSlider.value;
  masterGain.gain.value = value;
}

const audioSettingBtn = document.getElementById("filter-setting");
const contentCover = document.getElementById("content-cover");
const audioSettingDialog = document.getElementById("audio-setting-dialog");

console.log(contentCover);
contentCover.style.display = "none";

audioSettingBtn.onclick = () => {
  if (contentCover.style.display === "none") {
    contentCover.style.display = "block";
  }
}

contentCover.onclick = () => {
  if (contentCover.style.display !== "none")contentCover.style.display = "none";
}



const memberVolumeSliderChangeListener = (event) => {
  const volumeSlider = event.target;
  const targetPeerId = volumeSlider.dataset.peerId;
  remoteAudio.adjustGain(volumeSlider.value, targetPeerId);
};


// waiting pair of event emission (addImage, stream)
// (key, value) := (peerId, {observed: bool, stream: stream, imageurl: imageUrl, x: x, y: y})
let streamAvatorPairObserver = {}

const memberListManager = new MemberListManager(document.getElementById("room-members-container"), memberVolumeSliderChangeListener);

const canvas = document.getElementById("target-canvas");
const ctx = canvas.getContext("2d");
const remoteImgDrawManager = new RemoteImgDrawManager(canvas, avatorWidth, avatorHeight);
const draggableImage = new DraggableImage(canvas, selfImgUrl, avatorWidth, avatorHeight);


const roomNameInput = document.getElementById("room-name-input");
const roomName = document.getElementById("room-name-guide");
const peerManager = new PeerManager();


const sfuRoomEventListeners = {
  open: () => {
    const roomPeerIds = peerManager.joinedRoom.members;
    memberListManager.addMembers(roomPeerIds);
    peerManager.sendData({
      type: "addImage",
      imageUrl: selfImgUrl,
      posX: draggableImage.x,
      posY: draggableImage.y
    });

    roomName.textContent = roomNameInput.value;
    roomNameInput.value = "";
    sidebarBeforeEntering.style.display = "none";
    sidebarAfterEntering.style.display = "flex";
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
    remoteAudio.removeAudioNodes([peerId]);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    draggableImage.render(draggableImage.x, draggableImage.y);
    remoteImgDrawManager.removeRemoteImg(peerId);
    delete streamAvatorPairObserver[peerId];
  },
  close: () => {
    sidebarAfterEntering.style.display = "none";
    sidebarBeforeEntering.style.display = "block";
    roomName.textContent = "";
    const peerIds = peerManager.joinedRoom.members;
    memberListManager.removeMembers(peerIds);
    remoteAudio.removeAudioNodes(peerIds);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    draggableImage.render(draggableImage.x, draggableImage.y);
    remoteImgDrawManager.removeRemoteImgAll();
    streamAvatorPairObserver = {};
  },
  stream: (stream) => {
    if (streamAvatorPairObserver[stream.peerId] && streamAvatorPairObserver[stream.peerId].imageurl) {
      const posX = streamAvatorPairObserver[stream.peerId].x ?? 0;
      const posY = streamAvatorPairObserver[stream.peerId].y ?? 0;
      const imageUrl = streamAvatorPairObserver[stream.peerId].imageurl;
      remoteImgDrawManager.addRemoteImg(stream.peerId, imageUrl, posX, posY);
      remoteAudio.addAudioNode(stream, stream.peerId);
      remoteAudio.adjustPanning(draggableImage.x, draggableImage.y, posX, posY, stream.peerId);
      delete streamAvatorPairObserver[stream.peerId].x;
      delete streamAvatorPairObserver[stream.peerId].y;
      delete streamAvatorPairObserver[stream.peerId].imageUrl;
      streamAvatorPairObserver[stream.peerId].observed = true;
    }
    else {
      streamAvatorPairObserver[stream.peerId] = {};
      streamAvatorPairObserver[stream.peerId].stream = stream;
    }
  },
  data: ({ src, data }) => {
    if (data.type == "addImage") {
      // add to memberlist
      console.log(src);
      memberListManager.assignImgSrc(src, data.imageUrl);
      // adjust Panning
      if (streamAvatorPairObserver[src] && streamAvatorPairObserver[src].stream) {
        const stream = streamAvatorPairObserver[src].stream;
        remoteImgDrawManager.addRemoteImg(src, data.imageUrl, data.posX, data.posY);
        remoteAudio.addAudioNode(stream, src);
        remoteAudio.adjustPanning(draggableImage.x, draggableImage.y, data.posX, data.posY, src);
        delete streamAvatorPairObserver[src].stream;
        delete streamAvatorPairObserver[src].x;
        delete streamAvatorPairObserver[src].y;
        streamAvatorPairObserver[src].observed = true;
      }
      else {
        // add imgInfo to (stream, imageurl) observer
        streamAvatorPairObserver[src] = {};
        streamAvatorPairObserver[src].x = data.posX;
        streamAvatorPairObserver[src].y = data.posY;
        streamAvatorPairObserver[src].imageurl = data.imageUrl;
      }
    }
    if (data.type == "drawEvent") {
      // redraw image
      if (streamAvatorPairObserver[src] && streamAvatorPairObserver[src].observed) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        remoteImgDrawManager.redrawRemoteImg(src, data.posX, data.posY);
        draggableImage.render(draggableImage.x, draggableImage.y);
        remoteAudio.adjustPanning(draggableImage.x, draggableImage.y, data.posX, data.posY, src);
      }
      else if (streamAvatorPairObserver[src]) {
        streamAvatorPairObserver[src].x = data.posX;
        streamAvatorPairObserver[src].y = data.posY;
      }
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
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (remoteImgDrawManager) {
      remoteImgDrawManager.redrawRemoteImgsAll();
    }
    let nX = draggableImage.relX + canvasX;
    let nY = draggableImage.relY + canvasY;
    nX = Math.min(Math.max(nX, 0), canvasWidth - avatorWidth);
    nY = Math.min(Math.max(nY, 0), canvasHeight - avatorHeight);
    draggableImage.render(nX, nY);
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