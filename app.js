const path = require('path');
const express = require('express');

const http = require('http')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')
const app = express();
const server = http.createServer(app)

const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot;'

io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        // console.log('New WS Connection...');

        //send message to single user
        socket.emit('message', formatMessage(botName, 'welcome to chatcord'))

        //send to all clients except the one connecting
        socket.broadcast
            .to(user.room)
            .emit(
                'message',
                formatMessage(botName, `${user.username} has joined the chat`)
            );

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });



    //wait for chat message and emit it to user
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //send message when a user disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username} has left the chat`)
            );
            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        };
    });

    //all clients in general 
    //io.emit
});

const PORT = 3000 || process.env.PORT;


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});
