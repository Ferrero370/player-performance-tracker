const express = require('express');
const db = require('../database');

const router = express.Router();


// =====================================================
// POST /api/matches
// Crear un partit
// =====================================================

router.post('/', (req, res) => {

    const {
        teamId,
        opponent,
        date,
        homeAway,
        teamGoals,
        opponentGoals
    } = req.body;

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

    if (opponent.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Opponent cannot be empty'
        });
    }

    if (homeAway !== 'home' && homeAway !== 'away') {
        return res.status(400).json({
            success: false,
            message: 'homeAway must be either home or away'
        });
    }

    if (teamGoals < 0 || opponentGoals < 0) {
        return res.status(400).json({
            success: false,
            message: 'Goals cannot be negative'
        });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            success: false,
            message: 'Date must have format YYYY-MM-DD'
        });
    }

    // Comprovar que l'equip pertany al coach
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


// =====================================================
// GET /api/matches
// Llistar partits del coach
// =====================================================

router.get('/', (req, res) => {

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
        JOIN teams
            ON matches.teamId = teams.id
        WHERE teams.coachId = ?
        ORDER BY matches.date DESC
    `;

    db.all(
        sql,
        [req.user.id],
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


// =====================================================
// GET /api/matches/:id
// Obtenir un partit
// =====================================================

router.get('/:id', (req, res) => {

    const matchId = parseInt(req.params.id);

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
        JOIN teams
            ON matches.teamId = teams.id
        WHERE matches.id = ?
        AND teams.coachId = ?
    `;

    db.get(
        sql,
        [matchId, req.user.id],
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

            res.json({
                success: true,
                data: match
            });
        }
    );
});


// =====================================================
// GET /api/matches/:matchId/players
// Veure jugadores d'un partit
// =====================================================

router.get('/:matchId/players', (req, res) => {

    const matchId = parseInt(req.params.matchId);

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
        JOIN players p
            ON mp.playerId = p.id
        JOIN matches m
            ON mp.matchId = m.id
        JOIN teams t
            ON m.teamId = t.id
        WHERE mp.matchId = ?
        AND t.coachId = ?
        ORDER BY mp.started DESC, p.name
    `;

    db.all(
        sql,
        [matchId, req.user.id],
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


// =====================================================
// POST /api/matches/:matchId/players
// Afegir una jugadora a un partit
// =====================================================

router.post('/:matchId/players', (req, res) => {

    const matchId = parseInt(req.params.matchId);

    const {
        playerId,
        started,
        minutesPlayed,
        goals,
        assists
    } = req.body;

    if (!Number.isInteger(matchId) || matchId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid match ID'
        });
    }

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

    if (started !== 0 && started !== 1) {
        return res.status(400).json({
            success: false,
            message: 'Started must be 0 or 1'
        });
    }

    if (minutesPlayed < 0) {
        return res.status(400).json({
            success: false,
            message: 'Minutes played cannot be negative'
        });
    }

    if (goals < 0) {
        return res.status(400).json({
            success: false,
            message: 'Goals cannot be negative'
        });
    }

    if (assists < 0) {
        return res.status(400).json({
            success: false,
            message: 'Assists cannot be negative'
        });
    }

    // Comprovar que el partit pertany al coach
    db.get(
        `
        SELECT matches.*
        FROM matches
        JOIN teams
            ON matches.teamId = teams.id
        WHERE matches.id = ?
        AND teams.coachId = ?
        `,
        [matchId, req.user.id],
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

                    // La jugadora ha de pertànyer a l'equip del partit
                    if (player.teamId !== match.teamId) {
                        return res.status(400).json({
                            success: false,
                            message: 'Player does not belong to this team'
                        });
                    }

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

                                if (
                                    err.message.includes(
                                        'UNIQUE constraint failed'
                                    )
                                ) {
                                    return res.status(409).json({
                                        success: false,
                                        message:
                                            'Player is already registered in this match'
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


module.exports = router;