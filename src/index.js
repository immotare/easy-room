import MemberListManager from "./modules/member";
import RemoteAudiosManager from "./modules/remoteaudio";
import PeerManager from "./modules/peer";
import LocalAudioManager from "./modules/localaudio";
import DraggableImage from "./modules/image";
import RemoteImgDrawManager from "./modules/remoteimage";

// variables selfPeerId, selfImgUrl, credential, apiKey are declared in ejs.
const sidebarBeforeEntering = document.getElementById("room-content-before-enter");
const sidebarAfterEntering = document.getElementById("room-content-after-enter");


const roomCanvasWidth = 1100;
const roomCanvasHeight = 750;
const avatorWidth = 100;
const avatorHeight = 100;

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
let remoteAudio = null;
let localAudio = null;
let masterGain = null;
let masterAnalyser = null;
let analyserArrayLength = null;
let analyserArray = null;

const pannerParamCanvas = document.getElementById("panner-param-canvas");
const pannerParamCanvasCtx = pannerParamCanvas.getContext("2d");
const pannerParamCanvasWidth = 450;
const pannerParamCanvasHeight = 250;
const pannerRadius = 400;
const audioInitEventName = typeof document.ontouchend !== "undefined" ? "touchend" : "mouseup";
document.addEventListener(audioInitEventName, initAudioContext);

function initAudioContext() {
  document.removeEventListener(audioInitEventName, initAudioContext);
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterAnalyser = audioContext.createAnalyser();
  analyserArrayLength = masterAnalyser.frequencyBinCount; // default 2048
  analyserArray = new Uint8Array(analyserArrayLength);
  masterGain.gain.value = 1;
  masterGain.connect(masterAnalyser);
  masterAnalyser.connect(audioContext.destination);
  remoteAudio = new RemoteAudiosManager(audioContext, masterGain, pannerRadius);
  drawAnalyserCanvas();
};

const pannerParamSlider = document.getElementById("panner-paramslider");
pannerParamSlider.oninput = () => {
  const value = pannerParamSlider.value; 
  remoteAudio.setPannerGainCoef(value);
}

function drawAnalyserCanvas() {
  requestAnimationFrame(drawAnalyserCanvas);
  pannerParamCanvasCtx.clearRect(0, 0, pannerParamCanvasWidth, pannerParamCanvasHeight);
  const pannerGainCoef = pannerParamSlider.value;
  const pannerGainDrawBaseHeight = pannerParamCanvasHeight * 3 / 4;
  pannerParamCanvasCtx.lineWidth = 3;
  pannerParamCanvasCtx.strokeStyle = "rgb(0, 0, 255)";
  pannerParamCanvasCtx.beginPath();
  pannerParamCanvasCtx.moveTo(0, pannerParamCanvasHeight - Math.exp(-1/pannerGainCoef) * pannerGainDrawBaseHeight);
  for (let x = 0.1;x <= pannerParamCanvasWidth;x+=0.1) {
    const d2 = Math.sqrt((pannerParamCanvasWidth / 2 - x) * (pannerParamCanvasWidth  / 2 - x));
    const drawposY = pannerParamCanvasHeight - Math.exp(-d2 / (pannerParamCanvasWidth * pannerGainCoef/2)) * pannerGainDrawBaseHeight;
    pannerParamCanvasCtx.lineTo(x, drawposY);
  }
  pannerParamCanvasCtx.stroke();


  if (!masterAnalyser)return;
  masterAnalyser.getByteTimeDomainData(analyserArray);

  pannerParamCanvasCtx.lineWidth = 2;
  pannerParamCanvasCtx.strokeStyle = "rgb(0, 0, 0)";
  pannerParamCanvasCtx.beginPath();


  const sliceWidth = pannerParamCanvasWidth / analyserArrayLength;
  let drawposX = 0;
  for (let i = 0;i < analyserArrayLength;i++) {
    const drawposY = pannerParamCanvasHeight - (analyserArray[i] / 255 * pannerParamCanvasHeight);

    if (i == 0) {
      pannerParamCanvasCtx.moveTo(drawposX, drawposY);
    }
    else {
      pannerParamCanvasCtx.lineTo(drawposX, drawposY);
    }
    drawposX += sliceWidth;
  }

  pannerParamCanvasCtx.lineTo(pannerParamCanvasWidth, pannerParamCanvasHeight/2);
  pannerParamCanvasCtx.stroke();
}



const masterVolumeSlider = document.getElementById("master-volume");
masterVolumeSlider.oninput = () => {
  const value = masterVolumeSlider.value;
  masterGain.gain.value = value;
}

const micInputVolumeSlider = document.getElementById("mic-input-volume");
micInputVolumeSlider.oninput = () => {
  const value = micInputVolumeSlider.value;
  localAudio.adjustGain(value);
}

const audioSettingBtn = document.getElementById("filter-setting");
const contentCover = document.getElementById("content-cover");
const dialogCloseBtn = document.getElementById("dialog-close-btn");

contentCover.style.display = "none";
audioSettingBtn.onclick = () => {
  if (contentCover.style.display === "none") {
    contentCover.style.display = "block";
    if(localAudio)localAudio.connectMictoMasterGain();
  }
}

dialogCloseBtn.onclick = () => {
  if (contentCover.style.display !== "none") {
    contentCover.style.display = "none";
    if(localAudio)localAudio.disconnectMicfromMasterGain();
  }
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

const roomCanvas = document.getElementById("target-canvas");
const roomCanvasCtx = roomCanvas.getContext("2d");
const remoteImgDrawManager = new RemoteImgDrawManager(roomCanvas, avatorWidth, avatorHeight);
const draggableImage = new DraggableImage(roomCanvas, selfImgUrl, avatorWidth, avatorHeight);


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
    roomCanvasCtx.clearRect(0, 0, roomCanvasWidth, roomCanvasHeight);
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
    roomCanvasCtx.clearRect(0, 0, roomCanvasWidth, roomCanvasHeight);
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
    else if(!streamAvatorPairObserver[stream.peerId] || !streamAvatorPairObserver[stream.peerId].observed) {
      streamAvatorPairObserver[stream.peerId] = {};
      streamAvatorPairObserver[stream.peerId].stream = stream;
    }
  },
  data: ({ src, data }) => {
    if (data.type == "addImage") {
      // add to memberlist
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
      else if(!streamAvatorPairObserver[src] || !streamAvatorPairObserver[src].observed) {
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
        roomCanvasCtx.clearRect(0, 0, roomCanvasWidth, roomCanvasHeight);
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
    localAudio = new LocalAudioManager(localStream, audioContext, masterGain);
  }
  await peerManager.makePeer(selfPeerId, credential, apiKey);
  const roomName = roomNameInput.value;
  peerManager.joinRoom(roomName, sfuRoomEventListeners, localAudio.getFilteredStream());
}

function disconnect() {
  peerManager.leaveRoom();
}

function canvasOnMouseDown(e) {
  const offsetX = roomCanvas.getBoundingClientRect().left;
  const offsetY = roomCanvas.getBoundingClientRect().top;


  const canvasX = e.clientX - offsetX;
  const canvasY = e.clientY - offsetY;
  if (draggableImage.isHoldPos(canvasX, canvasY)) {
    draggableImage.dragging = true;
    draggableImage.relX = draggableImage.x - canvasX;
    draggableImage.relY = draggableImage.y - canvasY;
  }
}

function canvasOnMouseMove(e) {
  const offsetX = roomCanvas.getBoundingClientRect().left;
  const offsetY = roomCanvas.getBoundingClientRect().top;

  const canvasX = e.clientX - offsetX;
  const canvasY = e.clientY - offsetY;

  if (draggableImage.dragging) {
    roomCanvasCtx.clearRect(0, 0, roomCanvasWidth, roomCanvasHeight);

    if (remoteImgDrawManager) {
      remoteImgDrawManager.redrawRemoteImgsAll();
    }
    let nX = draggableImage.relX + canvasX;
    let nY = draggableImage.relY + canvasY;
    nX = Math.min(Math.max(nX, 0), roomCanvasWidth - avatorWidth);
    nY = Math.min(Math.max(nY, 0), roomCanvasHeight - avatorHeight);
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
roomCanvas.addEventListener("mousemove", canvasOnMouseMove);
roomCanvas.addEventListener("mousedown", canvasOnMouseDown);
roomCanvas.addEventListener("mouseup", canvasOnMouseUp);

let intervalId = setInterval(imgPosNotify, 300);