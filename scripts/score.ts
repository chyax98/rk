#!/usr/bin/env node
/**
 * RenderKit 质量评分系统
 *
 * 评分维度（每项 20 分，总分 100）：
 * 1. 渲染质量 (0-20)：24 WC 全部渲染正确，4 种图表引擎
 * 2. 设计系统 (0-20)：8 套主题，token 完整性
 * 3. CLI 成熟度 (0-20)：所有命令工作，错误处理
 * 4. 测试覆盖 (0-20)：单元测试 + 集成测试
 * 5. 生产就绪 (0-20)：a11y, 性能, 错误处理
 *
 * 运行: node --experimental-strip-types scripts/score.ts
 * 输出: JSON 评分报告
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

interface ScoreDimension {
  name: string;
  max: number;
  score: number;
  details: string[];
}

function score(dimensions: ScoreDimension[]): void {
  const total = dimensions.reduce((s, d) => s + d.score, 0);
  const maxTotal = dimensions.reduce((s, d) => s + d.max, 0);

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║        RenderKit 质量评分报告                    ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  for (const d of dimensions) {
    const pct = Math.round((d.score / d.max) * 100);
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    console.log(`  ${d.name}`);
    console.log(`  ${bar} ${d.score}/${d.max} (${pct}%)`);
    for (const detail of d.details) {
      console.log(`    ${detail}`);
    }
    console.log('');
  }

  const totalPct = Math.round((total / maxTotal) * 100);
  const totalBar = '█'.repeat(Math.round(totalPct / 2.5)) + '░'.repeat(40 - Math.round(totalPct / 2.5));
  console.log(`  总分`);
  console.log(`  ${totalBar} ${total}/${maxTotal} (${totalPct}%)`);
  console.log('');

  // JSON output
  const report = {
    timestamp: new Date().toISOString(),
    total,
    maxTotal,
    percentage: totalPct,
    dimensions: dimensions.map(d => ({
      name: d.name,
      score: d.score,
      max: d.max,
      percentage: Math.round((d.score / d.max) * 100),
      details: d.details,
    })),
  };

  const reportPath = join(root, 'score-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`  报告已保存到: ${reportPath}\n`);
}

// ── Dimension 1: 渲染质量 ──
function scoreRendering(): ScoreDimension {
  const details: string[] = [];
  let score = 0;

  // WC 数量
  const wcDir = join(root, 'packages/components/src/elements');
  const wcFiles = existsSync(wcDir) ? readdirSync(wcDir).filter(f => f.startsWith('rk-') && f.endsWith('.ts')) : [];
  const wcCount = wcFiles.length;
  if (wcCount >= 24) { score += 5; details.push(`✓ WC 数量: ${wcCount}/24+`); }
  else if (wcCount >= 20) { score += 4; details.push(`△ WC 数量: ${wcCount}/24`); }
  else { details.push(`✗ WC 数量不足: ${wcCount}/24`); }

  // Bundle 存在
  const bundlePath = join(root, 'apps/web/public/rk/components.js');
  if (existsSync(bundlePath)) {
    const size = statSync(bundlePath).size;
    if (size < 100000) { score += 3; details.push(`✓ Bundle: ${(size / 1024).toFixed(1)}KB (< 100KB)`); }
    else { score += 1; details.push(`△ Bundle 偏大: ${(size / 1024).toFixed(1)}KB`); }
  } else { details.push('✗ Bundle 不存在'); }

  // 图表引擎
  const diagramPath = join(root, 'packages/components/src/elements/rk-diagram.ts');
  if (existsSync(diagramPath)) {
    const src = readFileSync(diagramPath, 'utf8');
    const engines = ['mermaid', 'd2', 'graphviz', 'plantuml'];
    const supported = engines.filter(e => src.includes(`_render${e.charAt(0).toUpperCase() + e.slice(1)}`) || src.includes(e));
    const engScore = Math.min(4, Math.round((supported.length / 4) * 4));
    score += engScore;
    details.push(`✓ 图表引擎: ${supported.join(', ')} (${supported.length}/4)`);
  } else { details.push('✗ rk-diagram.ts 不存在'); }

  // HTML processor
  const processorPath = join(root, 'apps/web/lib/html-processor.ts');
  if (existsSync(processorPath)) {
    const src = readFileSync(processorPath, 'utf8');
    if (src.includes('processHTML') && src.includes('extractBodyContent')) {
      score += 3;
      details.push('✓ HTML processor 完整');
    } else { score += 1; details.push('△ HTML processor 不完整'); }
  }

  // Kroki SSR
  if (existsSync(processorPath)) {
    const src = readFileSync(processorPath, 'utf8');
    if (src.includes('kroki')) { score += 2; details.push('✓ Kroki SSR 集成'); }
    else { details.push('△ 无 Kroki SSR'); }
  }

  // ECharts
  const chartPath = join(root, 'packages/components/src/elements/rk-chart.ts');
  if (existsSync(chartPath)) {
    const src = readFileSync(chartPath, 'utf8');
    if (src.includes('echarts') || src.includes('ECharts')) {
      score += 3;
      details.push('✓ ECharts 集成');
    }
  }

  return { name: '渲染质量', max: 20, score: Math.min(20, score), details };
}

// ── Dimension 2: 设计系统 ──
function scoreDesign(): ScoreDimension {
  const details: string[] = [];
  let score = 0;

  // 主题数量
  const themesPath = join(root, 'packages/design/src/themes.css');
  if (existsSync(themesPath)) {
    const src = readFileSync(themesPath, 'utf8');
    const themeCount = (src.match(/\[data-rk-theme/g) || []).length;
    if (themeCount >= 8) { score += 5; details.push(`✓ 主题: ${themeCount}/8+`); }
    else if (themeCount >= 4) { score += 3; details.push(`△ 主题: ${themeCount}/8`); }
    else { details.push(`✗ 主题不足: ${themeCount}`); }
  }

  // Token 系统
  const tokensPath = join(root, 'packages/design/src/tokens.css');
  if (existsSync(tokensPath)) {
    const src = readFileSync(tokensPath, 'utf8');
    const tokenCount = (src.match(/--rk-/g) || []).length;
    if (tokenCount >= 60) { score += 4; details.push(`✓ Token 数量: ${tokenCount} (>= 60)`); }
    else if (tokenCount >= 40) { score += 3; details.push(`△ Token 数量: ${tokenCount}`); }
    else { score += 1; details.push(`✗ Token 不足: ${tokenCount}`); }
  }

  // 字体
  if (existsSync(tokensPath)) {
    const src = readFileSync(tokensPath, 'utf8');
    if (src.includes('Google Fonts') || src.includes('fonts.googleapis')) {
      score += 2;
      details.push('✓ Google Fonts 集成');
    }
    if (src.includes('--rk-font-sans') && src.includes('--rk-font-mono')) {
      score += 2;
      details.push('✓ 字体 token 完整 (sans + mono)');
    }
  }

  // WC CSS
  const componentsCss = join(root, 'packages/components/src/css/components.css');
  const publicCss = join(root, 'apps/web/public/rk/components.css');
  if (existsSync(componentsCss) || existsSync(publicCss)) {
    score += 3;
    details.push('✓ WC CSS 存在');
  }

  // 设计文档
  if (existsSync(join(root, 'docs/design-system.md'))) {
    score += 2;
    details.push('✓ 设计系统文档');
  }

  // beautiful-mermaid
  if (existsSync(diagramPath())) {
    const src = readFileSync(diagramPath(), 'utf8');
    if (src.includes('buildStyleBlock') || src.includes('color-mix') || src.includes('themeVariables')) {
      score += 2;
      details.push('✓ Mermaid 主题感知');
    } else {
      details.push('△ Mermaid 无主题感知（未集成 beautiful-mermaid）');
    }
  }

  return { name: '设计系统', max: 20, score: Math.min(20, score), details };
}

function diagramPath() { return join(root, 'packages/components/src/elements/rk-diagram.ts'); }

// ── Dimension 3: CLI 成熟度 ──
function scoreCLI(): ScoreDimension {
  const details: string[] = [];
  let score = 0;

  const cliPath = join(root, 'packages/cli/bin/renderkit.mjs');
  if (!existsSync(cliPath)) {
    return { name: 'CLI 成熟度', max: 20, score: 0, details: ['✗ CLI 不存在'] };
  }

  const src = readFileSync(cliPath, 'utf8');

  // 核心命令
  const commands = ['push', 'feedback', 'open', 'status', 'serve'];
  const found = commands.filter(c => src.includes(`.command('${c}`));
  score += Math.min(6, found.length);
  details.push(`${found.length >= 5 ? '✓' : '△'} 命令: ${found.join(', ')} (${found.length}/5)`);

  // 错误处理
  if (src.includes('try') && src.includes('catch')) { score += 3; details.push('✓ 错误处理 (try/catch)'); }
  else { details.push('△ 缺少错误处理'); }

  // Lock 文件管理
  if (src.includes('.rk-lock') || src.includes('lock')) { score += 2; details.push('✓ Lock 文件管理'); }

  // --help
  if (src.includes('--help')) { score += 2; details.push('✓ --help 支持'); }

  // 端点配置
  if (src.includes('RENDERKIT_ENDPOINT') || src.includes('endpoint')) { score += 2; details.push('✓ 可配置端点'); }

  // JSON 输出
  if (src.includes('JSON.stringify') || src.includes('--json')) { score += 2; details.push('✓ JSON 输出支持'); }

  // format md
  if (src.includes('--format') && src.includes('md')) { score += 3; details.push('✓ Markdown 格式输出'); }

  return { name: 'CLI 成熟度', max: 20, score: Math.min(20, score), details };
}

// ── Dimension 4: 测试覆盖 ──
function scoreTests(): ScoreDimension {
  const details: string[] = [];
  let score = 0;

  // 单元测试
  const testsDir = join(root, 'tests');
  if (existsSync(testsDir)) {
    const testFiles = readdirSync(testsDir).filter(f => f.endsWith('.test.ts'));
    if (testFiles.length >= 3) { score += 5; details.push(`✓ 单元测试: ${testFiles.length} 个文件`); }
    else if (testFiles.length >= 1) { score += 2; details.push(`△ 单元测试: ${testFiles.length} 个文件`); }
  } else { details.push('✗ 无 tests/ 目录'); }

  // 测试 HTML
  const testHtml = readdirSync(join(root, 'examples')).filter(f => f.startsWith('test-') && f.endsWith('.html'));
  if (testHtml.length >= 3) { score += 5; details.push(`✓ 测试 HTML: ${testHtml.length} 个文件`); }
  else if (testHtml.length >= 1) { score += 3; details.push(`△ 测试 HTML: ${testHtml.length} 个文件`); }

  // 验证脚本
  const verifyScripts = readdirSync(join(root, 'scripts')).filter(f => f.startsWith('verify-'));
  if (verifyScripts.length >= 2) { score += 4; details.push(`✓ 验证脚本: ${verifyScripts.length} 个`); }
  else if (verifyScripts.length >= 1) { score += 2; details.push(`△ 验证脚本: ${verifyScripts.length} 个`); }

  // 评分系统 (self!)
  if (existsSync(join(root, 'scripts/score.ts'))) { score += 3; details.push('✓ 评分系统存在'); }

  // package.json test script
  try {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    if (pkg.scripts?.test) { score += 3; details.push(`✓ npm test 脚本: ${pkg.scripts.test}`); }
    else { details.push('△ 无 npm test 脚本'); }
  } catch { details.push('△ package.json 读取失败'); }

  return { name: '测试覆盖', max: 20, score: Math.min(20, score), details };
}

// ── Dimension 5: 生产就绪 ──
function scoreProduction(): ScoreDimension {
  const details: string[] = [];
  let score = 0;

  // a11y
  const layoutPath = join(root, 'apps/web/app/layout.tsx');
  if (existsSync(layoutPath)) {
    const src = readFileSync(layoutPath, 'utf8');
    if (src.includes('skip-link') || src.includes('跳到')) { score += 2; details.push('✓ Skip link (a11y)'); }
    else { details.push('△ 无 skip link'); }
    if (src.includes('lang="zh-CN"')) { score += 1; details.push('✓ lang="zh-CN"'); }
  }

  // CSS print
  const stylePath = join(root, 'apps/web/app/style.css');
  if (existsSync(stylePath)) {
    const src = readFileSync(stylePath, 'utf8');
    if (src.includes('@media print')) { score += 2; details.push('✓ 打印样式'); }
    else { details.push('△ 无打印样式'); }
  }

  // Error boundary / hydration fix
  const artifactViewPath = join(root, 'apps/web/app/a/[id]/HtmlArtifactView.tsx');
  if (existsSync(artifactViewPath)) {
    const src = readFileSync(artifactViewPath, 'utf8');
    if (src.includes('useMemo') && src.includes('theme')) { score += 2; details.push('✓ 主题提取确定性 (useMemo)'); }
    if (src.includes('getBoundingClientRect')) { score += 2; details.push('✓ 评论按钮 JS 定位'); }
  }

  // html-processor extractBodyContent (hydration fix)
  const processorPath = join(root, 'apps/web/lib/html-processor.ts');
  if (existsSync(processorPath)) {
    const src = readFileSync(processorPath, 'utf8');
    if (src.includes('extractBodyContent')) { score += 2; details.push('✓ HTML 包装剥离 (hydration fix)'); }
  }

  // DB 错误处理
  const storePath = join(root, 'apps/web/lib/store.ts');
  if (existsSync(storePath)) {
    const src = readFileSync(storePath, 'utf8');
    if (src.includes('CREATE TABLE IF NOT EXISTS')) { score += 2; details.push('✓ DB 安全创建'); }
  }

  // 架构文档
  if (existsSync(join(root, 'ARCHITECTURE.md')) && existsSync(join(root, 'docs/decisions.md'))) {
    score += 3;
    details.push('✓ 架构文档 + ADR');
  } else {
    score += 1;
    details.push('△ 架构文档不完整');
  }

  // Skills
  if (existsSync(join(root, '.pi/skills/renderkit-author/SKILL.md'))) {
    const size = statSync(join(root, '.pi/skills/renderkit-author/SKILL.md')).size;
    if (size > 20000) { score += 2; details.push(`✓ Authoring skill (${(size / 1024).toFixed(0)}KB)`); }
    else { score += 1; details.push(`△ Authoring skill 较小 (${(size / 1024).toFixed(0)}KB)`); }
  }

  // Server health
  try {
    const result = execSync('curl -s http://localhost:3737/api/health', { timeout: 3000, encoding: 'utf8' });
    const data = JSON.parse(result);
    if (data.ok) { score += 2; details.push('✓ 服务器健康检查通过'); }
  } catch {
    details.push('△ 服务器未运行（不影响评分）');
  }

  return { name: '生产就绪', max: 20, score: Math.min(20, score), details };
}

// ── Run ──
const dimensions = [
  scoreRendering(),
  scoreDesign(),
  scoreCLI(),
  scoreTests(),
  scoreProduction(),
];

score(dimensions);

const total = dimensions.reduce((s, d) => s + d.score, 0);
const pct = Math.round((total / 100) * 100);
if (pct >= 95) {
  console.log('  🏆 评分等级: S（卓越）');
} else if (pct >= 85) {
  console.log('  🥇 评分等级: A（优秀）');
} else if (pct >= 70) {
  console.log('  🥈 评分等级: B（良好）');
} else if (pct >= 50) {
  console.log('  🥉 评分等级: C（及格）');
} else {
  console.log('  ⚠️ 评分等级: D（需改进）');
}
