const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages.js');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname,'/../public')));

app.get('/', (req, res) => {
    res.render('index');    
});


io.on('connection', (socket) => {
    console.log('New Websocket connection established');

    socket.on('join', (options, callback) => {

        const {error, user} = addUser({ id: socket.id, ...options });
        if (error) {
            return callback(error);
        }


        socket.join(user.room);

        socket.emit('message', generateMessage("Admin", "Welcome!"));
        socket.broadcast.to(user.room).emit('message', generateMessage("Admin", `${user.username} has joined!!`));
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    });

    socket.on('sendMessage', (msg, callback) => {

        const user = getUser(socket.id);

        const filter = new Filter();
        if (filter.isProfane(msg)){
            return callback("Profanity is not allowed");
        }
        io.to(user.room).emit('message', generateMessage(user.username, msg)); 
        callback();
    });

    socket.on('disconnect', () => {

        const user = removeUser(socket.id);
        if (user){
            io.to(user.room).emit('message', generateMessage("Admin", `${user.username} has left!`));
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    });

    socket.on('sendLocation', (coords, callback) => {
        
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    })
})

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// console.log(__dirname + '/../public');