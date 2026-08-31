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

    const { name, position, teamId } = req.body;

    // Validació bàsica
    if (!name || !position || teamId === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    // Comprovar que l'equip existeix
    db.get(
        'SELECT id FROM teams WHERE id = ?',
        [teamId],
        (err, team) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (!team) {
                return res.status(400).json({
                    success: false,
                    message: 'Team not found'
                });
            }

            // Crear la jugadora
            const sql = `
                INSERT INTO players (name, position, teamId)
                VALUES (?, ?, ?)
            `;

            db.run(
                sql,
                [name, position, teamId],
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
                            teamId
                        }
                    });
                }
            );
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

    const sql = `
        SELECT
            players.id,
            players.name,
            players.position,
            players.teamId,
            teams.name AS teamName
        FROM players
        JOIN teams ON players.teamId = teams.id
        WHERE players.id = ?
    `;

    db.get(sql, [playerId], (err, player) => {

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
    });
});

// Obtenir totes les activitats d'una jugadora
app.get('/api/players/:id/activities', (req, res) => {

    const playerId = parseInt(req.params.id);

    // Primer comprovem que la jugadora existeix
    db.get(
        'SELECT id, name, position FROM players WHERE id = ?',
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

            // Busquem totes les seves activitats
            const sql = `
                SELECT *
                FROM activities
                WHERE playerId = ?
                ORDER BY activityDate DESC, id DESC
            `;

            db.all(sql, [playerId], (err, activities) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                // Calculem la càrrega de cada activitat
                const activitiesWithLoad = activities.map(activity => ({
                    ...activity,
                    load: activity.duration * activity.rpe
                }));

                res.json({
                    success: true,
                    data: {
                        player,
                        activities: activitiesWithLoad
                    }
                });
            });
        }
    );
});

// Obtenir la càrrega dels últims 7 dies d'una jugadora
app.get('/api/players/:id/load', (req, res) => {

    const playerId = parseInt(req.params.id);

    // Comprovar que la jugadora existeix
    db.get(
        'SELECT id, name, position FROM players WHERE id = ?',
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

            // Càrrega total dels últims 7 dies
            const totalLoadSql = `
                SELECT COALESCE(SUM(duration * rpe), 0) AS totalLoad
                FROM activities
                WHERE playerId = ?
                AND activityDate >= date('now', '-6 days')
                AND activityDate <= date('now')
            `;

            db.get(
                totalLoadSql,
                [playerId],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    // Càrrega agrupada per dia
                    const dailyLoadSql = `
                        SELECT
                            activityDate AS date,
                            SUM(duration * rpe) AS load
                        FROM activities
                        WHERE playerId = ?
                        AND activityDate >= date('now', '-6 days')
                        AND activityDate <= date('now')
                        GROUP BY activityDate
                        ORDER BY activityDate DESC
                    `;

                    db.all(
                        dailyLoadSql,
                        [playerId],
                        (err, dailyLoad) => {

                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });
                            }

                            res.json({
                                success: true,
                                data: {
                                    player,
                                    period: {
                                        days: 7
                                    },
                                    totalLoad: result.totalLoad,
                                    dailyLoad
                                }
                            });
                        }
                    );
                }
            );
        }
    );
});

// Obtenir la càrrega setmanal d'una jugadora
app.get('/api/players/:id/load/weekly', (req, res) => {

    const playerId = parseInt(req.params.id);

    // Comprovar que la jugadora existeix
    db.get(
        'SELECT id, name, position FROM players WHERE id = ?',
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

            const sql = `
                SELECT
                    strftime('%Y-%W', activityDate) AS week,
                    MIN(activityDate) AS weekStart,
                    SUM(duration * rpe) AS load

                FROM activities

                WHERE playerId = ?

                GROUP BY strftime('%Y-%W', activityDate)

                ORDER BY week DESC

                LIMIT 4
            `;

            db.all(sql, [playerId], (err, rows) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.json({
                    success: true,
                    data: {
                        player,
                        weeks: rows
                    }
                });
            });
        }
    );
});

// Analitzar el canvi de càrrega d'una jugadora
app.get('/api/players/:id/load/analysis', (req, res) => {

    const playerId = parseInt(req.params.id);

    // Comprovar que la jugadora existeix
    db.get(
        'SELECT id, name, position FROM players WHERE id = ?',
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

            const sql = `
                SELECT
                    strftime('%Y-%W', activityDate) AS week,
                    SUM(duration * rpe) AS load
                FROM activities
                WHERE playerId = ?
                GROUP BY strftime('%Y-%W', activityDate)
                ORDER BY week DESC
                LIMIT 4
            `;

            db.all(sql, [playerId], (err, weeks) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                // Necessitem almenys 2 setmanes
                if (weeks.length < 2) {
                    return res.json({
                        success: true,
                        data: {
                            player,
                            currentWeekLoad: weeks.length === 1 ? weeks[0].load : 0,
                            previousAverageLoad: null,
                            changePercentage: null,
                            message: 'Not enough data for comparison'
                        }
                    });
                }

                const currentWeekLoad = weeks[0].load;

                const previousWeeks = weeks.slice(1);

                const previousAverageLoad =
                    previousWeeks.reduce((sum, week) => sum + week.load, 0)
                    / previousWeeks.length;

                let changePercentage = null;

                if (previousAverageLoad !== 0) {
                    changePercentage =
                        ((currentWeekLoad - previousAverageLoad)
                            / previousAverageLoad) * 100;
                }

                let loadStatus = 'unknown';

                if (changePercentage !== null) {

                    if (changePercentage > 10) {
                        loadStatus = 'increased';

                    } else if (changePercentage < -10) {
                        loadStatus = 'decreased';

                    } else {
                        loadStatus = 'stable';
                    }
                }

                res.json({
                    success: true,
                    data: {
                        player,
                        currentWeekLoad,
                        previousAverageLoad: Number(previousAverageLoad.toFixed(2)),
                        changePercentage: Number(changePercentage.toFixed(2)),
                        loadStatus
                    }
                });
            });
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

    const {
        playerId,
        type,
        duration,
        rpe,
        activityDate
    } = req.body;

    // Camps obligatoris
    if (
        playerId === undefined ||
        type === undefined ||
        duration === undefined ||
        rpe === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    // Tipus de dades
    if (
        !Number.isInteger(playerId) ||
        typeof type !== 'string' ||
        !Number.isInteger(duration) ||
        !Number.isInteger(rpe)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid data types'
        });
    }

    // Durada
    if (duration <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Duration must be greater than 0'
        });
    }

    // RPE
    if (rpe < 1 || rpe > 10) {
        return res.status(400).json({
            success: false,
            message: 'RPE must be between 1 and 10'
        });
    }

    // Comprovar que la jugadora existeix
    db.get(
        'SELECT id FROM players WHERE id = ?',
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

            const createdAt = new Date().toISOString();

            const sql = `
                INSERT INTO activities
                (playerId, type, duration, rpe, activityDate, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.run(
                sql,
                [
                    playerId,
                    type,
                    duration,
                    rpe,
                    activityDate || createdAt.split('T')[0],
                    createdAt
                ],
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
                            playerId,
                            type,
                            duration,
                            rpe,
                            activityDate: activityDate || createdAt.split('T')[0],
                            createdAt
                        }
                    });
                }
            );
        }
    );
});

// Llistar activitats
app.get('/api/activities', (req, res) => {

    db.all(
        'SELECT * FROM activities ORDER BY activityDate DESC, id DESC',
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.json({
                success: true,
                data: rows
            });
        }
    );
});

// Obtenir una activitat pel seu id
app.get('/api/activities/:id', (req, res) => {

    const activityId = parseInt(req.params.id);

    db.get(
        'SELECT * FROM activities WHERE id = ?',
        [activityId],
        (err, activity) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            const load = activity.duration * activity.rpe;

            res.json({
                success: true,
                data: {
                    ...activity,
                    load
                }
            });
        }
    );
});

// Crear un nou partit
app.post('/api/matches', (req, res) => {

    const {
        teamId,
        opponent,
        date,
        homeAway,
        teamGoals,
        opponentGoals
    } = req.body;

    // Camps obligatoris
    if (
        teamId === undefined ||
        opponent === undefined ||
        date === undefined ||
        homeAway === undefined ||
        teamGoals === undefined ||
        opponentGoals === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    // Validar tipus de dades
    if (
        !Number.isInteger(teamId) ||
        typeof opponent !== 'string' ||
        typeof date !== 'string' ||
        typeof homeAway !== 'string' ||
        !Number.isInteger(teamGoals) ||
        !Number.isInteger(opponentGoals)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid data types'
        });
    }

    // Validar que el nom de l'adversari no estigui buit
    if (opponent.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Opponent cannot be empty'
        });
    }

    // Validar homeAway
    if (homeAway !== 'home' && homeAway !== 'away') {
        return res.status(400).json({
            success: false,
            message: 'homeAway must be either home or away'
        });
    }

    // Validar gols
    if (teamGoals < 0 || opponentGoals < 0) {
        return res.status(400).json({
            success: false,
            message: 'Goals cannot be negative'
        });
    }

    // Validar format de data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            success: false,
            message: 'Date must have format YYYY-MM-DD'
        });
    }

    // Comprovar que l'equip existeix
    db.get(
        'SELECT id FROM teams WHERE id = ?',
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

            // Crear el partit
            const sql = `
                INSERT INTO matches (
                    teamId,
                    opponent,
                    date,
                    homeAway,
                    teamGoals,
                    opponentGoals
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.run(
                sql,
                [
                    teamId,
                    opponent.trim(),
                    date,
                    homeAway,
                    teamGoals,
                    opponentGoals
                ],
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
                            teamId,
                            opponent: opponent.trim(),
                            date,
                            homeAway,
                            teamGoals,
                            opponentGoals
                        }
                    });
                }
            );
        }
    );
});

// Llistar tots els partits
app.get('/api/matches', (req, res) => {

    const sql = `
        SELECT
            matches.id,
            matches.teamId,
            teams.name AS teamName,
            matches.opponent,
            matches.date,
            matches.homeAway,
            matches.teamGoals,
            matches.opponentGoals
        FROM matches
        JOIN teams ON matches.teamId = teams.id
        ORDER BY matches.date DESC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json(rows);
    });
});

// Obtenir un partit amb totes les seves jugadores
app.get('/api/matches/:id', (req, res) => {

    const matchId = parseInt(req.params.id);

    // Primer obtenim el partit
    db.get(
        'SELECT * FROM matches WHERE id = ?',
        [matchId],
        (err, match) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            // Després obtenim les jugadores del partit
            const sql = `
                SELECT
                    mp.playerId,
                    p.name,
                    p.position,
                    mp.started,
                    mp.minutesPlayed,
                    mp.goals,
                    mp.assists
                FROM match_players mp
                JOIN players p ON p.id = mp.playerId
                WHERE mp.matchId = ?
                ORDER BY mp.started DESC, mp.minutesPlayed DESC
            `;

            db.all(sql, [matchId], (err, players) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.json({
                    success: true,
                    data: {
                        match,
                        players
                    }
                });
            });
        }
    );
});


// Obtenir les jugadores d'un partit
app.get('/api/matches/:id/players', (req, res) => {

    const matchId = parseInt(req.params.id);

    // Primer comprovem que el partit existeix
    db.get(
        'SELECT id FROM matches WHERE id = ?',
        [matchId],
        (err, match) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            const sql = `
                SELECT
                    mp.playerId,
                    p.name,
                    p.position,
                    mp.started,
                    mp.minutesPlayed,
                    mp.goals,
                    mp.assists
                FROM match_players mp
                JOIN players p ON p.id = mp.playerId
                WHERE mp.matchId = ?
                ORDER BY mp.started DESC, mp.minutesPlayed DESC
            `;

            db.all(sql, [matchId], (err, players) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.json({
                    success: true,
                    data: players
                });
            });
        }
    );
});

// Perfil complet d'una jugadora
app.get('/api/players/:id/profile', (req, res) => {

    const playerId = parseInt(req.params.id);

    db.get(
        `
        SELECT
            p.id,
            p.name,
            p.position,
            p.teamId,
            t.name AS team
        FROM players p
        JOIN teams t ON t.id = p.teamId
        WHERE p.id = ?
        `,
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

            const matchStatsSql = `
    SELECT
        COUNT(DISTINCT matchId) AS matches,
        COALESCE(SUM(started), 0) AS starts,
        COALESCE(SUM(minutesPlayed), 0) AS minutesPlayed,
        COALESCE(SUM(goals), 0) AS goals,
        COALESCE(SUM(assists), 0) AS assists
    FROM match_players
    WHERE playerId = ?
`;

            db.get(matchStatsSql, [playerId], (err, statistics) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                const loadSql = `
    SELECT
        strftime('%Y-%W', activityDate) AS week,
        SUM(duration * rpe) AS load
    FROM activities
    WHERE playerId = ?
    GROUP BY strftime('%Y-%W', activityDate)
    ORDER BY week DESC
    LIMIT 4
`;

                db.all(loadSql, [playerId], (err, weeks) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    let currentWeekLoad = 0;
                    let previousAverageLoad = null;
                    let changePercentage = null;
                    let loadStatus = 'unknown';

                    if (weeks.length > 0) {
                        currentWeekLoad = weeks[0].load;
                    }

                    if (weeks.length >= 2) {

                        const previousWeeks = weeks.slice(1);

                        previousAverageLoad =
                            previousWeeks.reduce(
                                (sum, week) => sum + week.load,
                                0
                            ) / previousWeeks.length;

                        if (previousAverageLoad !== 0) {

                            changePercentage =
                                ((currentWeekLoad - previousAverageLoad)
                                    / previousAverageLoad) * 100;

                            if (changePercentage > 10) {
                                loadStatus = 'increased';

                            } else if (changePercentage < -10) {
                                loadStatus = 'decreased';

                            } else {
                                loadStatus = 'stable';
                            }
                        }
                    }

                    res.json({
                        success: true,
                        data: {
                            player,
                            statistics,
                            load: {
                                currentWeekLoad,
                                previousAverageLoad:
                                    previousAverageLoad !== null
                                        ? Number(previousAverageLoad.toFixed(2))
                                        : null,
                                changePercentage:
                                    changePercentage !== null
                                        ? Number(changePercentage.toFixed(2))
                                        : null,
                                loadStatus
                            }
                        }
                    });
                });

            });
        }
    );
});

// Afegir una jugadora a un partit
app.post('/api/matches/:matchId/players', (req, res) => {

    const matchId = parseInt(req.params.matchId);

    const {
        playerId,
        started,
        minutesPlayed,
        goals,
        assists
    } = req.body;

    // Validar matchId
    if (!Number.isInteger(matchId) || matchId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid match ID'
        });
    }

    // Camps obligatoris
    if (
        playerId === undefined ||
        started === undefined ||
        minutesPlayed === undefined ||
        goals === undefined ||
        assists === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    // Validar tipus de dades
    if (
        !Number.isInteger(playerId) ||
        !Number.isInteger(started) ||
        !Number.isInteger(minutesPlayed) ||
        !Number.isInteger(goals) ||
        !Number.isInteger(assists)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid data types'
        });
    }

    // Validar started
    if (started !== 0 && started !== 1) {
        return res.status(400).json({
            success: false,
            message: 'Started must be 0 or 1'
        });
    }

    // Validar minuts
    if (minutesPlayed < 0) {
        return res.status(400).json({
            success: false,
            message: 'Minutes played cannot be negative'
        });
    }

    // Validar gols
    if (goals < 0) {
        return res.status(400).json({
            success: false,
            message: 'Goals cannot be negative'
        });
    }

    // Validar assistències
    if (assists < 0) {
        return res.status(400).json({
            success: false,
            message: 'Assists cannot be negative'
        });
    }

    // Comprovar que el partit existeix
    db.get(
        'SELECT * FROM matches WHERE id = ?',
        [matchId],
        (err, match) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            // Comprovar que la jugadora existeix
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

                    // Comprovar que la jugadora pertany a l'equip del partit
                    if (player.teamId !== match.teamId) {
                        return res.status(400).json({
                            success: false,
                            message: 'Player does not belong to this team'
                        });
                    }

                    // Crear participació
                    const sql = `
                        INSERT INTO match_players (
                            matchId,
                            playerId,
                            started,
                            minutesPlayed,
                            goals,
                            assists
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;

                    db.run(
                        sql,
                        [
                            matchId,
                            playerId,
                            started,
                            minutesPlayed,
                            goals,
                            assists
                        ],
                        function (err) {

                            if (err) {

                                // Jugadora ja registrada en aquest partit
                                if (err.message.includes('UNIQUE constraint failed')) {
                                    return res.status(409).json({
                                        success: false,
                                        message: 'Player is already registered in this match'
                                    });
                                }

                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });
                            }

                            res.status(201).json({
                                success: true,
                                data: {
                                    id: this.lastID,
                                    matchId,
                                    playerId,
                                    started,
                                    minutesPlayed,
                                    goals,
                                    assists
                                }
                            });
                        }
                    );
                }
            );
        }
    );
});

// Veure les jugadores d'un partit
app.get('/api/matches/:matchId/players', (req, res) => {

    const matchId = parseInt(req.params.matchId);

    // Comprovar que el partit existeix
    db.get(
        'SELECT * FROM matches WHERE id = ?',
        [matchId],
        (err, match) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            // Obtenir jugadores + estadístiques
            const sql = `
                SELECT
                    players.id AS playerId,
                    players.name,
                    players.position,
                    match_players.started,
                    match_players.minutesPlayed,
                    match_players.goals,
                    match_players.assists

                FROM match_players

                JOIN players
                    ON match_players.playerId = players.id

                WHERE match_players.matchId = ?

                ORDER BY players.name
            `;

            db.all(sql, [matchId], (err, rows) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.json({
                    success: true,
                    data: rows
                });
            });
        }
    );
});


/*app.get('/api/debug/players', (req, res) => {
    db.all('PRAGMA table_info(players)', [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
 
        res.json(rows);
    });
});
 
app.get('/api/debug/migrate-players', (req, res) => {
 
    db.serialize(() => {
 
        // 1. Crear la nova taula
        db.run(`
            CREATE TABLE players_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                position TEXT NOT NULL,
                teamId INTEGER NOT NULL,
                FOREIGN KEY (teamId) REFERENCES teams(id)
            )
        `);
 
        // 2. Copiar les jugadores existents
        db.run(`
            INSERT INTO players_new (id, name, position, teamId)
            SELECT id, name, position, 1
            FROM players
        `);
 
        // 3. Eliminar la taula antiga
        db.run(`DROP TABLE players`);
 
        // 4. Renombrar la nova
        db.run(`ALTER TABLE players_new RENAME TO players`, (err) => {
 
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }
 
            res.json({
                success: true,
                message: 'Players table migrated successfully'
            });
 
        });
 
    });
 
});*/

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
