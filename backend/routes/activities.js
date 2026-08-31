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
router.get('/', (req, res) => {

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
router.get('/:id', (req, res) => {

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


module.exports = router;
