require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./socket');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

// CORS - allow frontend dev server
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Initialize WebSockets
initSocket(server);

// Routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'bike-backend-gateway', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`\n🚲 VeloAI Backend running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API:    http://localhost:${PORT}/api/stations`);
    console.log(`   ML:     ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}\n`);
});
