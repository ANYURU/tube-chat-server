const express = require("express");
require("dotenv").config();
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const PORT = process.env.PORT || 3001;

app.use(cors());

/* 
 Socket io works using events in a way that you can either create or emit an event and listen to an event.
*/

const server = http.createServer(app);

const allowedOrigins = [
  "https://tube.ablestate.africa",
  "https://tube-omega.vercel.app",
  "https://tube-gamma.vercel.app",
  "http://localhost:3000"
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      console.log("DEVELOPMENT: " ,process.env.DEVELOPMENT);
      console.log("ORIGIN: ", origin);

      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log("ORIGIN ALLOWED: ", origin);
        return callback(null, true);
      } else {
        console.log("ORIGIN NOT ALLOWED: ", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  socket.join(username);

  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

io.on("connection", (socket) => {
  const users = [];

  for (let [, username] of io.of("/").sockets) {
    users.push(username.username);
  }

  io.of("/").emit("online_users", users);

  socket.on("check_online", (data) => {
    socket.to(data).emit("online_users", users);
  });

  socket.on("send_message", (data) => {
    socket.to(data.receiver_id).emit("receive_message", data);
  });

  socket.on("send_typing_status", (data) => {
    console.log(data);
    socket.to(data.receiver_id).emit("receive_typing_status", data);
  });

  socket.on("logout", (data) => {
    const index = users.indexOf(data);
    if (index > -1) users.splice(index, 1);
    io.of("/").in(data).local.disconnectSockets();
    socket.broadcast.emit("user_disconnected", users);
    console.log(`${data} is now offline`);
    console.log("current online users: ", users);
  });
});

server.listen(PORT, () => {
  console.log(`server is running at port ${PORT}`);
});

