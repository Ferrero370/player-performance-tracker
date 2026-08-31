const db = require('./database');

console.log('Starting activities migration...');

// Activem les foreign keys
db.run(`PRAGMA foreign_keys = ON`);

db.run(`
    CREATE TABLE activities_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playerId INTEGER NOT NULL,
        type TEXT NOT NULL,
        duration INTEGER NOT NULL,
        rpe INTEGER NOT NULL,
        activityDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,

        FOREIGN KEY (playerId) REFERENCES players(id)
    )
`, (err) => {

    if (err) {
        console.error(
            'Error creating new activities table:',
            err.message
        );
        process.exit(1);
    }

    console.log('New activities table created.');

    db.run(`
        INSERT INTO activities_new (
            id,
            playerId,
            type,
            duration,
            rpe,
            activityDate,
            createdAt
        )
        SELECT
            id,
            playerId,
            type,
            duration,
            rpe,
            substr(createdAt, 1, 10),
            createdAt
        FROM activities
    `, (err) => {

        if (err) {
            console.error(
                'Error copying activities:',
                err.message
            );
            process.exit(1);
        }

        console.log('Activities copied successfully.');

        db.run(`DROP TABLE activities`, (err) => {

            if (err) {
                console.error(
                    'Error removing old activities table:',
                    err.message
                );
                process.exit(1);
            }

            console.log('Old activities table removed.');

            db.run(
                `ALTER TABLE activities_new RENAME TO activities`,
                (err) => {

                    if (err) {
                        console.error(
                            'Error renaming activities table:',
                            err.message
                        );
                        process.exit(1);
                    }

                    console.log(
                        'Activities table renamed successfully.'
                    );

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
                }
            );
        });
    });
});