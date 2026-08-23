const db = require('./database');

console.log('Starting players migration...');

db.serialize(() => {

    // 1. Crear la nova estructura de players
    db.run(`
        CREATE TABLE players_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            position TEXT NOT NULL,
            teamId INTEGER NOT NULL,
            FOREIGN KEY (teamId) REFERENCES teams(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating players_new:', err.message);
            process.exit(1);
        }

        console.log('New players table created.');
    });

    // 2. Copiar les dades actuals a la nova taula
    // Totes les jugadores actuals pertanyen al team 1.
    db.run(`
        INSERT INTO players_new (id, name, position, teamId)
        SELECT id, name, position, 1
        FROM players
    `, (err) => {
        if (err) {
            console.error('Error copying players:', err.message);
            process.exit(1);
        }

        console.log('Players copied successfully.');
    });

    // 3. Eliminar la taula antiga
    db.run(`DROP TABLE players`, (err) => {
        if (err) {
            console.error('Error dropping old players table:', err.message);
            process.exit(1);
        }

        console.log('Old players table removed.');
    });

    // 4. Posar a la nova taula el nom original
    db.run(`ALTER TABLE players_new RENAME TO players`, (err) => {
        if (err) {
            console.error('Error renaming players table:', err.message);
            process.exit(1);
        }

        console.log('Players table renamed successfully.');
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
        process.exit(1);
    }

    console.log('Migration completed.');
});