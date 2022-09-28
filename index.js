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

io.on("connection", (socket) => {
    // console.log(`User connected: ${socket.id}`)
    const sender_id = socket.handshake.query.id
    socket.join( sender_id )
    online_users.push(sender_id)

    socket.on("send_message", ((data) => {
        socket.to(data.receiver_id).emit("receive_message", data)
    }))

    socket.on("send_typing_status", (data) => {
        socket.to(data.receiver_id).emit("receive_typing_status", data)
        console.log(`User ${data.receiver_name} is ${data.typing_status ? "typing" : "not typing"}`)
    })

    socket.on("add_online_user", (data) => {
        console.log(data)
        // modify the online users array.
        const new_online_users = new Set([...online_users, data.sender_id])
        online_users = [...new_online_users]
        console.log([...new_online_users])
        socket.broadcast.emit("receive_online_users", online_users)
    })

    
})

const port = 3001;

server.listen(3001, () => {
    console.log(`server is running at port ${port}`)
} )