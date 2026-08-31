const express = require('express');
const db = require('../database');

const router = express.Router();


// =====================================================
// GET /api/players
// Llistar jugadores del coach autenticat
// =====================================================

router.get('/', (req, res) => {

    const sql = `
        SELECT
            players.id,
            players.name,
            players.position,
            players.teamId
        FROM players
        JOIN teams
            ON players.teamId = teams.id
        WHERE teams.coachId = ?
        ORDER BY players.name
    `;

    db.all(sql, [req.user.id], (err, rows) => {

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
});


// =====================================================
// GET /api/players/:id
// Obtenir una jugadora
// =====================================================

router.get('/:id', (req, res) => {

    const playerId = parseInt(req.params.id);

    const sql = `
        SELECT
            players.id,
            players.name,
            players.position,
            players.teamId
        FROM players
        JOIN teams
            ON players.teamId = teams.id
        WHERE players.id = ?
        AND teams.coachId = ?
    `;

    db.get(
        sql,
        [playerId, req.user.id],
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

            res.json({
                success: true,
                data: player
            });
        }
    );
});


// =====================================================
// GET /api/players/:id/activities
// Activitats d'una jugadora
// =====================================================

router.get('/:id/activities', (req, res) => {

    const playerId = parseInt(req.params.id);

    const playerSql = `
        SELECT
            players.id,
            players.name,
            players.position
        FROM players
        JOIN teams
            ON players.teamId = teams.id
        WHERE players.id = ?
        AND teams.coachId = ?
    `;

    db.get(
        playerSql,
        [playerId, req.user.id],
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


// =====================================================
// GET /api/players/:id/load
// Càrrega dels últims 7 dies
// =====================================================

router.get('/:id/load', (req, res) => {

    const playerId = parseInt(req.params.id);

    const playerSql = `
        SELECT
            players.id,
            players.name,
            players.position
        FROM players
        JOIN teams
            ON players.teamId = teams.id
        WHERE players.id = ?
        AND teams.coachId = ?
    `;

    db.get(
        playerSql,
        [playerId, req.user.id],
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


// =====================================================
// GET /api/players/:id/load/weekly
// Càrrega setmanal
// =====================================================

router.get('/:id/load/weekly', (req, res) => {

    const playerId = parseInt(req.params.id);

    const playerSql = `
        SELECT
            players.id,
            players.name,
            players.position
        FROM players
        JOIN teams
            ON players.teamId = teams.id
        WHERE players.id = ?
        AND teams.coachId = ?
    `;

    db.get(
        playerSql,
        [playerId, req.user.id],
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


// =====================================================
// GET /api/players/:id/load/analysis
// Anàlisi de càrrega
// =====================================================

router.get('/:id/load/analysis', (req, res) => {

    const playerId = parseInt(req.params.id);

    const playerSql = `
        SELECT
            players.id,
            players.name,
            players.position
        FROM players
        JOIN teams
            ON players.teamId = teams.id
        WHERE players.id = ?
        AND teams.coachId = ?
    `;

    db.get(
        playerSql,
        [playerId, req.user.id],
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

                if (weeks.length < 2) {
                    return res.json({
                        success: true,
                        data: {
                            player,
                            currentWeekLoad: weeks.length === 1
                                ? weeks[0].load
                                : 0,
                            previousAverageLoad: null,
                            changePercentage: null,
                            message: 'Not enough data for comparison'
                        }
                    });
                }

                const currentWeekLoad = weeks[0].load;

                const previousWeeks = weeks.slice(1);

                const previousAverageLoad =
                    previousWeeks.reduce(
                        (sum, week) => sum + week.load,
                        0
                    ) / previousWeeks.length;

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
                        previousAverageLoad:
                            Number(previousAverageLoad.toFixed(2)),
                        changePercentage:
                            Number(changePercentage.toFixed(2)),
                        loadStatus
                    }
                });
            });
        }
    );
});


// =====================================================
// GET /api/players/:id/profile
// Perfil complet
// =====================================================

router.get('/:id/profile', (req, res) => {

    const playerId = parseInt(req.params.id);

    const playerSql = `
        SELECT
            p.id,
            p.name,
            p.position,
            p.teamId,
            t.name AS team
        FROM players p
        JOIN teams t
            ON t.id = p.teamId
        WHERE p.id = ?
        AND t.coachId = ?
    `;

    db.get(
        playerSql,
        [playerId, req.user.id],
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

            db.get(
                matchStatsSql,
                [playerId],
                (err, statistics) => {

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

                    db.all(
                        loadSql,
                        [playerId],
                        (err, weeks) => {

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
                        }
                    );
                }
            );
        }
    );
});


// =====================================================
// POST /api/players
// Crear jugadora
// =====================================================

router.post('/', (req, res) => {

    const {
        name,
        position,
        teamId
    } = req.body;

    if (!name || !position || teamId === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    // L'equip ha de pertànyer al coach autenticat
    db.get(
        `
        SELECT id
        FROM teams
        WHERE id = ?
        AND coachId = ?
        `,
        [teamId, req.user.id],
        (err, team) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (!team) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this team'
                });
            }

            const sql = `
                INSERT INTO players (
                    name,
                    position,
                    teamId
                )
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