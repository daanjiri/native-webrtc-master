
require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const rooms = {};
const socketToRoom={};

io.on("connection", socket => {
    socket.on("join room", roomID => {
        if (rooms[roomID]) {
            rooms[roomID].push(socket.id);
        } else {
            rooms[roomID] = [socket.id];
        }
        socketToRoom[socket.id]=roomID
        const otherUser = rooms[roomID].find(id => id !== socket.id);
        if (otherUser) {
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
        }
        console.log()
    });

    socket.on("offer", payload => {
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", payload => {
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", incoming => {
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });

    socket.on('disconnect',()=>{
        
        console.log('usuario desconectado')
       /*  socket.broadcast.to(rooms[socket.id]).emit('user disconnected'); */
        const roomID=socketToRoom[socket.id]
        console.log(roomID)
        let room = rooms[roomID]
        if(room){
            room = room.filter(id=>id!== socket.id)
            rooms[roomID]=room
        }
        console.log(room,'ids')
        socket.broadcast.emit('user left',socket.id)
    })
});

if(process.env.PROD){
    app.use(express.static(path.join(__dirname,'./client/build')));
    app.get('*',(req,res)=>{
        res.sendFile(path.join(__dirname,'./client/build/index.html'));
    });
 }
 
const port = process.env.PORT || 8000

server.listen(port, () => console.log(`server is running on port ${port}`));
