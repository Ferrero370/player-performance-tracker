const db = require('./database');

console.log('Starting match_players migration...');

db.run(`
    CREATE TABLE match_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        matchId INTEGER NOT NULL,
        playerId INTEGER NOT NULL,

        started INTEGER NOT NULL DEFAULT 0,
        minutesPlayed INTEGER NOT NULL DEFAULT 0,
        goals INTEGER NOT NULL DEFAULT 0,
        assists INTEGER NOT NULL DEFAULT 0,

        FOREIGN KEY (matchId) REFERENCES matches(id),
        FOREIGN KEY (playerId) REFERENCES players(id),

        UNIQUE(matchId, playerId)
    )
`, (err) => {

    if (err) {
        console.error(
            'Error creating match_players table:',
            err.message
        );

        process.exit(1);
    }

    console.log('match_players table created successfully.');

    db.close((err) => {

        if (err) {
            console.error(
                'Error closing database:',
                err.message
            );

            process.exit(1);
        }

        console.log('Migration completed.');
    });
});