const express = require('express');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Llistar jugadores
app.get('/api/players', (req, res) => {
    db.all('SELECT * FROM players', [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json(rows);
    });
});

app.post('/api/players', (req, res) => {

    const { name, position, team, minutesPlayed } = req.body;

    // Validació bàsica
    if (!name || !position || !team || minutesPlayed === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    const sql = `
        INSERT INTO players (name, position, team, minutesPlayed)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name, position, team, minutesPlayed],
        function (err) {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(201).json({
                success: true,
                data: {
                    id: this.lastID,
                    name,
                    position,
                    team,
                    minutesPlayed
                }
            });
        }
    );
});

app.get('/api/teams', (req, res) => {
    db.all('SELECT * FROM teams', [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json(rows);
    });
});

// Obtenir una jugadora pel seu id
app.get('/api/players/:id', (req, res) => {
    const playerId = parseInt(req.params.id);

    db.get(
        'SELECT * FROM players WHERE id = ?',
        [playerId],
        (err, player) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (!player) {
                return res.status(404).json({
                    success: false,
                    message: 'Player not found'
                });
            }

            res.json(player);
        }
    );
});

// Obtenir un equip pel seu id
app.get('/api/teams/:id', (req, res) => {
    const teamId = parseInt(req.params.id);

    db.get(
        'SELECT * FROM teams WHERE id = ?',
        [teamId],
        (err, team) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (!team) {
                return res.status(404).json({
                    success: false,
                    message: 'Team not found'
                });
            }

            res.json(team);
        }
    );
});

// Crear una nova activitat
app.post('/api/activities', (req, res) => {
    const { playerId, type, duration, rpe } = req.body;

    // Validació bàsica
    if (!playerId || !type || !duration || !rpe) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    const createdAt = new Date().toISOString();

    const sql = `
    INSERT INTO activities (playerId, type, duration, rpe, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `;

    db.run(sql, [playerId, type, duration, rpe, createdAt], function (err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(201).json({
            success: true,
            data: {
                id: this.lastID,
                playerId,
                type,
                duration,
                rpe,
                createdAt
            }
        });
    });
});

// Llistar activitats
app.get('/api/activities', (req, res) => {
    db.all('SELECT * FROM activities ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json(rows);
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
