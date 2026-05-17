import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

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

  // schema migrations for HTML format
  try {
    db.exec(`ALTER TABLE artifacts ADD COLUMN format TEXT NOT NULL DEFAULT 'rkmd'`);
  } catch {}
  try {
    db.exec(`ALTER TABLE revisions ADD COLUMN html_source TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE revisions ADD COLUMN processed_html TEXT`);
  } catch {}
  db.exec(`
    CREATE TABLE IF NOT EXISTS anchors (
      id           TEXT PRIMARY KEY,
      revision_id  TEXT NOT NULL REFERENCES revisions(id) ON DELETE CASCADE,
      artifact_id  TEXT NOT NULL,
      anchor       TEXT NOT NULL,
      element_tag  TEXT NOT NULL,
      position     INTEGER NOT NULL,
      text_preview TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_anchors_revision ON anchors(revision_id);
    CREATE INDEX IF NOT EXISTS idx_anchors_artifact ON anchors(artifact_id);
  `);
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
