/**
 * CLI 集成测试
 * 测试 push/feedback/status 命令的完整流程
 * 需要服务器运行（如果服务器不可用则跳过）
 *
 * 运行: node --experimental-strip-types --test tests/cli.test.ts
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CLI = 'node packages/cli/bin/renderkit.mjs';
const ENDPOINT = process.env.RENDERKIT_ENDPOINT || 'http://localhost:3737';

let serverAvailable = false;

function run(cmd: string) {
  try {
    return {
      stdout: execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8', timeout: 15000 }),
      code: 0,
    };
  } catch (e: any) {
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', code: e.status ?? 1 };
  }
}

// 同步检查服务器可用性
try {
  const result = execSync(`curl -s ${ENDPOINT}/api/health`, { timeout: 3000, encoding: 'utf8' });
  const data = JSON.parse(result);
  serverAvailable = data.ok === true;
} catch {
  serverAvailable = false;
}

const describeServer = serverAvailable ? describe : describe.skip;

describeServer('CLI push 命令', () => {
  it('push 创建新 artifact', () => {
    const tmpFile = join(tmpdir(), `rk-test-push-${Date.now()}.html`);
    writeFileSync(tmpFile, `<html><body data-rk-theme="paper-light">
<h1>CLI Test</h1><rk-callout tone="info">Test</rk-callout>
</body></html>`);

    const r = run(`${CLI} push ${tmpFile} --endpoint ${ENDPOINT}`);
    let parsed: any;
    try { parsed = JSON.parse(r.stdout); } catch {}
    assert.equal(r.code, 0, `exit code should be 0, got ${r.code}\nstdout: ${r.stdout}\nstderr: ${r.stderr || ''}`);
    assert.equal(parsed?.ok, true);
    assert.ok(typeof parsed?.artifactId === 'string', 'should have artifactId');
    assert.equal(parsed?.revision, 1);
    assert.ok(typeof parsed?.url === 'string');

    rmSync(tmpFile, { force: true });
  });

  it('push 相同文件创建新 revision', () => {
    const tmpFile = join(tmpdir(), `rk-test-rev-${Date.now()}.html`);
    writeFileSync(tmpFile, `<html><body><h1>Rev Test v1</h1></body></html>`);

    const r1 = run(`${CLI} push ${tmpFile} --endpoint ${ENDPOINT}`);
    const p1 = JSON.parse(r1.stdout);

    // Push again with updated content
    writeFileSync(tmpFile, `<html><body><h1>Rev Test v2</h1></body></html>`);
    const r2 = run(`${CLI} push ${tmpFile} --endpoint ${ENDPOINT}`);
    const p2 = JSON.parse(r2.stdout);

    assert.equal(p2.revision, p1.revision + 1, 'revision should increment');
    assert.equal(p2.artifactId, p1.artifactId, 'same artifact');

    rmSync(tmpFile, { force: true });
  });

  it('push 带 theme 的完整文档', () => {
    const tmpFile = join(tmpdir(), `rk-test-theme-${Date.now()}.html`);
    writeFileSync(tmpFile, `<html lang="zh-CN">
<head><meta charset="UTF-8"><title>Theme Test</title></head>
<body data-rk-theme="dark-pro">
<h1>Dark Theme Doc</h1>
<rk-stat label="Score" value="98" unit="pts"></rk-stat>
</body></html>`);

    const r = run(`${CLI} push ${tmpFile} --endpoint ${ENDPOINT}`);
    assert.equal(r.code, 0);
    const parsed = JSON.parse(r.stdout);
    assert.equal(parsed?.ok, true);

    rmSync(tmpFile, { force: true });
  });
});

describeServer('CLI feedback 命令', () => {
  it('feedback 返回正确 JSON 格式', () => {
    const tmpFile = join(tmpdir(), `rk-test-fb-${Date.now()}.html`);
    writeFileSync(tmpFile, `<html><body><h1>Feedback Test</h1></body></html>`);

    run(`${CLI} push ${tmpFile} --endpoint ${ENDPOINT}`);
    const r = run(`${CLI} feedback ${tmpFile} --endpoint ${ENDPOINT}`);
    const parsed = JSON.parse(r.stdout);

    assert.equal(r.code, 0);
    assert.equal(parsed?.ok, true);
    assert.ok(Array.isArray(parsed?.comments), 'should have comments array');
    assert.ok(typeof parsed?.openCount === 'number', 'should have openCount');

    rmSync(tmpFile, { force: true });
  });
});

describeServer('CLI status 命令', () => {
  it('status 返回正确状态', () => {
    const tmpFile = join(tmpdir(), `rk-test-status-${Date.now()}.html`);
    writeFileSync(tmpFile, `<html><body><h1>Status Test</h1></body></html>`);

    run(`${CLI} push ${tmpFile} --endpoint ${ENDPOINT}`);
    const r = run(`${CLI} status ${tmpFile} --endpoint ${ENDPOINT}`);
    const parsed = JSON.parse(r.stdout);

    assert.equal(r.code, 0);
    assert.equal(parsed?.ok, true);
    assert.ok(typeof parsed?.revision === 'number');
    assert.ok(parsed?.url);

    rmSync(tmpFile, { force: true });
  });
});

describe('CLI 错误处理', () => {
  it('push 不存在的文件返回错误', () => {
    const r = run(`${CLI} push /nonexistent/file.html --endpoint ${ENDPOINT}`);
    assert.ok(r.code !== 0, 'should fail for missing file');
  });

  it('feedback 未 push 的文件返回错误', () => {
    const tmpFile = join(tmpdir(), `rk-test-nopush-${Date.now()}.html`);
    writeFileSync(tmpFile, `<html><body><h1>Not pushed</h1></body></html>`);
    const r = run(`${CLI} feedback ${tmpFile} --endpoint ${ENDPOINT}`);
    // 可能是 lock 文件不存在或 artifact 不存在
    assert.ok(r.code !== 0 || r.stdout.includes('"error"'), 'should indicate error');
    rmSync(tmpFile, { force: true });
  });

  it('--help 显示所有命令', () => {
    const r = run(`${CLI} --help`);
    assert.equal(r.code, 0);
    assert.ok(r.stdout.includes('push'), 'should list push');
    assert.ok(r.stdout.includes('feedback'), 'should list feedback');
    assert.ok(r.stdout.includes('open'), 'should list open');
    assert.ok(r.stdout.includes('status'), 'should list status');
  });
});

describe('CLI 版本和帮助', () => {
  it('--version 显示版本', () => {
    const r = run(`${CLI} --version`);
    assert.equal(r.code, 0);
    assert.ok(r.stdout.trim().length > 0, 'should have version output');
  });
});
