import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

// Allow override via RENDERKIT_DATA_DIR (used in deployment / tests).
// Default: ~/.renderkit/data/renderkit.db
const dataDir = process.env.RENDERKIT_DATA_DIR || path.join(os.homedir(), '.renderkit', 'data');
const dbPath = path.join(dataDir, 'renderkit.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(dataDir, { recursive: true });
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  ensureSchema(_db);
  return _db;
}

/**
 * v2 schema — clean, no backward compatibility.
 * Use CREATE TABLE IF NOT EXISTS so fresh start = full schema in one shot,
 * and existing v2+ databases stay untouched.
 *
 * Pre-v2 databases should be wiped (rm ~/.renderkit/data/renderkit.db*).
 */
function ensureSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id               TEXT PRIMARY KEY,
      title            TEXT NOT NULL DEFAULT '',
      current_revision INTEGER NOT NULL DEFAULT 1,
      format           TEXT NOT NULL DEFAULT 'html',
      tags             TEXT NOT NULL DEFAULT '[]',
      archived         INTEGER NOT NULL DEFAULT 0,
      is_test          INTEGER NOT NULL DEFAULT 0,
      deleted_at       TEXT,
      created_at       TEXT NOT NULL,
      updated_at       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS revisions (
      id             TEXT PRIMARY KEY,
      artifact_id    TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
      number         INTEGER NOT NULL,
      source_text    TEXT NOT NULL DEFAULT '',
      source_hash    TEXT NOT NULL DEFAULT '',
      model          TEXT NOT NULL DEFAULT '{}',
      html_source    TEXT,
      processed_html TEXT,
      created_at     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id                   TEXT PRIMARY KEY,
      artifact_id          TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
      anchor               TEXT NOT NULL,
      text                 TEXT NOT NULL DEFAULT '',
      selector             TEXT,
      status               TEXT NOT NULL DEFAULT 'open',
      created_at_revision  INTEGER,
      block_snapshot       TEXT,
      parent_id            TEXT,
      author               TEXT NOT NULL DEFAULT 'human',
      addressed_at         TEXT,
      addressed_by         TEXT,
      resolved_at_revision INTEGER,
      resolved_by          TEXT,
      resolved_at          TEXT,
      reopened_at          TEXT,
      rebound_at           TEXT,
      created_at           TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS anchors (
      id           TEXT PRIMARY KEY,
      revision_id  TEXT NOT NULL REFERENCES revisions(id) ON DELETE CASCADE,
      artifact_id  TEXT NOT NULL,
      anchor       TEXT NOT NULL,
      element_tag  TEXT NOT NULL,
      position     INTEGER NOT NULL,
      text_preview TEXT
    );

    CREATE TABLE IF NOT EXISTS form_submissions (
      id          TEXT PRIMARY KEY,
      artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
      form_title  TEXT NOT NULL DEFAULT '',
      fields      TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS render_errors (
      id          TEXT PRIMARY KEY,
      artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
      engine      TEXT NOT NULL,
      message     TEXT NOT NULL DEFAULT '',
      anchor      TEXT NOT NULL DEFAULT '',
      created_at  TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_revisions_artifact_number
      ON revisions(artifact_id, number);

    CREATE INDEX IF NOT EXISTS idx_artifacts_active
      ON artifacts(archived, is_test, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_artifacts_updated
      ON artifacts(updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_comments_artifact
      ON comments(artifact_id);
    CREATE INDEX IF NOT EXISTS idx_comments_parent
      ON comments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_comments_anchor
      ON comments(artifact_id, anchor);

    CREATE INDEX IF NOT EXISTS idx_anchors_revision
      ON anchors(revision_id);
    CREATE INDEX IF NOT EXISTS idx_anchors_artifact
      ON anchors(artifact_id);

    CREATE INDEX IF NOT EXISTS idx_form_submissions_artifact
      ON form_submissions(artifact_id);
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
