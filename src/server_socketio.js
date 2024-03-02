import http from 'http'; // node.js에 기본적으로 내장되어 있는 모듈
import express from 'express';

//import SocketIO from 'socket.io';
const { Server } = require("socket.io"); // admin-ui용으로 변경함
const { instrument } = require("@socket.io/admin-ui"); // admin-ui를 사용하기 위한 것임

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

const httpServer = http.createServer(app);
// const wsServer = SocketIO(httpServer); // admin-ui 사용을 위한 주석처리함
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true
  }
});
// wsServer가 api 문서에 있는 io랑 같다..(혼동하지 말자.)

instrument(wsServer, {
  auth: false, // 실 사용시 auth를 true로 해야 한다.
  mode: "development",
});
// admin-ui를 사용하기 위한 것임
/*
instrument(io, {
  auth: {
    type: "basic",
    username: "admin",
    password: "$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS" // "changeit" encrypted with bcrypt
  },
});
*/

function publicRooms() {
	const { sockets: {adapter: {rooms, sids}}} = wsServer;
	// sockets안에서 adapter를 가져오고, 그 안의 rooms와 sids를 가져오는 것이다. wsServer에서..
	// 아니면 아래처럼 직접 하나씩 기재를 해도 된다.
	//const rooms = wsServer.sockets.adapter.rooms;
	//const sids = wsServer.sockets.adapter.sids;

	// const { rooms, sids } = wsServer.sockets.adapter; // 이렇게도 가능

	const publicRooms = [];
	rooms.forEach((_, key) => {
		if(sids.get(key) === undefined){
			publicRooms.push(key);
		}
	});
	// Map.forEach() 구문에서 첫 번째 parameter가 value, 두번째가 key이다.

	return publicRooms;
}

// wsServer.sockets.adapter.rooms.get(roomName)는 방의 사람수를 반환한다.
function countRoom(roomName){
	return wsServer.sockets.adapter.rooms.get(roomName)?.size;
	// roomName에 해당하는 방이 없으면 undefined가 나오게 된다.
	// 그래서 ?를 사용해서 undefined가 나오면, undefined를 반환하게 한다.
	// 그래서 roomName에 해당하는 방이 있으면, 그 방의 사람수를 반환하게 된다.
	// 풀어서 쓰면.. 아래와 같고, Optional chaining 이라고 한다.
	/*
	if(wsServer.sockets.adapter.rooms.get(roomName)){
		return wsServer.sockets.adapter.rooms.get(roomName).size
	} else {
		return undefined;
	}
	*/
}


wsServer.on("connection", (socket) => {
	//console.log(socket);
	
	//wsServer.socketsJoin("announcement"); // announcement라는 방에 모든 유저가 들어가게 됨
	//console.log(wsServer.sockets.adapter);

	socket["nickname"] = "Anon";
	wsServer.sockets.emit("room_change", publicRooms());
	// 처음 들어왔을때도 방이 존재하거나 있을때는 알려준다.


	socket.onAny((event) => {
		console.log(`Socket Event: ${event}`); // result: Socket Event: enter_room
	});
	socket.on("enter_room", (roomName, done) => {
		//console.log(socket.id); 결과 : fMI9bqOOmELYiFjjAAAD
		//console.log(socket.rooms); 결과 : Set(1) { 'fMI9bqOOmELYiFjjAAAD' }

		socket.join(roomName);
		//console.log(socket.rooms); // 결과: Set(2) { 'fMI9bqOOmELYiFjjAAAD', 'kanroom' }
		done(countRoom(roomName)); // app.js의 callback함수를 실행시키는 것. showRoom()이 실행됨

		socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName)); 
		// socket.to는 그방 모든 유저에게 메세지 보냄
		// welcome은 이벤트명으로 app.js에서도 동일하게 받아야 한다.
		// app.js에서 socket.on("welcome",...) 받게 된다.
		// socket.nickname은 socket["nickname"]에서 저장된 이름을 가져다 쓰는 것이다.


		wsServer.sockets.emit("room_change", publicRooms());
		// wsServer.sockets.emit은 모든 유저에게 보내것으로, socket.to.emit이랑 틀리다.
		// 방이 새로이 생겼다고 알려주는 것이다.


		socket.on("disconnecting", () => { // 유저가서버와 연결이 끊어지기 전에 굿바이를 보냄
			socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
			// socket.nickname은 socket["nickname"]에서 저장된 이름을 가져다 쓰는 것이다.
			// countRoom(room) - 1은 아직 연결이 끊어지지 않아서 그 방이 카운트 되게 때문에 -1을 해 주는 것이다.
		});

		socket.on("disconnect", () => {
			wsServer.sockets.emit("room_change", publicRooms());
			// 방이 없어졌을때도, 전체 알림이 가게 한다.
			// disconnecting에 이 emit를 넣어도, 제대로 작동하는 않는다. 왜냐면, 방이 없어지기 전에 실행되기 때문이다.
			// 그래서 없어지고 난뒤에 실행되는 disconnect에 넣어야 한다.
		});

		socket.on("new_message", (msg, room, done) => {
			socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
			//socket.nickname은 socket["nickname"]에서 저장된 이름을 가져다 쓰는 것이다.

			done(); // app.js의 callback함수를 실행시키는 것. addMessage()가 실행됨
		});

		socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
	});

	// socket.on에서는 app.js에서 emit으로 보낸 이벤트를 받는다.
	// emit에서 보낸 object는 msg로 받고, callback함수는 done으로 받는다.
	// 그래서 3초후에 done()을 실행하게 하면, app.js에서 callback함수가 실행되어, "server is done!"


});

httpServer.listen(3000, handleListen);
