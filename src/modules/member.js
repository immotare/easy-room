export default class MemberListManager {
  constructor (memberlistContainer, volumeSliderListener) {
    this.memberlistContainer = memberlistContainer;
    this.volumeSliderListener = volumeSliderListener;
  }

  // assign img src lazy
  createUserContent (userNameString, peerId) {
    const contentWrapper = document.createElement("div");
    contentWrapper.id = peerId + "-user-content";
    contentWrapper.classList.add("room-member-content");

    const memberInfo = document.createElement("div");
    const userImg = document.createElement("img");
    const userName = document.createElement("p");
    userName.textContent = userNameString;
    memberInfo.classList.add("room-member-user-info");
    userImg.id = peerId + "-img";
    memberInfo.appendChild(userImg);
    memberInfo.appendChild(userName);

    const memberVolume = document.createElement("div");
    memberVolume.style.display = "none";
    const volumeImg = document.createElement("img");
    volumeImg.src = "assets/volume.png";
    const volumeSlider = document.createElement("input");
    // add member peerId as custom data
    volumeSlider.dataset.peerId = peerId;
    volumeSlider.type = "range";
    volumeSlider.min = "0";
    volumeSlider.max = "2";
    volumeSlider.step = "0.01";
    volumeSlider.value = "1";
    volumeSlider.addEventListener("change", this.volumeSliderListener);
    memberVolume.classList.add("room-member-volume-container");
    memberVolume.appendChild(volumeImg);
    memberVolume.appendChild(volumeSlider);

    memberInfo.onclick = () => {
      if(memberVolume.style.display === "none")memberVolume.style.display = "flex";
      else memberVolume.style.display = "none";
    };

    contentWrapper.appendChild(memberInfo);
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