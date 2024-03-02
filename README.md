
# Zoom Clone Project

## Introduction
This project is a Zoom Clone that aims to replicate the basic functionalities of Zoom. It provides real-time video conferencing and chat features, built on Node.js and Express. The project begins with implementing real-time communication using WebSocket, followed by WebRTC for direct peer-to-peer communication, and finally integrates 1:1 video calls and chat functionality using socket.io.

## Technology Stack
- **Backend:** Node.js, Express
- **Real-time Communication:** WebSocket, WebRTC, Socket.io

## Installation
Follow these steps to run the project locally.

1. Clone the project:
```bash
git clone https://github.com/devkan/ZoomClone.git
```

2. Install dependencies:
```bash
cd ZoomClone
npm install
```

3. Start the server:
```bash
npm run dev
```
Once the server is up, you can access the project at `http://localhost:3000` by default.

## Features
- **1:1 Video Calls:** Real-time 1:1 video calling feature between users.
- **Real-time Chat:** Ability to exchange messages in real-time during a video call.
- **Real-time Data Streaming with WebRTC:** High-quality audio and video streaming.
- **WebSocket and Socket.io Communication:** Efficient real-time messaging and communication.

## Developer Guide
### Basic Setup with WebSocket
Use WebSocket to establish a bi-directional communication channel between the server and the client. This enables the implementation of real-time chat functionality.

### Implementing Video Calls with WebRTC
Utilize WebRTC to facilitate direct peer connections for exchanging real-time video and audio data between browsers.

### Enhanced Features with Socket.io
Implement more reliable real-time communication using socket.io, offering 1:1 video call and chat functionalities between users.

## Contributing
If you would like to contribute to this project, please feel free to submit an issue or pull request. Suggestions for improvements or new features are always welcome.

## License
This project is licensed under the MIT License. For more details, see the `LICENSE` file.
