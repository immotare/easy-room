class MemberListManager {
    constructor (memberlistElementId) {
        this.memberlistElement = document.getElementById(memberlistElementId);
    }

    addMembers (peerIds) {
        // peerId := {username}{uuid}
        for (const peerId of peerIds ) {
            const userName = peerId.substring(0, peerId.length - 36);
            const memberElment = document.createElement("li");
            memberElment.id = peerId;
            memberElment.textContent = peerId;
            this.memberlistElement.appendChild(memberElment);
        }
    }

    removeMembers (peerIds) {
        for (const peerId of peerIds ) {
            const memberElement = document.getElementById(peerId);
            memberElement.remove();
        }
    }
}

export { MemberListManager };