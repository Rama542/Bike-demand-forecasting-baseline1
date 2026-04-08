const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });

        // Simulating clients joining a specific station channel for targeted updates (optional)
        socket.on('join_station', (stationId) => {
            socket.join(`station_${stationId}`);
            console.log(`Socket ${socket.id} joined station_${stationId}`);
        });
    });

    return io;
};

// Expose a helper to easily trigger events from API routes or other services
const getIo = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized');
    }
    return io;
};

// We will use this to broadcast when ML Service/Simulation script sends newly updated data
const broadcastData = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = { initSocket, getIo, broadcastData };
