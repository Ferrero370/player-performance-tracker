const express = require('express');
const db = require('../database');

const router = express.Router();

// Crear un nou partit
router.post('/', (req, res) => {

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
router.get('/:id', (req, res) => {

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
router.get('/:id/players', (req, res) => {

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


// Afegir una jugadora a un partit
router.post('/:matchId/players', (req, res) => {

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

module.exports = router;