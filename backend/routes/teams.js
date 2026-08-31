const express = require('express');
const db = require('../database');

const router = express.Router();


// =====================================================
// GET /api/teams
// Llistar equips del coach autenticat
// =====================================================

router.get('/', (req, res) => {

    const sql = `
        SELECT id, name, coachId
        FROM teams
        WHERE coachId = ?
        ORDER BY name
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
// GET /api/teams/:id
// Obtenir un equip del coach autenticat
// =====================================================

router.get('/:id', (req, res) => {

    const teamId = parseInt(req.params.id);

    const sql = `
        SELECT id, name, coachId
        FROM teams
        WHERE id = ?
        AND coachId = ?
    `;

    db.get(
        sql,
        [teamId, req.user.id],
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

            res.json({
                success: true,
                data: team
            });
        }
    );
});


module.exports = router;