const express = require('express');
const db = require('../database');

const router = express.Router();

// Crear una nova activitat
router.post('/', (req, res) => {

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
        `SELECT players.id
        FROM players
        JOIN teams
            ON players.teamId = teams.id
        WHERE players.id = ?
        AND teams.coachId = ?`,
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
router.get('/', (req, res) => {

    const sql = `
        SELECT
            activities.id,
            activities.playerId,
            players.name AS playerName,
            activities.type,
            activities.duration,
            activities.rpe,
            activities.activityDate,
            activities.createdAt
        FROM activities
        JOIN players
            ON activities.playerId = players.id
        JOIN teams
            ON players.teamId = teams.id
        WHERE teams.coachId = ?
        ORDER BY activities.activityDate DESC
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

// Obtenir una activitat pel seu id
router.get('/:id', (req, res) => {

    const activityId = parseInt(req.params.id);

    const sql = `
        SELECT
            activities.id,
            activities.playerId,
            players.name AS playerName,
            activities.type,
            activities.duration,
            activities.rpe,
            activities.activityDate,
            activities.createdAt
        FROM activities
        JOIN players
            ON activities.playerId = players.id
        JOIN teams
            ON players.teamId = teams.id
        WHERE activities.id = ?
        AND teams.coachId = ?
    `;

    db.get(
        sql,
        [activityId, req.user.id],
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

            res.json({
                success: true,
                data: activity
            });
        }
    );
});

module.exports = router;
