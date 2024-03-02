const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

const room = document.getElementById("room");

room.hidden = true; // room을 숨겨놓는다.
let roomName;

function backendDone(msg){
	console.log("backend say:", msg);
}

function showRoom(newCount){
	welcome.hidden = true;
	room.hidden = false;

	const h3 = room.querySelector("h3");
	h3.innerText = `Room: ${roomName} (${newCount})`;

	const msgForm = room.querySelector("#msg");
	const nameForm = room.querySelector("#name");
	msgForm.addEventListener("submit", handleMessageSubmit);
	nameForm.addEventListener("submit", handleNameSubmit);
}

function addMessage(message){
	const ul = room.querySelector("ul");
	const li = document.createElement("li");
	li.innerText = message;
	ul.appendChild(li);
}



function handleNameSubmit(event){
	event.preventDefault();
	const input = room.querySelector("#name input");
	socket.emit("nickname", input.value);
}

function handleMessageSubmit(event){
	event.preventDefault();
	const input = room.querySelector("#msg input");
	const value = input.value; // input.value를 미리 저장해놓는다.
	// emit이 비동기로 작동하기 때문에, input.value를 미리 저장해놓지 않으면, input.value가 지워져서 "You: " 이렇게 출력된다.
	// email이 비동기로 실행이 되는 동안, 44라인의 input.value=""이 먼저 실행이 되면서 addMessage에 데이타가 제대로 전달이 안되게 됨.

	socket.emit("new_message", input.value, roomName, () => {
		addMessage(`You: ${value}`);
	});
	input.value = "";
}

function handleRoomSubmit(event){
	event.preventDefault();
	const input = form.querySelector("input");
	//socket.emit("enter_room", {payload:input.value}, 3, ()=> console.log("server is done!"));
	// emit('이벤트명, {object}, callback함수')로 사용이 된다.
	// 어떤 이름(enter_room)이든, 특정한 event를 emit해 줄수 있다. 그럼 server.js에서 socket.on("enter_room",...) 이렇게 받을수 있다.
	// emit은 object를 전송할 수 있다. ws에서는 string으로만 전송이 가능하다.
	// ws에서 socket.send(makeMessage("new_message", input.value)); 어렇게 전송하던 것이였다.

	socket.emit("enter_room", input.value, showRoom);
	roomName = input.value;

	input.value = "";
};

form.addEventListener("submit", handleRoomSubmit);



socket.on("welcome", (name, newCount) => {
	const h3 = room.querySelector("h3");
	h3.innerText = `Room: ${roomName} (${newCount})`;

	addMessage(`${name} joined!`);
});
// server.js에서 socket.to(roomName).emit("welcome"); 이렇게 보낸 이벤트를 받는다.
// welcome은 이벤트명으로 지정한 것으로 server.js에 동일해야 한다.

socket.on("bye", (name, newCount) => {
	const h3 = room.querySelector("h3");
	h3.innerText = `Room: ${roomName} (${newCount})`;

	addMessage(`${name} left..`);
});

socket.on("new_message", addMessage);
// socket.on("new_message", (msg)=> {addMessage(msg)}); 위 코드는 이거야 같다.
// msg로 받아서 다시 addMessage의 msg에 넘겨주는데, 위처럼 addMessage로 함수만 호출해도 된다고 한다.
// server.js에서 socket.to(room).emit("new_message", msg); 를 받는 것임.

socket.on("room_change", (rooms) => {
	const roomList = welcome.querySelector("ul");
	roomList.innerHTML = "";
	if(rooms.length === 0){
		return;
	}

	rooms.forEach(room => {
		const li = document.createElement("li");
		li.innerText = room;
		roomList.appendChild(li);
	});
});
// socket.on("room_change", (msg)=> {console.log(msg)}); 위 코드는 이거야 같다.
// server.js에서 wsServer.sockets.emit("room_change", publicRooms()); 를 받는 것임.