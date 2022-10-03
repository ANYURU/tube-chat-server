const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors  = require("cors");

app.use(cors());

/* 
 Socket io works using events in a way that you can either create or emit an event and listen to an event.
*/

let online_users = []

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    },
});

io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    socket.join(username)
    
    if (!username) {
      return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});

io.on("connection", (socket) => {
    const users = []

    for (let [ id, username] of io.of("/").sockets) {
        users.push(username.username)
    }
    
    io.of("/").emit("online_users", users)

    socket.on("check_online", (data) => {
        socket.to(data).emit("online_users", users)
    })

    socket.on("send_message", ((data) => {
        socket.to(data.receiver_id).emit("receive_message", data)
    }))

    socket.on("send_typing_status", (data) => {
        console.log(data)
        socket.to(data.receiver_id).emit("receive_typing_status", data)
    })
    
    socket.on("logout", (data) => {
        const index = users.indexOf(data)
        if (index > -1) users.splice(index, 1)
        io.of("/").in(data).local.disconnectSockets();
        socket.broadcast.emit("user_disconnected", users)
        console.log(`${data} is now offline`)
        console.log("current online users: ", users)
    })
    
})

app.get("/", (request, response) => {
    response.send("hello world")
})

const port = 3001;

server.listen(3001, () => {
    console.log(`server is running at port ${port}`)
} )