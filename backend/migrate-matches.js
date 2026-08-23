const db = require('./database');

console.log('Starting matches migration...');

db.run(`
    CREATE TABLE matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teamId INTEGER NOT NULL,
        opponent TEXT NOT NULL,
        date TEXT NOT NULL,
        homeAway TEXT NOT NULL,
        teamGoals INTEGER NOT NULL,
        opponentGoals INTEGER NOT NULL,

        FOREIGN KEY (teamId) REFERENCES teams(id)
    )
`, (err) => {

    if (err) {
        console.error('Error creating matches table:', err.message);
        process.exit(1);
    }

    console.log('Matches table created successfully.');

    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
            process.exit(1);
        }

        console.log('Migration completed.');
    });
});