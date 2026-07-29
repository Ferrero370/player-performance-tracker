const express = require('express');

const app = express();
const PORT = 3000;

// Ruta principal
app.get('/', (req, res) => {
    res.send('Player Performance Tracker API');
});

// Primera ruta API
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API working correctly',
        timestamp: new Date().toISOString()
    });
});

// Informació bàsica de l'app
app.get('/api/info', (req, res) => {
    res.json({
        app: 'Player Performance Tracker',
        version: '1.0.0',
        sport: 'football',
        roles: ['player', 'coach']
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});