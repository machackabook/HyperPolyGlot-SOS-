CREATE TABLE IF NOT EXISTS crossvoid_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 stage TEXT NOT NULL,
 event TEXT NOT NULL,
 source TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS crossvoid_events_created_at ON crossvoid_events(created_at);
