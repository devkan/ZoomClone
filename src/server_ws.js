import http from 'http'; // node.js에 기본적으로 내장되어 있는 모듈
import WebSocket from 'ws';
import express from 'express';

// websocket 방식으로 처리하는 형태
// socket.io를 사용하면서 사용하지 않게 된 코드들이다.
const app = express();
app.set('view engine', 'pug');
app.set('views', __dirname + "/views"); // src/views로 하면 오류남. 경로지정이 이상한 것음
app.use("/public", express.static(__dirname + "/public")); // 이걸로 public 폴더를 static하게 만들어줌

app.get("/", (_,res) => res.render("home"));
// express는 views를 설정하고, render를 해 주는게 다임
// 나머지는 websocket에서 실시간으로 다 처리할 것임
// req가 없을때는 _로 대체함

app.get("/*", (_,res) => res.redirect("/")); // 모든 경로를 home으로 리다이렉트
// 홈만 사용하고 다른 곳으로 접근읆 막기 위함

const handleListen = () => console.log(`Listening on http://localhost:3000/`);
//app.listen(3000, handleListen);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
// 웹소켓 서버를 만들고, 이 서버를 http서버에 연결함
// 즉, httpd서버와 websocket서버를 동시에 열어줌. http를 사용하지 않을때는 이렇게 안해도 되며,
// 여기서는 두개를 같이 사용하기 위해서 이처럼 구성한 것임


//function handelConnection(socket){
//	console.log(socket);
//}
//wss.on("connection", handelConnection);

function onSocketClose(){
	console.log("Disconnected from the Browser");
}

function onSocketMessage(message){
	console.log(message.toString("utf8"));
}


const sockets = [];

wss.on("connection", (socket) => {
	sockets.push(socket);
	// sockets에 연결된 모든 socket을 저장한다.
	socket["nickname"] = "Anon"; // 닉네임을 지정하는 경우 이것으로 할당한다.

	//console.log(socket);
	console.log("Connected to Browser");
	// connect가 되면 로그가 찍히게 된다.

	//socket.send("hello!!!");
	// connect가 되면 메세지를 send하게 된다.

	//socket.on("close", () => console.log("Disconnected from the Browser"));
	socket.on("close", onSocketClose);
	// connect되었다가, 브라우저가 닫히거나 다른곳으로 이동이 되면 close되면서 로그가 찍히게 된다.
	// fuction으로 지정해 사용해도 되고, 바로 사용해도 된다.

	//socket.on("message", onSocketMessage);
	socket.on("message", (message)=>{
		//console.log(message.toString("utf8"));
		// message는 buffer형태로 오기 때문에 toString()이나 toString("utf8")으로 변환해줘야 한다.
		// 아니면 <Buffer 68 65 6c 6c 6f 20 66 72 6f 6d 20 74 68 65 20 62 72 6f 77 73 65 72 21> 이런식으로 나온다.

		//socket.send(message.toString("utf8"));
		// 서버로 전달된 메세지를 다시 프론트단으로 보낸다. 그래야 다른 사람도 메세지를 볼수 있게 된다.

		
		// json형태로 들어가는 message를 parse해서 사용한다.
		//console.log(JSON.parse(message));
		const parsed = JSON.parse(message);

		switch(parsed.type){
			case "new_message": 
				sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${parsed.payload.toString("utf8")}`));
				break;
			case "nickname": 
				//console.log(parsed.payload);
				socket["nickname"] = parsed.payload; // socket에 nickname을 추가한다.
				break;
		}
		/*
		if(parsed.type === "new_message"){
			sockets.forEach(aSocket => aSocket.send(parsed.payload.toString("utf8")));
		}else if(parsed.type === "nickname"){
			console.log(parsed.payload);
		}*/

		//sockets.forEach(aSocket => aSocket.send(message.toString("utf8")));
		// sockets에 연결된 모든 socket에게 메세지를 보낸다.
		// foreach로 돌려서 하나씩 보내게 되는 것이다.
	})
});

server.listen(3000, handleListen);
// 이렇게 구성하면 http서버 위에 websocket서버를 올라갈수 있는 것이고,
// ws://localhost:3000/ 이런식으로 접근할 수 있는 것임. 브라우저에서는 접근을 할수 없다. 
