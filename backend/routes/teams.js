const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
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

// Obtenir un equip pel seu id
router.get('/:id', (req, res) => {
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

module.exports = router;