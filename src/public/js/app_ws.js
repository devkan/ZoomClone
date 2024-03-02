// websocket용 app.js 파일

const socket = new WebSocket(`ws://${window.location.host}`);
// window.location.host는 js에서 알아서 현재 주소를 가져오게 하는 것임
// ${}는 js에서 변수를 사용할때 사용하는 것임. $가 붙어야 한다.
// 여기의 socket은 server.js의 socket가 다른 것으로 다른 변수를 사용해도 됨.
// 사이트가 https로 시작하면 wss로 바꿔야 한다. 중요..

const messageList = document.querySelector("ul"); // home.pug에 있는 ul을 가져옴
const messageForm = document.querySelector("#message"); // home.pug에 있는 form을 가져옴
const nickForm = document.querySelector("#nick"); // home.pug에 있는 form을 가져옴

function handleOpen(){
	console.log("Connected to Server");
}

socket.addEventListener("open", handleOpen);
// ws에 연결이 되면 작동하는 리스너. ws connection때 발생하는 이벤트임
// 여기서도 function을 사용해도 되고, 바로 사용해도 된다.

socket.addEventListener("message", (message) => {
	//console.log("New message: ", message.data);

	const li = document.createElement("li");
	li.innerText = message.data;
	messageList.append(li);
});
// ws에서 send로 메세지를 보내면 작동하는 리스너.

socket.addEventListener("close", ()=>{
	console.log("Disconnected from Server");
});

function handleSubmit(event){
	event.preventDefault();
	const input = messageForm.querySelector("input");
	//console.log(input.value);
	socket.send(makeMessage("new_message", input.value));
	input.value = ""; // backend로 메세지 전달후 input폼 초기화
}

function handleNickSubmit(event){
	event.preventDefault();
	const input = nickForm.querySelector("input");
	//socket.send(`nickname: ${input.value}`);

	//socket.send(input.value);
	// string형으로 데이타를 전달하면 모두에게 그냥 전달되는 형태라서 json형태로 변경해서 message타입을 구분하려고 한다.
	socket.send(makeMessage("nickname", input.value));
	input.value = ""; // backend로 메세지 전달후 input폼 초기화
}

// 메세지 타입 구분을 위해서 json 형태로 바꿔주는 함수
function makeMessage(type, payload){
	const msg = {type, payload};
	return JSON.stringify(msg);
}


messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);

/*
setTimeout(()=>{
	socket.send("hello from the browser!");
}, 5000);
// 5초후 server로 메세지 전송
*/

// ws에서 연결이 종료되면 발생하는 리스너


//const socket = new WebSocket("http://localhost:3000");
/*
사용하는 예시임..

function fn(event){

}

form.addEventListener("submit", fn);
btn.addEventListener("click", fn);
// btn에 listener를 만들고, click이벤트 발생시 fn이라는 함수를 호출하는 구조이다.
*/