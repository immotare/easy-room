export default class MemberListManager {
  constructor (memberlistContainer) {
    this.memberlistContainer = memberlistContainer;
  }

  // assign img src lazy
  createUserContent (userNameString, peerId) {
    const contentWrapper = document.createElement("div");
    contentWrapper.id = peerId + "-user-content";
    contentWrapper.classList.add("room-member-content");

    const memberInfos = document.createElement("div");
    const userImg = document.createElement("img");
    const userName = document.createElement("p");
    userName.textContent = userNameString;
    memberInfos.classList.add("room-member-user-info");
    userImg.id = peerId + "-img";
    memberInfos.appendChild(userImg);
    memberInfos.appendChild(userName);

    const memberVolume = document.createElement("div");
    memberVolume.style.display = "none";
    const volumeImg = document.createElement("img");
    volumeImg.src = "volume.png";
    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    memberVolume.classList.add("room-member-volume-container");
    memberVolume.appendChild(volumeImg);
    memberVolume.appendChild(volumeSlider);

    memberInfos.onclick = () => {
      if(memberVolume.style.display === "none")memberVolume.style.display = "flex";
      else memberVolume.style.display = "none";
    };

    contentWrapper.appendChild(memberInfos);
    contentWrapper.appendChild(memberVolume);
    return contentWrapper;
  }

  assignImgSrc (peerId, imgUrl) {
    const userImg = document.getElementById(peerId + "-img");
    userImg.src = imgUrl;
  }

  addMembers (peerIds) {
    // peerId := {username}{uuid}
    for (const peerId of peerIds ) {
      const userNameString = peerId.substring(0, peerId.length - 36);
      const userContent = this.createUserContent(userNameString, peerId);
      this.memberlistContainer.appendChild(userContent);
    }
  }

  removeMembers (peerIds) {
    for (const peerId of peerIds ) {
      const memberContentWrapper = document.getElementById(peerId + "-user-content");
      memberContentWrapper.remove();
    }
  }
};