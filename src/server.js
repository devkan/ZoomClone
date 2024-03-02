import http from 'http'; // node.js에 기본적으로 내장되어 있는 모듈
import express from 'express';
import SocketIO from 'socket.io';

const app = express();
app.set('view engine', 'pug');
app.set('views', __dirname + "/views"); // src/views로 하면 오류남. 경로지정이 이상한 것음
app.use("/public", express.static(__dirname + "/public")); // 이걸로 public 폴더를 static하게 만들어줌

app.get("/", (_,res) => res.render("home"));
app.get("/*", (_,res) => res.redirect("/")); // 모든 경로를 home으로 리다이렉트
// 홈만 사용하고 다른 곳으로 접근읆 막기 위함

const handleListen = () => console.log(`Listening on http://localhost:3000/`);
//app.listen(3000, handleListen);

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer); // 이렇게 하면 express 서버와 socket.io 서버를 하나로 만들 수 있음

wsServer.on("connection", (socket) => {
	socket.on("join_room", (roomName) => { // app.js의 join_room emit을 받음
		socket.join(roomName);
		//done(); // initCall 함수를 실행시킴
		// remoteDesc 오류로 방 들어가기 전에 initCall를 호출해서 여기서는 callback함수가 필요없게 되었다.

		socket.to(roomName).emit("welcome"); // app.js의 welcome으로 보냄
	});

	socket.on("offer", (offer, roomName) => {
		socket.to(roomName).emit("offer", offer);
	});
	// A브라우저에게 만든 offer를 받아서 B브라우저로 보내기 위해서 다시 emit함

	socket.on("answer", (answer, roomName) => {
		socket.to(roomName).emit("answer", answer);
	});

	socket.on("ice", (ice, roomName) => {
		socket.to(roomName).emit("ice", ice);
	});
});

httpServer.listen(3000, handleListen);
