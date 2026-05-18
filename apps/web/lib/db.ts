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
      html_source   TEXT,
      processed_html TEXT,
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id                    TEXT PRIMARY KEY,
      artifact_id           TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
      anchor                TEXT NOT NULL,
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

  // form submissions
  db.exec(`
    CREATE TABLE IF NOT EXISTS form_submissions (
      id           TEXT PRIMARY KEY,
      artifact_id  TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
      form_title   TEXT NOT NULL DEFAULT '',
      fields       TEXT NOT NULL,
      created_at   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_form_submissions_artifact
      ON form_submissions(artifact_id);
  `);

  // tags + archived columns
  try {
    db.exec(`ALTER TABLE artifacts ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'`);
  } catch {}
  try {
    db.exec(`ALTER TABLE artifacts ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`);
  } catch {}

  // v1-ux: test isolation + soft delete
  try {
    db.exec(`ALTER TABLE artifacts ADD COLUMN is_test INTEGER NOT NULL DEFAULT 0`);
  } catch {}
  try {
    db.exec(`ALTER TABLE artifacts ADD COLUMN deleted_at TEXT`);
  } catch {}
  // Backfill is_test for existing rows whose title looks like a test push.
  try {
    db.exec(`UPDATE artifacts SET is_test = 1 WHERE is_test = 0 AND title LIKE 'rk-test-%'`);
  } catch {}
  // Useful indices for list filters/sort
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_artifacts_active
      ON artifacts(archived, is_test, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_artifacts_updated
      ON artifacts(updated_at DESC);
  `);

  // v1-ux: comment thread + addressed status
  try {
    db.exec(`ALTER TABLE comments ADD COLUMN parent_id TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE comments ADD COLUMN addressed_at TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE comments ADD COLUMN addressed_by TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE comments ADD COLUMN author TEXT NOT NULL DEFAULT 'human'`);
  } catch {}
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_comments_anchor ON comments(artifact_id, anchor);
  `);

  // render errors (client-side diagram/chart failures)
  db.exec(`
    CREATE TABLE IF NOT EXISTS render_errors (
      id           TEXT PRIMARY KEY,
      artifact_id  TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
      engine       TEXT NOT NULL,
      message      TEXT NOT NULL DEFAULT '',
      anchor       TEXT NOT NULL DEFAULT '',
      created_at   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_render_errors_artifact
      ON render_errors(artifact_id);
  `);
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
