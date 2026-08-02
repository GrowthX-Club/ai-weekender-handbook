#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(ROOT, 'static-page/ai-immersion-handbook.html');
const publishPath = path.join(ROOT, 'static-page/ai-immersion-handbook.publish.html');
const STATIC_PAGE_CHARACTER_LIMIT = 1_024_000;
const SUBMISSION_URL = 'https://growthx.club/ai-immersion/submit';
const RUBRIC_FIT_COPY = new Map([
  ['Virality', 10],
  ['Revenue', 46],
  ['AI Agent as a Service', 26],
]);

if (process.argv.includes('--apply')) {
  throw new Error(
    'This repository prepares a publish artifact but never writes production. Obtain an explicit go-ahead and use the approved GrowthX static-page workflow.',
  );
}

function sha256(contents) {
  return crypto.createHash('sha256').update(contents).digest('hex');
}

function characterCount(contents) {
  return [...contents].length;
}

function minifyCss(source) {
  let output = '';
  let pendingSpace = false;
  let quote = null;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (quote) {
      output += character;
      if (character === '\\') {
        if (next !== undefined) {
          output += next;
          index += 1;
        }
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      if (end === -1) throw new Error('Unterminated CSS comment in static-page source');
      index = end + 1;
      pendingSpace = true;
      continue;
    }

    if (character === '"' || character === "'") {
      if (pendingSpace && output && !/[{}:;,>+~()]/.test(output.at(-1))) output += ' ';
      pendingSpace = false;
      quote = character;
      output += character;
      continue;
    }

    if (/\s/.test(character)) {
      pendingSpace = true;
      continue;
    }

    if (pendingSpace) {
      const previous = output.at(-1);
      if (
        previous &&
        !/[{}:;,>+~()]/.test(previous) &&
        !/[{}:;,>+~()]/.test(character)
      ) {
        output += ' ';
      }
      pendingSpace = false;
    }

    output += character;
  }

  if (quote) throw new Error('Unterminated CSS string in static-page source');
  return output.trim();
}

function compactHtml(source) {
  // Preserve scripts byte-for-byte and preserve preformatted builder prompts.
  // HTML whitespace outside those regions is collapsed; style blocks use the
  // small string-aware CSS compactor above.
  const rawRegion = /<(script|style|pre)\b[^>]*>[\s\S]*?<\/\1>/gi;
  let output = '';
  let previousEnd = 0;

  for (const match of source.matchAll(rawRegion)) {
    output += source.slice(previousEnd, match.index).replace(/\s+/g, ' ');
    const tagName = match[1].toLowerCase();

    if (tagName === 'style') {
      const openingEnd = match[0].indexOf('>') + 1;
      const closingStart = match[0].toLowerCase().lastIndexOf('</style>');
      output += match[0].slice(0, openingEnd);
      output += minifyCss(match[0].slice(openingEnd, closingStart));
      output += match[0].slice(closingStart);
    } else {
      output += match[0];
    }

    previousEnd = match.index + match[0].length;
  }

  output += source.slice(previousEnd).replace(/\s+/g, ' ');
  return `${output.trim()}\n`;
}

function extractRegionContents(source, tagName) {
  const expression = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  return [...source.matchAll(expression)].map(match => match[1]);
}

function tagInventory(source) {
  const inventory = new Map();
  for (const match of source.matchAll(/<([a-z][a-z0-9-]*)\b/gi)) {
    const name = match[1].toLowerCase();
    inventory.set(name, (inventory.get(name) ?? 0) + 1);
  }
  return Object.fromEntries([...inventory.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function sortedMatches(source, expression) {
  return [...source.matchAll(expression)].map(match => match[1]).sort();
}

function visibleTextSignature(source) {
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message);
}

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

function assertParticipantStructure(source, label) {
  const visibleHtml = htmlWithoutNonVisibleRegions(source);
  const visibleSubmissionLink = new RegExp(
    `<a\\b[^>]*\\bhref=["']${escapeRegExp(SUBMISSION_URL)}["'][^>]*>[^<]+<\\/a>`,
    'i',
  );
  if (!visibleSubmissionLink.test(visibleHtml)) {
    throw new Error(`${label} does not contain a visible canonical submission link`);
  }

  let rubricFitTotal = 0;
  for (const [track, expectedCount] of RUBRIC_FIT_COPY) {
    const expression = new RegExp(
      `<h4>Rubric fit<\\/h4><p>Use only the ${escapeRegExp(track)} parameter ladders and evidence rules on the Scoring page\\.<\\/p>`,
      'g',
    );
    const actualCount = countMatches(visibleHtml, expression);
    rubricFitTotal += actualCount;
    if (actualCount !== expectedCount) {
      throw new Error(`${label} has ${actualCount} ${track} Rubric fit blocks; expected ${expectedCount}`);
    }
  }
  if (rubricFitTotal !== 82) throw new Error(`${label} has ${rubricFitTotal} Rubric fit blocks; expected 82`);

  for (const level of ['1', '2', '3', '4', '5']) {
    const expression = new RegExp(`<div class="ai-level-num">L${level}<\\/div>`, 'g');
    const actualCount = countMatches(visibleHtml, expression);
    if (actualCount !== 1) throw new Error(`${label} has ${actualCount} L${level} welcome blocks; expected 1`);
  }
}

const source = fs.readFileSync(sourcePath, 'utf8');
const publishCandidate = compactHtml(source);

assertParticipantStructure(source, 'Static source');
assertParticipantStructure(publishCandidate, 'Publish candidate');

const required = [
  '<title>AI Immersion · Builder Handbook</title>',
  'Thursday',
  '30 Jul',
  'Saturday',
  '1 Aug',
  'Final submission by 8pm IST',
  'Canonical rubric version: 2.2.0',
  'AI Agent as a Service rubric',
  '(2-1) × 4 = 4 pts',
  SUBMISSION_URL,
];
const forbidden = [
  'tracking toward the top two',
  'Top two present',
  'Top two win',
  'Three evenings live',
  'all at 8pm',
  'Revenue generated L3',
  '(2-1) × 15 = 15 pts',
  'AI Agent As A Service',
];
const forbiddenCaseInsensitive = [
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
];

const missing = required.filter(value => !publishCandidate.includes(value));
const stale = [
  ...forbidden.filter(value => publishCandidate.includes(value)),
  ...forbiddenCaseInsensitive.filter(value => publishCandidate.toLowerCase().includes(value.toLowerCase())),
];
if (missing.length || stale.length) {
  throw new Error(`Publish copy check failed: ${JSON.stringify({ missing, stale })}`);
}

const sourceScripts = extractRegionContents(source, 'script');
const publishScripts = extractRegionContents(publishCandidate, 'script');
const sourcePre = extractRegionContents(source, 'pre');
const publishPre = extractRegionContents(publishCandidate, 'pre');

assertEqual(
  publishScripts.map(sha256),
  sourceScripts.map(sha256),
  'Publish candidate changed executable script content',
);
assertEqual(
  publishPre.map(sha256),
  sourcePre.map(sha256),
  'Publish candidate changed preformatted builder content',
);
assertEqual(tagInventory(publishCandidate), tagInventory(source), 'Publish candidate changed the HTML tag inventory');
assertEqual(
  sortedMatches(publishCandidate, /\sid="([^"]+)"/g),
  sortedMatches(source, /\sid="([^"]+)"/g),
  'Publish candidate changed element IDs',
);
assertEqual(
  sortedMatches(publishCandidate, /href="#([^"]+)"/g),
  sortedMatches(source, /href="#([^"]+)"/g),
  'Publish candidate changed fragment links',
);
assertEqual(
  visibleTextSignature(publishCandidate),
  visibleTextSignature(source),
  'Publish candidate changed visible text',
);

const sourceStats = {
  path: path.relative(ROOT, sourcePath),
  bytes: Buffer.byteLength(source),
  characters: characterCount(source),
  sha256: sha256(source),
};
const publishStats = {
  path: path.relative(ROOT, publishPath),
  bytes: Buffer.byteLength(publishCandidate),
  characters: characterCount(publishCandidate),
  sha256: sha256(publishCandidate),
};

if (publishStats.characters > STATIC_PAGE_CHARACTER_LIMIT) {
  throw new Error(
    `Publish candidate has ${publishStats.characters} characters; GrowthX static pages allow ${STATIC_PAGE_CHARACTER_LIMIT}`,
  );
}

fs.writeFileSync(publishPath, publishCandidate);

const manifest = {
  mode: 'dry-run',
  destination: 'https://growthx.club/docs/ai-immersion-handbook',
  slug: 'ai-immersion-handbook',
  title: 'AI Immersion · Builder Handbook',
  source: sourceStats,
  publish_candidate: publishStats,
  character_limit: STATIC_PAGE_CHARACTER_LIMIT,
  characters_remaining: STATIC_PAGE_CHARACTER_LIMIT - publishStats.characters,
  integrity: {
    visible_text_equal: true,
    tag_inventory_equal: true,
    element_ids_equal: true,
    fragment_links_equal: true,
    scripts_byte_identical: true,
    preformatted_content_byte_identical: true,
  },
  rubric_version: '2.2.0',
  production_write_attempted: false,
};

process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
