require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./database');
const playersRouter = require('./routes/players');
const teamsRouter = require('./routes/teams');
const activitiesRouter = require('./routes/activities');
const matchesRouter = require('./routes/matches');
const authRouter = require('./routes/auth');
const authenticateToken = require('./middleware/authMiddleware');

const app = express();
app.use(cors({
    origin: 'http://localhost:5174'
}));
const PORT = 3000;

app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/players', authenticateToken, playersRouter);
app.use('/api/teams', authenticateToken, teamsRouter);
app.use('/api/activities', authenticateToken, activitiesRouter);
app.use('/api/matches', authenticateToken, matchesRouter);



db.run(`
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playerId INTEGER NOT NULL,
    type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    rpe INTEGER NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    team TEXT NOT NULL,
    minutesPlayed INTEGER NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`);

db.get('SELECT COUNT(*) AS count FROM teams', [], (err, row) => {
    if (err) {
        console.error('Error checking teams:', err.message);
        return;
    }

    if (row.count === 0) {
        const sql = `
            INSERT INTO teams (name)
            VALUES (?)
        `;

        const initialTeams = [
            ['Pallejà 1r Equip Femení'],
            ['Pallejà juvenil A']
        ];

        initialTeams.forEach(team => {
            db.run(sql, team);
        });

        console.log('Initial teams inserted');
    }
});

db.get('SELECT COUNT(*) AS count FROM players', [], (err, row) => {
    if (err) {
        console.error('Error checking players:', err.message);
        return;
    }

    if (row.count === 0) {
        const sql = `
            INSERT INTO players (name, position, team, minutesPlayed)
            VALUES (?, ?, ?, ?)
        `;

        const initialPlayers = [
            ['Carla Ferrer', 'Left winger', 'Pallejà', 780],
            ['Maria Garcia', 'Striker', 'Pallejà', 640],
            ['Laia Puig', 'Midfielder', 'Pallejà', 820]
        ];

        initialPlayers.forEach(player => {
            db.run(sql, player);
        });

        console.log('Initial players inserted');
    }
});

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

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: "My first custom endpoint"
    })
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
