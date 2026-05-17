import Database from 'better-sqlite3';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const dataDir = path.join(os.homedir(), '.renderkit', 'data');
const dbPath = path.join(dataDir, 'renderkit.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(dataDir, { recursive: true });
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL DEFAULT '',
      current_revision INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS revisions (
      id            TEXT PRIMARY KEY,
      artifact_id   TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
      number        INTEGER NOT NULL,
      source_text   TEXT NOT NULL,
      source_hash   TEXT NOT NULL,
      model         TEXT NOT NULL,
      block_ids     TEXT NOT NULL,
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id                    TEXT PRIMARY KEY,
      artifact_id           TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
      block_id              TEXT NOT NULL,
      text                  TEXT NOT NULL DEFAULT '',
      selector              TEXT,
      status                TEXT NOT NULL DEFAULT 'open',
      created_at_revision   INTEGER,
      block_snapshot        TEXT,
      resolved_at_revision  INTEGER,
      resolved_by           TEXT,
      resolved_at           TEXT,
      reopened_at           TEXT,
      created_at            TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_revisions_artifact_number
      ON revisions(artifact_id, number);
    CREATE INDEX IF NOT EXISTS idx_comments_artifact
      ON comments(artifact_id);
  `);
}

export function closeDb(): void {
  if (_db) { _db.close(); _db = null; }
}
