# 数据层

## SQLite 配置

- **引擎**: better-sqlite3（同步 API）
- **数据目录**: `~/.renderkit/data/`
- **数据库文件**: `renderkit.db`
- **连接模式**: 单例，`getDb()` 返回全局连接
- **PRAGMA**: `journal_mode = WAL`, `foreign_keys = ON`

参考：`lib/db.ts`

## Schema

### artifacts
```sql
id              TEXT PRIMARY KEY,
title           TEXT NOT NULL DEFAULT '',
current_revision INTEGER NOT NULL DEFAULT 1,
format          TEXT NOT NULL DEFAULT 'rkmd',   -- 'html' | 'rkmd'
created_at      TEXT NOT NULL,
updated_at      TEXT NOT NULL
```

### revisions
```sql
id              TEXT PRIMARY KEY,              -- '{artifactId}_rev_{number}'
artifact_id     TEXT REFERENCES artifacts(id) ON DELETE CASCADE,
number          INTEGER NOT NULL,
source_text     TEXT NOT NULL DEFAULT '',
source_hash     TEXT NOT NULL DEFAULT '',
model           TEXT NOT NULL DEFAULT '{}',
html_source     TEXT,                          -- 原始 HTML
processed_html  TEXT,                          -- 处理后 HTML（含 anchor + 高亮）

```

### anchors
```sql
id              TEXT PRIMARY KEY,
revision_id     TEXT REFERENCES revisions(id) ON DELETE CASCADE,
artifact_id     TEXT NOT NULL,
anchor          TEXT NOT NULL,                 -- data-rk-anchor 值
element_tag     TEXT NOT NULL,                 -- 标签名（h1, rk-callout 等）
position        INTEGER NOT NULL,              -- 文档内顺序
text_preview    TEXT                           -- 前 200 字符
```

### comments
```sql
id                    TEXT PRIMARY KEY,         -- 'cmt_' + 10 hex
artifact_id           TEXT REFERENCES artifacts(id) ON DELETE CASCADE,
anchor                TEXT NOT NULL,            -- 对应 data-rk-anchor

selector              TEXT,                     -- JSON: TextQuoteSelector
status                TEXT NOT NULL DEFAULT 'open',  -- open | resolved | orphaned
created_at_revision   INTEGER,
block_snapshot        TEXT,
resolved_at_revision  INTEGER,
resolved_by           TEXT,
resolved_at           TEXT,
reopened_at           TEXT,
created_at            TEXT NOT NULL
```

## Migration 策略

`db.ts` 中 `migrate()` 函数在每次连接时执行：

1. `CREATE TABLE IF NOT EXISTS` 建基础表 + 索引
2. `ALTER TABLE ... ADD COLUMN` 增量添加字段，`try/catch` 吞掉 "column exists" 错误
3. 新表独立 `CREATE TABLE IF NOT EXISTS`

**不使用 migration 版本表**。适合单用户本地工具的轻量策略。

## store.ts 函数清单

### 读取
| 函数 | 返回 | 说明 |
|------|------|------|
| `listArtifacts()` | `ArtifactMeta[]` | 按 `created_at DESC` 排序 |
| `getArtifactMeta(id)` | `ArtifactMeta \| null` | 单条元数据 |
| `getArtifact(id)` | `HtmlArtifactBundle \| null` | 完整 bundle（meta + revision + anchors + comments） |
| `getHtmlArtifact(id)` | `HtmlArtifactBundle \| null` | 同上，显式 HTML 路径 |
| `getComments(artifactId)` | `Comment[]` | 按 artifact 过滤 |
| `getFeedback(id)` | feedback object \| null | CLI 反馈格式：open + orphaned 评论 |

### 写入
| 函数 | 说明 |
|------|------|
| `pushHTML(rawHtml, file?)` | 核心写入：处理 HTML → 创建 revision → anchor diff → 标记 orphaned |
| `addComment(artifactId, anchor, text, selector?)` | 新增评论 |
| `updateCommentStatus(artifactId, commentId, status)` | open ↔ resolved 切换 |
| `resolveComment(commentId)` | 直接 resolve（无 artifact 验证） |
| `deleteArtifact(id)` | 级联删除 comments → anchors → revisions → artifact |

### 内部模式
- **事务**: `pushHTML()` 使用 `db.transaction(() => { ... })()` 包裹多步写入
- **行映射**: `rowToArtifact()`, `rowToComment()` 做 snake_case → camelCase 转换
- **ID 生成**: `crypto.randomBytes(5/6).toString('hex')`，加前缀区分类型
- **时间戳**: `new Date().toISOString()`，存为 TEXT

## pushHTML 完整流程

```
1. processHTML(rawHtml) → { processedHtml, anchors, title }
2. 查找已有 artifact（by title + format='html'）
3. 计算 nextRevision
4. db.transaction():
   a. INSERT/UPDATE artifacts
   b. INSERT revisions (含 html_source + processed_html)
   c. DELETE old anchors → INSERT new anchors
   d. diffAnchors(prevAnchors, newAnchors) → 标记 orphaned comments
5. 返回 { artifactId, revision, url }
```

## 关键约束

- store 函数虽声明 `async`，内部全是同步 SQLite 调用
- **没有连接池**，单进程单连接
- **没有软删除**，deleteArtifact 物理删除所有关联数据
- comment 的 `anchor` 对应 anchors 表里的 `anchor` 字段（不是 anchor.id）
