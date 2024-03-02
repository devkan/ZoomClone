const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;

/** @type {RTCPeerConnection} */ // 이렇게 지정하면 vscode에서 자동완성이 된다.
let myPeerconnection;
let myDataChannel;


// 해당 기기의 카메리 리스트 정보를 가져오는 함수
async function getCameras(){
	try{
		const devices = await navigator.mediaDevices.enumerateDevices(); // enumerateDevices는 모든 장치를 가져옴
		//console.log(devices);
		//https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices 참조

		const cameras = devices.filter((device) => device.kind === "videoinput"); // videoinput인 장비정비만 가져옴
		//console.log(cameras);

		const currentCamera = myStream.getVideoTracks()[0]; // 현재 사용중인 카메라를 가져옴

		cameras.forEach((camera) => {
			const option = document.createElement("option");
			option.value = camera.deviceId;
			option.innerText = camera.label;

			if(currentCamera.label === camera.label) {
				option.selected = true;
			}
			// select에서 현재 카메라의 옵션을 가져오게 된다.
			
			camerasSelect.appendChild(option);
		});
	} catch(e) {
		console.log(e);
	}
}

async function getMedia(deviceId) {
	const initialConstrains = {
		audio: true,
		video: { facingMode: "user" },
	};

	const cameraConstraints = {
		audio: true,
		video: { deviceId: { exact: deviceId } },
	};

	try{
		myStream = await navigator.mediaDevices.getUserMedia(
			deviceId ? cameraConstraints : initialConstrains,
			// deviceId가 있다면 cameraConstraints를 사용해 deviceId를 사용하고 없으면 셀카모드로 사용하겠다는 것임
			{
				//audio: true,
				//video: true,
				//video: { width: 1280, height: 720 },
				// video: { facingMode: "user" }, // 전면 카메라를 사용하겠다는 것임
				// video: { facingMode: { exact: "environment" }, }, // 후면 카메라를 사용하겠다는 것임
				// video: { facingMode: "environment" }, // 이것도 후면이라고 하는데, 체크못함			
			}
		);

		//console.log(myStream);
		myFace.srcObject = myStream; // mySteam을 myFace에 넣어줌. 이렇게 하면 내 화면이 나옴

		if(!deviceId) {
			await getCameras(); // 비동기식이라서 await을 써줘야 함
		}
		// deviceId가 없을때 한번만 실행시, device정보를 다 잡아온다.
	} catch (e) {
		console.log(e);
	}
}
// getUserMedia 사용법은 아래 링크를 참조하자
// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia 참조

//getMedia(); // 카메라 실행 함수


function handleMuteClick() {
	//console.log(myStream.getAudioTracks()); // audio track을 가져옴
	myStream.getAudioTracks().forEach((track) => {
		//console.log(track.enabled);
		track.enabled = !track.enabled; // track을 enable, disable함
		// track의 반대되는 값을 다시 자신한테 넣어주라는 것임
	});

	if(!muted) {
		muted = true;
		muteBtn.innerText = "Unmute";
	} else {
		muted = false;
		muteBtn.innerText = "Mute";
	}
}

function handleCameraClick() {
	//console.log(myStream.getVideoTracks());
	myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));

	if(!cameraOff) {
		cameraOff = true;
		cameraBtn.innerText = "Turn Camera On";
	} else {
		cameraOff = false;
		cameraBtn.innerText = "Turn Camera Off";
	}
}

async function handleCameraChange() {
	//console.log(camerasSelect.value); // deviceId를 가져옴
	await getMedia(camerasSelect.value);

	if(myPeerconnection){
		const videoTrack = myStream.getVideoTracks()[0];
		const videoSender = myPeerconnection.getSenders().find((sender) => sender.track.kind === "video"); 
		// 카메라 변경시 새로운 stream을 가져오기 위한 것임

		videoSender.replaceTrack(videoTrack); // videoSender는 다른 브라우저로 보내진 비디오와 오디를 컨트롤 하는 방법임
	}

	/*
	myStream.getVideoTracks().forEach((track) => {
		track.stop();
	});
	const videoConstraints = {
		video: { deviceId: { exact: camerasSelect.value } },
	};
	*/
}

muteBtn.addEventListener("click", () => handleMuteClick());
cameraBtn.addEventListener("click", () => handleCameraClick());
camerasSelect.addEventListener("input", () => handleCameraChange());


/////////////////////////////////
// welcome form (join a room)
/////////////////////////////////

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");


async function initCall(){
	welcome.hidden = true;
	call.hidden = false;
	await getMedia();

	// WebRTC code
	makeconnection();
}
// 비동기식으로 함수를 만들자.


async function handleWelcomeSubmit(event) {
	event.preventDefault();
	const input = welcomeForm.querySelector("input");
	//console.log(input.value);

	//socket.emit("join_room", input.value, initCall); // server.js의 join_room으로 보냄
	// 방에 참가하고 initCall 함수를 실행시켰는데, remoteDesc 오류로 방에 들어가기 전에 initCall 함수를 실행시켜야 한다.

	// remoteDesc 오류로 인해 initCall 함수를 여기로 옮겼다.
	await initCall();
	socket.emit("join_room", input.value); // server.js의 join_room으로 보냄

	roomName = input.value;
	input.value = "";

}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);


/////////////////////////////////
// socket code
/////////////////////////////////

// Peer A에서 작동하는 코드 (offer코드)
socket.on("welcome", async () => {
	//console.log("someone joined");
	// A브라우저가 방을 만들고, B브라우저가 들어오면 A브라우저에 이 메시지가 뜬다.
	// B브라우저가 참여하면 A브라우저에서 실행되는 코드라는 말이다.
	// 그래서 여기서 offer를 만드는 것임

	myDataChannel = myPeerconnection.createDataChannel("chat"); // data channel
	// offer를 만드는 Perr A가 data channel을 만드는 주체임
	// Peer A의 data channel은 여기에 정의하고, Peer B의 data channel은 myDataChannel = event.channel; 이다.
	myDataChannel.addEventListener("message", console.log);
	console.log("made data channel");

	const offer = await myPeerconnection.createOffer();
	//console.log(offer);
	myPeerconnection.setLocalDescription(offer); // offer를 LocalDescription함. A브라우저에서만 일어남
	console.log("sent the offer");
	socket.emit("offer", offer, roomName); // offer를 server를 통해 B브라우저로 보냄. offer send

});
// server.js의 welcome emit을 받음


// Peer B에서 작동하는 코드
socket.on("offer", async (offer) => {
	//console.log(offer);
	myPeerconnection.addEventListener("datachannel", (evnet)=> {
		myDataChannel = event.channel;
		// Peer B의 data channel은 여기에 정의해야 한다.
		
		myDataChannel.addEventListener("message", console.log);
	});

	console.log("received the offer");
	myPeerconnection.setRemoteDescription(offer); // offer를 RemoteDescription함. B브라우저에서만 일어남
	// Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'setRemoteDescription')
	// 이건 websocket의 속도가 media를 가져오거나 연결 하는 속도보다 빨라서 발생하느 오류이다.
	// B브라우저로 offer를 보냈는데, myPeerconnection이 제대로 생성되기 전에 offer를 받아서 발생하는 오류이다.
	// remoteDesc 오류로 지칭하고 수정할 것이다.

	const answer = await myPeerconnection.createAnswer(); // answer 생성
	//console.log(answer);
	myPeerconnection.setLocalDescription(answer); // answer를 LocalDescription함. B브라우저에서만 일어남
	socket.emit("answer", answer, roomName); // offer를 받아서 answer를 생성했으니, 서버를 통해 다시 A브라우저로 보냄. answer send
	console.log("sent the answer");
});

socket.on("answer", (answer) => {
	console.log("received the answer");
	myPeerconnection.setRemoteDescription(answer); // answer를 RemoteDescription함. A브라우저에서만 일어남
	//console.log(answer);
});

socket.on("ice", (ice) => {
	console.log("received candidate");
	myPeerconnection.addIceCandidate(ice); // icecandidate를 받아서 처리하는 것이다.
	//console.log(ice);
});

/////////////////////////////////
// RTC code
/////////////////////////////////

function makeconnection() {
	myPeerconnection = new RTCPeerConnection(
		// 구글의 stun서버 
		iceServers = [
			{
				urls: [
					"stun:stun.l.google.com:19302",
					"stun:stun1.l.google.com:19302",
					"stun:stun2.l.google.com:19302",
					"stun:stun3.l.google.com:19302",
					"stun:stun4.l.google.com:19302",
				],
			},
		]	
	);
	// 1. peer-to-peer connection을 만들어줌

	//console.log(myStream.getTracks()); // audio, video track이 찍힌다.

	myStream.getTracks().forEach((track) => myPeerconnection.addTrack(track, myStream)); // 두 track을 steam에 넣어주는 것이다.
	// 2. 그 다음 양쪽 브라우저에 카메라와 마이크의 데이타 stream을 받아서 connection에 넣어준다.
	// addStream은 더이상 사용되지 않는다. addTrack을 사용하자.

	myPeerconnection.addEventListener("icecandidate", handleIce); // icecandidate를 받아서 처리하는 것이다.

	myPeerconnection.addEventListener("addstream", handleAddStream); // addstream을 받아서 서로의 stream을 가져온다.
}


function handleIce(data) {
	console.log("send candidate");
	//console.log(data);
	socket.emit("ice", data.candidate, roomName); // icecandidate를 서버를 통해서 다른 브라우저로 보내는 것이다.
	//console.log(data.candidate);
}

function handleAddStream(data) {
	console.log("got an stream from my peer");
	console.log("Peer's stream", data.stream);
	console.log("My stream", myStream);

	const peerFace = document.getElementById("peerFace");
	peerFace.srcObject = data.stream; // data.stream을 peersStream에 넣어줌. 이렇게 하면 상대방 화면이 나옴

	//console.log(data);
	//const peerFace = document.getElementById("peerFace");
	//peerFace.srcObject = data.stream; // data.stream을 peerFace에 넣어줌. 이렇게 하면 상대방 화면이 나옴
	//console.log(data.stream);
}

/*
다른 코드 참조용
function makeconnection() {
	const peerConnection = new RTCPeerConnection();
	//console.log(myStream);
	myStream.getTracks().forEach((track) => peerConnection.addTrack(track, myStream));
	// peerConnection에 myStream을 넣어줌

	peerConnection.createOffer().then((offer) => peerConnection.setLocalDescription(offer));
	// offer를 생성하고 setLocalDescription으로 offer를 내 컴퓨터에 저장함
	// offer는 내 컴퓨터에서 다른 컴퓨터로 보내는 것임
	// 이것을 다른 컴퓨터에서 받아서 setRemoteDescription으로 저장함
	// 그리고 다른 컴퓨터에서 createAnswer를 하고 setLocalDescription으로 저장함
	// 그리고 다시 내 컴퓨터에서 setRemoteDescription으로 저장함
	// 이렇게 하면 두 컴퓨터가 서로 연결이 됨

	peerConnection.onicecandidate = (data) => {
		//console.log("got ice candidate");
		//console.log("send this ice candidate to the other peer");
		socket.emit("ice", data.candidate, roomName);
	};
	// icecandidate는 두 컴퓨터가 서로 연결이 될때 서로 주고받는 정보임
	// 이것을 서버를 통해서 주고받음

	socket.on("ice", (data) => {
		//console.log("received ice candidate");
		//console.log("add this ice candidate to the other peer");
		peerConnection.addIceCandidate(data);
	});
	// 이렇게 하면 두 컴퓨터가 서로 연결이 됨
}
*/