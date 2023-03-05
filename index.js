require('dotenv').config();
console.log(process.env.HARPERDB_URL); // remove this after you've confirmed it working
const harperSaveMessage = require('./services/harper-save-message');
const harperGetMessages = require('./services/harper-get-messages');
const express = require('express');
const harperSaveMessage = require('./services/harper-save-message.js'); // Add this
const app = express();
http = require('http');
const cors = require('cors');
const { Server } = require('socket.io'); // Add this

app.use(cors()); // Add cors middleware

const server = http.createServer(app); // Add this

// Add this
// Create an io server and allow for CORS from http://localhost:3000 with GET and POST methods
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

const CHAT_BOT = 'ChatBot';
let chatRoom = ''; // E.g. javascript, node,...
let allUsers = []; // All users in current chat room
// Listen for when the client connects via socket.io-client
io.on('connection', (socket) => {
    console.log(`User connected ${socket.id}`);
    // We can write our socket event listeners in here...
    socket.on('join_room', (data) => {
        const { username, room } = data;
        socket.join(room);
        let __createdtime__ = Date.now(); // Current timestamp
        // Send message to all users currently in the room, apart from the user that just joined
        socket.to(room).emit('receive_message', {
            message: `${username} has joined the chat room`,
            username: CHAT_BOT,
            __createdtime__,

        });
        // Send welcome msg to user that just joined chat only
        socket.emit('receive_message', {
            message: `Welcome ${username}`,
            username: CHAT_BOT,
            __createdtime__,
        });
        chatRoom = room;
        allUsers.push({ id: socket.id, username, room });
        chatRoomUsers = allUsers.filter((user) => user.room === room);
        socket.to(room).emit('chatroom_users', chatRoomUsers);
        socket.emit('chatroom_users', chatRoomUsers);
        harperGetMessages(room)
        .then((last100Messages) => {
          // console.log('latest messages', last100Messages);
          socket.emit('last_100_messages', last100Messages);
        })
        .catch((err) => console.log(err));
    });
    socket.on('send_message', (data) => {
        const { message, username, room, __createdtime__ } = data;
        io.in(room).emit('receive_message', data); // Send to all users in room, including sender
        harperSaveMessage(message, username, room, __createdtime__) // Save message in db
          .then((response) => console.log(response))
          .catch((err) => console.log(err));
      });
});

server.listen(4000, () => 'Server is running on port 3000');