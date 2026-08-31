const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-this';


// REGISTER
router.post('/register', async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email and password are required'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must contain at least 6 characters'
        });
    }

    try {

        const passwordHash = await bcrypt.hash(password, 10);

        db.run(
            `
            INSERT INTO users (name, email, passwordHash, role)
            VALUES (?, ?, ?, 'coach')
            `,
            [name, email.toLowerCase(), passwordHash],
            function (err) {

                if (err) {

                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({
                            success: false,
                            message: 'Email already registered'
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
                        name,
                        email: email.toLowerCase(),
                        role: 'coach'
                    }
                });
            }
        );

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


// LOGIN
router.post('/login', (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    db.get(
        `
        SELECT id, name, email, passwordHash, role
        FROM users
        WHERE email = ?
        `,
        [email.toLowerCase()],
        async (err, user) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const passwordCorrect =
                await bcrypt.compare(password, user.passwordHash);

            if (!passwordCorrect) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role
                },
                JWT_SECRET,
                {
                    expiresIn: '7d'
                }
            );

            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                }
            });
        }
    );
});


module.exports = router;