const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');

let io;

const allowedSocketOrigins = [
    'https://go-poola.vercel.app',
    'https://go-poola-p5y8fnc79-becomefaisals-projects.vercel.app',
    'https://go-poola-pnuw07bhv-becomefaisals-projects.vercel.app',
    /.+\.vercel\.app$/
];

function originAllowed(origin) {
    if (!origin) return true;
    return allowedSocketOrigins.some(allowed => {
        if (typeof allowed === 'string') {
            return allowed === origin;
        }
        if (allowed instanceof RegExp) {
            return allowed.test(origin);
        }
        return false;
    });
}

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) {
                    return callback(null, true);
                }
                if (originAllowed(origin)) {
                    return callback(null, true);
                }
                console.warn(`Socket.IO denied origin: ${origin}`);
                return callback(new Error('Socket.IO origin denied'));
            },
            methods: [ 'GET', 'POST' ],
            credentials: true
        },
        transports: ['websocket']
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);


        socket.on('join', async (data) => {
            const { userId, userType } = data;

            if (userType === 'user') {
                await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
            } else if (userType === 'captain') {
                await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
            }
        });


        socket.on('update-location-captain', async (data) => {
            const { userId, location } = data;

            if (!location || !location.ltd || !location.lng) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            await captainModel.findByIdAndUpdate(userId, {
                location: {
                    type: 'Point',
                    coordinates: [location.lng, location.ltd]  // [longitude, latitude]
                }
            });

            console.log(`Captain ${userId} location updated: [${location.lng}, ${location.ltd}]`);
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {

console.log(messageObject);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };