const sqlite3 = require('sqlite3').verbose();

// Obrir (o crear) la base de dades
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

module.exports = db;