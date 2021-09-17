export default class MemberListManager {
  constructor (memberlistContainer) {
    this.memberlistContainer = memberlistContainer;
  }

  // assign img src lazy
  createUserContent (userNameString, peerId) {
    const contentWrapper = document.createElement("div");
    contentWrapper.id = peerId + "-user-content";
    const userImg = document.createElement("img");
    const userName = document.createElement("p");
    const contentCover = document.createElement("div");

    contentWrapper.classList.add("room-member-content");
    contentCover.classList.add("room-member-content-cover");
    userImg.id = peerId + "-img";

    contentWrapper.appendChild(userImg);
    contentWrapper.appendChild(userName);
    contentWrapper.appendChild(contentCover);
    userName.textContent = userNameString;
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