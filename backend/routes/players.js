const express = require('express');
const db = require('../database');

const router = express.Router();

// Llistar jugadores
router.get('/', (req, res) => {
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

// Obtenir una jugadora pel seu id
router.get('/:id', (req, res) => {

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
router.get('/:id/activities', (req, res) => {

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
router.get('/:id/load', (req, res) => {

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
router.get('/:id/load/weekly', (req, res) => {

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
router.get('/:id/load/analysis', (req, res) => {

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

// Perfil complet d'una jugadora
router.get('/:id/profile', (req, res) => {

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

router.post('/', (req, res) => {

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

module.exports = router;