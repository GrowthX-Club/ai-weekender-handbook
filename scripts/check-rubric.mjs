#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const valueAfter = flag => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};

const backendRoot = valueAfter('--backend-root');
const frontendRoot = valueAfter('--frontend-root');
const jsonOutput = args.includes('--json');
const failures = [];
const checks = [];

function check(condition, message) {
  checks.push({ ok: Boolean(condition), message });
  if (!condition) failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function sha256(contents) {
  return crypto.createHash('sha256').update(contents).digest('hex');
}

const current = read('rubric/CURRENT').trim();
const contractPath = `rubric/${current}/rubric.json`;
const contractSource = read(contractPath);
const contract = JSON.parse(contractSource);
const schema = JSON.parse(read('rubric/rubric.schema.json'));
const scoring = read('09-scoring.md');
const schedule = read('02-how-the-week-runs.md');
const buildProcess = read('08-build-process.md');
const welcome = read('01-welcome.md');
const readme = read('README.md');
const html = read('static-page/ai-immersion-handbook.html');
const publishHtml = read('static-page/ai-immersion-handbook.publish.html');
const STATIC_PAGE_CHARACTER_LIMIT = 1_024_000;
const SUBMISSION_URL = 'https://growthx.club/ai-immersion/submit';
const RUBRIC_FIT_COPY = new Map([
  ['Virality', 10],
  ['Revenue', 46],
  ['AI Agent as a Service', 26],
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countMatches(source, expression) {
  return [...source.matchAll(expression)].length;
}

function htmlWithoutNonVisibleRegions(source) {
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--([\s\S]*?)-->/g, '');
}

check(contract.version === current, `rubric/CURRENT matches contract version ${contract.version}`);
check(contract.version === '2.2.0', 'canonical rubric is version 2.2.0');
check(contract.score_formula === '(level - 1) * weight', 'base score formula is stable');
check(contract.tracks.length === 3, 'exactly three tracks are defined');
check(schema.$schema === 'https://json-schema.org/draft/2020-12/schema', 'rubric schema uses JSON Schema 2020-12');
check(schema.properties?.program?.const === contract.program, 'rubric schema locks the canonical program name');

const expectedTracks = new Map([
  ['virality', { stored: 'virality', publicName: 'Virality', max: 164 }],
  ['revenue', { stored: 'revenue', publicName: 'Revenue', max: 176 }],
  ['agent_as_a_service', { stored: 'maas', publicName: 'AI Agent as a Service', max: 164 }],
]);
const expectedParameters = new Map([
  ['virality.impressions', { track: 'virality', publicName: 'Impressions and views', weight: 1, max: 4 }],
  ['virality.reactions', { track: 'virality', publicName: 'Reactions and comments', weight: 2, max: 8 }],
  ['virality.amplification', { track: 'virality', publicName: 'Amplification quality', weight: 3, max: 12 }],
  ['virality.visitors', { track: 'virality', publicName: 'Visitors to product', weight: 10, max: 40 }],
  ['virality.signups', { track: 'virality', publicName: 'Signups or meaningful actions', weight: 25, max: 100 }],
  ['revenue.signups', { track: 'revenue', publicName: 'Signups', weight: 20, max: 80 }],
  ['revenue.live_product_quality', { track: 'revenue', publicName: 'Live product quality', weight: 8, max: 32 }],
  ['revenue.revenue_generated', { track: 'revenue', publicName: 'Revenue generated (USD)', weight: 4, max: 16 }],
  ['revenue.waitlist', { track: 'revenue', publicName: 'Waitlist', weight: 4, max: 16 }],
  ['revenue.pain_severity', { track: 'revenue', publicName: 'Pain point severity', weight: 2, max: 8 }],
  ['revenue.som', { track: 'revenue', publicName: 'SOM (bottoms-up math)', weight: 2, max: 8 }],
  ['revenue.right_to_win', { track: 'revenue', publicName: 'Right to win', weight: 2, max: 8 }],
  ['revenue.why_now', { track: 'revenue', publicName: 'Why now', weight: 1, max: 4 }],
  ['revenue.moat', { track: 'revenue', publicName: 'Moat and defensibility', weight: 1, max: 4 }],
  ['maas.real_output', { track: 'agent_as_a_service', publicName: 'Working product shipping real output', weight: 20, max: 80 }],
  ['maas.org_structure', { track: 'agent_as_a_service', publicName: 'Agent org structure', weight: 5, max: 20 }],
  ['maas.observability', { track: 'agent_as_a_service', publicName: 'Observability', weight: 7, max: 28 }],
  ['maas.evals', { track: 'agent_as_a_service', publicName: 'Evaluation and iteration', weight: 5, max: 20 }],
  ['maas.handoffs_memory', { track: 'agent_as_a_service', publicName: 'Agent handoffs and memory', weight: 2, max: 8 }],
  ['maas.cost_latency', { track: 'agent_as_a_service', publicName: 'Cost and latency per task', weight: 1, max: 4 }],
  ['maas.management_ui', { track: 'agent_as_a_service', publicName: 'Management UI', weight: 1, max: 4 }],
]);
const allParameters = [];

for (const track of contract.tracks) {
  const expected = expectedTracks.get(track.id);
  check(Boolean(expected), `track id ${track.id} is recognized`);
  if (expected) {
    check(track.stored_enum === expected.stored, `${track.id} stored enum is ${expected.stored}`);
    check(track.public_name === expected.publicName, `${track.id} public name is ${expected.publicName}`);
    check(track.base_max === expected.max, `${track.id} declared base max is ${expected.max}`);
  }

  let computedTrackMax = 0;
  for (const parameter of track.parameters) {
    allParameters.push(parameter);
    const expectedParameter = expectedParameters.get(parameter.id);
    check(Boolean(expectedParameter), `parameter id ${parameter.id} is canonical`);
    if (expectedParameter) {
      check(expectedParameter.track === track.id, `${parameter.id} belongs to ${track.id}`);
      check(parameter.public_name === expectedParameter.publicName, `${parameter.id} public name is canonical`);
      check(parameter.weight === expectedParameter.weight, `${parameter.id} weight is ${expectedParameter.weight}`);
      check(parameter.base_max === expectedParameter.max, `${parameter.id} base max is ${expectedParameter.max}`);
    }
    check(parameter.levels.length === 5, `${parameter.id} has exactly five level descriptors`);
    check(parameter.levels.every(level => typeof level === 'string' && level.trim()), `${parameter.id} level descriptors are non-empty strings`);
    check(
      parameter.base_max === parameter.weight * 4,
      `${parameter.id} base max ${parameter.base_max} equals four levels above L1 x weight ${parameter.weight}`,
    );
    computedTrackMax += parameter.base_max;
  }
  check(computedTrackMax === track.base_max, `${track.id} parameter maxima sum to ${track.base_max}`);
}

const parameterById = new Map(allParameters.map(parameter => [parameter.id, parameter]));
check(parameterById.size === allParameters.length, 'all parameter ids are unique');
check(allParameters.length === 21, 'all 21 rubric parameters are present');
for (const id of expectedParameters.keys()) check(parameterById.has(id), `canonical parameter ${id} is present`);

const expectedOverflow = new Map([
  ['virality.impressions', { startsAfter: 50000, unit: 'weighted_impressions', increment: 5000, points: 1 }],
  ['virality.reactions', { startsAfter: 600, unit: 'weighted_reactions', increment: 50, points: 2 }],
  ['virality.visitors', { startsAfter: 3000, unit: 'unique_visitors', increment: 300, points: 10 }],
  ['virality.signups', { startsAfter: 5000, unit: 'signups', increment: 200, points: 25 }],
  ['revenue.signups', { startsAfter: 750, unit: 'signups', increment: 100, points: 20 }],
  ['revenue.revenue_generated', { startsAfter: 2000, unit: 'usd_revenue', increment: 500, points: 15 }],
  ['revenue.waitlist', { startsAfter: 3000, unit: 'waitlist_entries', increment: 500, points: 4 }],
  ['maas.real_output', { startsAfter: 'L5', unit: 'additional_autonomous_real_tasks', increment: 1, points: 20 }],
]);
const overflowParameters = allParameters.filter(parameter => parameter.overflow);
check(overflowParameters.length === 8, 'exactly eight parameters have overflow');
for (const [id, expected] of expectedOverflow) {
  const overflow = parameterById.get(id)?.overflow;
  check(Boolean(overflow), `${id} has an overflow rule`);
  if (overflow) {
    check(overflow.starts_after === expected.startsAfter, `${id} overflow starts after ${expected.startsAfter}`);
    check(overflow.unit === expected.unit, `${id} overflow unit is ${expected.unit}`);
    check(overflow.increment === expected.increment, `${id} overflow increment is ${expected.increment}`);
    check(overflow.points_per_increment === expected.points, `${id} overflow awards ${expected.points} points per increment`);
  }
}

const revenueGenerated = parameterById.get('revenue.revenue_generated');
check(revenueGenerated?.weight === 4, 'Revenue generated base weight is 4');
check(revenueGenerated?.base_max === 16, 'Revenue generated base max is 16');
check(revenueGenerated?.overflow?.points_per_increment === 15, 'Revenue generated overflow rate is 15 points');

check(contract.evidence_rules.default_l4_l5_requirement === 'verifiable_evidence', 'L4 and L5 require verifiable evidence');
check(contract.evidence_rules.default_missing_evidence_cap_level === 3, 'default evidence gap cap is L3');
const visitorsOverride = contract.evidence_rules.parameter_overrides.find(rule => rule.parameter_id === 'virality.visitors');
check(visitorsOverride?.missing_evidence_cap_level === 2, 'Visitors without read-only analytics are capped at L2');
const agentOverride = contract.evidence_rules.parameter_overrides.find(rule => rule.parameter_id === 'maas.real_output');
check(agentOverride?.condition === 'staged_or_test_surface', 'AI Agent as a Service output override targets staged/test surfaces');
check(agentOverride?.cap_level === 3, 'staged AI Agent as a Service output is capped at L3');

check(contract.anti_spoof.length === 2, 'exactly two anti-spoof rules are defined');
const ctrRule = contract.anti_spoof.find(rule => rule.id === 'virality.impressions_to_visitors');
check(ctrRule?.rule === 'visitors <= weighted_impressions / 10', 'impressions-to-visitors rule enforces a 10% maximum CTR');
check(ctrRule?.max_ratio === 0.1, 'impressions-to-visitors maximum ratio is 0.1');
check(ctrRule?.penalty_parameter_id === 'virality.visitors', 'CTR breach penalizes Virality visitors');
check(ctrRule?.penalty_level === 1, 'CTR breach drops Virality visitors to L1');
check(ctrRule?.exception === 'verifiable_non_social_traffic_source', 'CTR rule preserves its evidence exception');
const conversionRule = contract.anti_spoof.find(rule => rule.id === 'virality.visitors_to_signups');
check(conversionRule?.rule === 'signups <= visitors / 2', 'visitors-to-signups rule enforces a 50% maximum conversion rate');
check(conversionRule?.max_ratio === 0.5, 'visitors-to-signups maximum ratio is 0.5');
check(conversionRule?.penalty_parameter_id === 'virality.signups', 'conversion breach penalizes Virality signups');
check(conversionRule?.penalty_level === 1, 'conversion breach drops Virality signups to L1');
check(conversionRule?.exception === 'verifiable_direct_share_source', 'conversion rule preserves its evidence exception');
check(contract.manual_review?.when === 'both_anti_spoof_rules_trigger', 'both anti-spoof flags trigger manual review');

check(contract.bonus.total_cap === 50, 'cross-track bonus is capped at 50 per builder');
check(contract.bonus.scope === 'per_builder', 'cross-track bonus cap is per builder');
check(contract.bonus.requires_same_evidence_as_primary === true, 'bonus claims require the same evidence as primary claims');
check(contract.bonus.eligible.length === 8, 'exactly eight parameters are bonus-eligible');
for (const bonus of contract.bonus.eligible) {
  const parameter = parameterById.get(bonus.parameter_id);
  check(Boolean(parameter), `${bonus.parameter_id} bonus maps to a canonical parameter`);
  if (parameter) {
    check(bonus.original_weight === parameter.weight, `${bonus.parameter_id} bonus original weight matches base weight`);
    check(bonus.bonus_weight === parameter.weight * 0.5, `${bonus.parameter_id} bonus weight is half the base weight`);
    check(bonus.max_bonus === bonus.bonus_weight * 4, `${bonus.parameter_id} maximum bonus matches L5 math`);
  }
}

function parseMarkdownParameters(source) {
  return [...source.matchAll(/^\| \*\*(.+?)\*\*[^|\n]*\|\s*([0-9.]+)x\s*\|\s*([0-9.]+)\s*\|/gm)].map(
    match => ({ publicName: match[1], weight: Number(match[2]), max: Number(match[3]) }),
  );
}

function parseHtmlParameters(source) {
  return [...source.matchAll(
    /<span class="param-name">([^<]+)<\/span>[\s\S]*?<td class="weight-cell">([0-9.]+)x<\/td>\s*<td class="max-cell">([0-9.]+)<\/td>/g,
  )].map(match => ({ publicName: match[1], weight: Number(match[2]), max: Number(match[3]) }));
}

function checkHumanProjection(parameters, label) {
  check(parameters.length === 21, `${label} contains exactly 21 parameter rows`);
  const byName = new Map(parameters.map(parameter => [parameter.publicName, parameter]));
  check(byName.size === parameters.length, `${label} parameter names are unique`);
  for (const canonical of expectedParameters.values()) {
    const parameter = byName.get(canonical.publicName);
    check(Boolean(parameter), `${label} contains ${canonical.publicName}`);
    if (parameter) {
      check(parameter.weight === canonical.weight, `${label} ${canonical.publicName} weight matches ${canonical.weight}`);
      check(parameter.max === canonical.max, `${label} ${canonical.publicName} max matches ${canonical.max}`);
    }
  }
}

checkHumanProjection(parseMarkdownParameters(scoring), 'Markdown rubric');
checkHumanProjection(parseHtmlParameters(html), 'Static source rubric');
checkHumanProjection(parseHtmlParameters(publishHtml), 'Publish candidate rubric');

const requiredScheduleCopy = [
  'Thursday 30 Jul — Live, 8pm',
  'Friday 31 Jul — Live, 8pm Q&A',
  'Saturday 1 Aug — Live, 11am Q&A',
  'Sunday 2 Aug — Morning Q&A; submit by 8pm IST',
  'This is an individual review, not a ranking.',
];
for (const phrase of requiredScheduleCopy) {
  check(schedule.includes(phrase), `Markdown schedule contains: ${phrase}`);
}

const requiredBuildProcessCopy = [
  '### Thursday night — lock the idea and start the waitlist',
  '### Friday midnight — some params at L2',
  '### Saturday — push to L3',
  '### Sunday 8pm IST — final submission',
  'launch it by Friday 11am',
  'Ship by Sunday 8pm IST',
];
for (const phrase of requiredBuildProcessCopy) {
  check(buildProcess.includes(phrase), `Build process contains: ${phrase}`);
}

for (const [label, source] of [
  ['Markdown schedule', schedule],
  ['Markdown build process', buildProcess],
]) {
  const visibleMarkdownLink = new RegExp(`\\[[^\\]]+\\]\\(${escapeRegExp(SUBMISSION_URL)}\\)`);
  check(visibleMarkdownLink.test(source), `${label} contains a visible canonical submission link`);
}

const requiredWelcomeCopy = [
  'There are five levels people sit at with AI right now.',
  'from wherever you\'re starting to L5.',
  '### L5 — The finish line · the AI-first leader',
  '### L1 to L5. Four days.',
  'You **build and you distribute**.',
];
for (const phrase of requiredWelcomeCopy) {
  check(welcome.includes(phrase), `Markdown welcome contains: ${phrase}`);
}
check(readme.includes('L1→L5 ladder'), 'README describes the five-level welcome ladder');
const welcomeLevelSections = [...welcome.matchAll(/^### L([1-5])\s+—/gm)].map(match => match[1]);
for (const level of ['1', '2', '3', '4', '5']) {
  check(
    welcomeLevelSections.filter(candidate => candidate === level).length === 1,
    `Markdown welcome contains exactly one L${level} level section`,
  );
}
check(welcomeLevelSections.length === 5, 'Markdown welcome contains exactly five L1-L5 level sections');
for (const phrase of ['L1 to L4', 'four levels people sit at', 'lose one month of membership', 'Removed from Slack']) {
  check(!welcome.includes(phrase), `Markdown welcome omits stale copy: ${phrase}`);
}

const requiredScoringCopy = [
  'Canonical rubric version: 2.2.0',
  '# 🤖 AI Agent as a Service rubric',
  '| **Revenue generated (USD)**',
  '| 4x | 16 | $0 |',
  '(2-1) × 4 = 4 pts',
  '# Exact overflow and evidence rules',
  '50-point cap per builder',
  'visitors exceed weighted impressions ÷ 10',
  'signups exceed visitors ÷ 2',
];
for (const phrase of requiredScoringCopy) {
  check(scoring.includes(phrase), `Markdown scoring contains: ${phrase}`);
}

const requiredHtmlCopy = [
  'Thu 8pm, Fri 8pm, Sat 11am, and Sun morning',
  '<div class="week-day-date">30 Jul</div>',
  '<div class="week-day-date">31 Jul</div>',
  '<div class="week-day-date">1 Aug</div>',
  '<div class="week-day-date">2 Aug</div>',
  'Final submission by 8pm IST',
  'Canonical rubric version: 2.2.0',
  '<td class="weight-cell">4x</td>',
  '(2-1) × 4 = 4 pts',
  'Exactly eight parameters overflow',
  '50-point cap per builder',
];
for (const [label, source] of [['Static source', html], ['Publish candidate', publishHtml]]) {
  const visibleHtml = htmlWithoutNonVisibleRegions(source);
  for (const phrase of requiredHtmlCopy) {
    check(source.includes(phrase), `${label} contains: ${phrase}`);
  }
  const visibleSubmissionLink = new RegExp(
    `<a\\b[^>]*\\bhref=["']${escapeRegExp(SUBMISSION_URL)}["'][^>]*>[^<]+<\\/a>`,
    'i',
  );
  check(visibleSubmissionLink.test(visibleHtml), `${label} contains a visible canonical submission link`);

  let rubricFitTotal = 0;
  for (const [track, expectedCount] of RUBRIC_FIT_COPY) {
    const expression = new RegExp(
      `<h4>Rubric fit<\\/h4><p>Use only the ${escapeRegExp(track)} parameter ladders and evidence rules on the Scoring page\\.<\\/p>`,
      'g',
    );
    const actualCount = countMatches(visibleHtml, expression);
    rubricFitTotal += actualCount;
    check(actualCount === expectedCount, `${label} contains exactly ${expectedCount} ${track} Rubric fit blocks`);
  }
  check(rubricFitTotal === 82, `${label} contains exactly 82 track-specific Rubric fit blocks`);

  for (const level of ['1', '2', '3', '4', '5']) {
    const levelExpression = new RegExp(`<div class="ai-level-num">L${level}<\\/div>`, 'g');
    check(
      countMatches(visibleHtml, levelExpression) === 1,
      `${label} welcome contains exactly one L${level} level block`,
    );
  }
  for (const phrase of [
    '<h4>Scores on</h4>',
    'Sarvam parameter',
    'Sarvam surfaces. This is the part that is scored',
    'Additional Sarvam calls do not raise',
    'where the score is',
    'Voice Experience',
    'Document Intelligence',
    'Memory and Context',
    'Job-to-be-done',
    'Weak on:',
    'This is the part that is scored',
  ]) {
    check(!source.toLowerCase().includes(phrase.toLowerCase()), `${label} omits legacy scoring copy: ${phrase}`);
  }
}

const requiredHtmlWelcomeCopy = [
  'There are five levels people sit at with AI right now.',
  'from wherever you\'re starting to L5.',
  'The finish line · the AI-first leader',
  'L1 to L5. Four days.',
  'build and you distribute',
];
for (const [label, source] of [['Static source', html], ['Publish candidate', publishHtml]]) {
  for (const phrase of requiredHtmlWelcomeCopy) {
    check(source.includes(phrase), `${label} welcome contains: ${phrase}`);
  }
  for (const phrase of ['L1 to L4', 'four levels people sit at', 'lose one month of membership', 'Removed from Slack']) {
    check(!source.includes(phrase), `${label} welcome omits stale copy: ${phrase}`);
  }
}

const staleClaims = [
  'tracking toward the top two',
  'Top two present',
  'Top two win',
  'Three evenings live',
  'all at 8pm',
  '50-point cap per team',
  'Revenue generated L3',
  '(2-1) × 15 = 15 pts',
  'Saturday 8pm — final submission',
  'Ship by Saturday 8pm',
  'Thursday midnight — some params at L2',
  'Friday — push to L3',
  'AI Agent As A Service',
];
const participantCopy = [schedule, buildProcess, scoring, html, publishHtml, read('install.sh')];
for (const phrase of staleClaims) {
  check(participantCopy.every(source => !source.includes(phrase)), `stale claim is absent: ${phrase}`);
}

const publishCharacters = [...publishHtml].length;
check(
  publishCharacters <= STATIC_PAGE_CHARACTER_LIMIT,
  `publish candidate has ${publishCharacters} characters within the ${STATIC_PAGE_CHARACTER_LIMIT} static-page limit`,
);
check(html.length > publishHtml.length, 'publish candidate is compacted from the editable static source');

const markdownFiles = fs.readdirSync(ROOT).filter(name => name.endsWith('.md'));
for (const file of markdownFiles) {
  const source = read(file);
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1].split('#')[0];
    if (!href || /^(https?:|mailto:)/.test(href)) continue;
    check(fs.existsSync(path.resolve(ROOT, href)), `${file} local link resolves: ${href}`);
  }
}

const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
for (const match of html.matchAll(/href="#([^"]+)"/g)) {
  check(htmlIds.has(match[1]), `static HTML fragment link resolves: #${match[1]}`);
}

function checkConsumer(root, kind) {
  if (!root) return;
  const resolved = path.resolve(root);
  if (kind === 'backend') {
    const parameterListPath = path.join(resolved, 'packages/services/buildathon-rubric-grader/prompts/parameter-list.ts');
    const rubricVersionPath = path.join(resolved, 'packages/services/buildathon-rubric-grader/prompts/rubric-version.ts');
    check(fs.existsSync(parameterListPath), `backend parameter list exists at ${parameterListPath}`);
    if (!fs.existsSync(parameterListPath)) return;
    const source = fs.readFileSync(parameterListPath, 'utf8');
    for (const parameter of allParameters) {
      const start = source.indexOf(`id: '${parameter.id}'`);
      check(start !== -1, `backend contains parameter ${parameter.id}`);
      if (start === -1) continue;
      const next = source.indexOf("\n    id: '", start + 1);
      const block = source.slice(start, next === -1 ? source.length : next);
      const weight = Number(block.match(/\bweight:\s*([0-9.]+)/)?.[1]);
      const max = Number(block.match(/\bmax:\s*([0-9.]+)/)?.[1]);
      check(weight === parameter.weight, `backend ${parameter.id} weight matches ${parameter.weight}`);
      check(max === parameter.base_max, `backend ${parameter.id} max matches ${parameter.base_max}`);
    }
    const versionSource = fs.readFileSync(rubricVersionPath, 'utf8');
    check(versionSource.includes(`RUBRIC_VERSION = '${contract.version}'`), `backend rubric version is ${contract.version}`);
  }

  if (kind === 'frontend') {
    const sourcePath = path.join(
      resolved,
      'modules/ai-weekender-buildathon/submit/constants/rubricMarkdown.ts',
    );
    check(fs.existsSync(sourcePath), `frontend rubric copy exists at ${sourcePath}`);
    if (!fs.existsSync(sourcePath)) return;
    const source = fs.readFileSync(sourcePath, 'utf8');
    for (const phrase of ['Canonical rubric version: 2.2.0', '# 🤖 AI Agent as a Service rubric', '(2-1) × 4 = 4 pts']) {
      check(source.includes(phrase), `frontend rubric copy contains: ${phrase}`);
    }
    for (const phrase of staleClaims) {
      check(!source.includes(phrase), `frontend rubric copy omits stale claim: ${phrase}`);
    }
  }
}

checkConsumer(backendRoot, 'backend');
checkConsumer(frontendRoot, 'frontend');

const result = {
  ok: failures.length === 0,
  version: contract.version,
  checks: checks.length,
  failures,
  hashes: {
    contract: sha256(contractSource),
    scoring_markdown: sha256(scoring),
    static_source_html: sha256(html),
    static_publish_html: sha256(publishHtml),
  },
};

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  for (const item of checks) process.stdout.write(`${item.ok ? 'PASS' : 'FAIL'} ${item.message}\n`);
  process.stdout.write(`\n${result.ok ? 'PASS' : 'FAIL'} ${checks.length} checks; rubric ${contract.version}\n`);
  process.stdout.write(`contract sha256 ${result.hashes.contract}\n`);
  process.stdout.write(`scoring sha256  ${result.hashes.scoring_markdown}\n`);
  process.stdout.write(`source sha256   ${result.hashes.static_source_html}\n`);
  process.stdout.write(`publish sha256  ${result.hashes.static_publish_html}\n`);
}

process.exit(result.ok ? 0 : 1);
