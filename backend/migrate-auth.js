const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

console.log('Starting authentication migration...');

db.serialize(() => {

    db.run('BEGIN TRANSACTION');

    // Crear taula users
    db.run(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            passwordHash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'coach'
        )
    `, (err) => {

        if (err) {
            console.error('Error creating users table:', err.message);
            db.run('ROLLBACK');
            return;
        }

        console.log('Users table created successfully.');
    });

    // Crear nova taula teams amb coachId
    db.run(`
        CREATE TABLE teams_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            coachId INTEGER,
            FOREIGN KEY (coachId) REFERENCES users(id)
        )
    `, (err) => {

        if (err) {
            console.error('Error creating teams_new table:', err.message);
            db.run('ROLLBACK');
            return;
        }

        console.log('New teams table created.');
    });

    // Copiar els equips existents
    db.run(`
        INSERT INTO teams_new (id, name)
        SELECT id, name
        FROM teams
    `, (err) => {

        if (err) {
            console.error('Error copying teams:', err.message);
            db.run('ROLLBACK');
            return;
        }

        console.log('Teams copied successfully.');
    });

    // Eliminar taula antiga
    db.run(`DROP TABLE teams`, (err) => {

        if (err) {
            console.error('Error removing old teams table:', err.message);
            db.run('ROLLBACK');
            return;
        }

        console.log('Old teams table removed.');
    });

    // Renombrar nova taula
    db.run(`
        ALTER TABLE teams_new RENAME TO teams
    `, (err) => {

        if (err) {
            console.error('Error renaming teams table:', err.message);
            db.run('ROLLBACK');
            return;
        }

        console.log('Teams table renamed successfully.');

        db.run('COMMIT', (err) => {

            if (err) {
                console.error('Error committing migration:', err.message);
                return;
            }

            console.log('Authentication migration completed.');
            db.close();
        });
    });
});