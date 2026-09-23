#!/usr/bin/env node
/**
 * Extracts plain text from the downloadable library (public/recursos/**) into
 * src/data/recursos-text.json — consumed by src/lib/ask-ai/rag/sources.ts
 * so the copilot describes documents from their real content.
 *
 * Zero-dependency DOCX/XLSX text extraction (Office files are ZIPs):
 * parses the central directory, inflates word/document.xml or
 * xl/sharedStrings.xml + worksheets, strips XML tags.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'public/recursos');
const OUT = path.join(ROOT, 'src/data/recursos-text.json');

// ── Minimal ZIP reader (store + deflate) ────────────────────────────────────

function readZipEntry(buf, wanted) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 70000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP: end-of-central-directory not found');

  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < buf.readUInt16LE(eocd + 10); n++) {
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (name === wanted) {
      const lho = buf.readUInt32LE(p + 42);
      const lhNameLen = buf.readUInt16LE(lho + 26);
      const lhExtraLen = buf.readUInt16LE(lho + 28);
      const start = lho + 30 + lhNameLen + lhExtraLen;
      const raw = buf.subarray(start, start + csize);
      return (method === 8 ? zlib.inflateRawSync(raw) : Buffer.from(raw)).toString('utf8');
    }
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return null;
}

// ── Text extraction per format ──────────────────────────────────────────────

const decodeEntities = (s) => s
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number.parseInt(d, 10)))
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&amp;/g, '&');

function docxText(buf) {
  const xml = readZipEntry(buf, 'word/document.xml');
  if (!xml) return '';
  const paras = xml
    .split(/<\/w:p>/)
    .map((chunk) =>
      chunk
        .replace(/<(?:w:tab|w:br)\b[^>]*\/?>/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .map(decodeEntities);
  return paras.join('\n');
}

function xlsxText(buf) {
  const sst = readZipEntry(buf, 'xl/sharedStrings.xml');
  const strings = [];
  if (sst) {
    for (const m of sst.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      const text = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (text) strings.push(decodeEntities(text));
    }
  }
  const lines = [...strings];
  // Cell values from worksheets (inline strings + shared-string/numeric refs)
  const sheetNames = ['sheet1.xml', 'sheet2.xml', 'sheet3.xml'];
  for (const sheet of sheetNames) {
    const xml = readZipEntry(buf, `xl/worksheets/${sheet}`);
    if (!xml) continue;
    for (const cell of xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cell[1];
      const inner = cell[2];
      if (!inner) continue;
      const type = /\bt="(\w+)"/.exec(attrs)?.[1];
      if (type === 'inlineStr') {
        const text = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (text) lines.push(decodeEntities(text));
      } else {
        const v = inner.match(/<v>([\s\S]*?)<\/v>/);
        if (!v) continue;
        if (type === 's') {
          const idx = Number.parseInt(v[1], 10);
          if (strings[idx]) lines.push(strings[idx]);
        } else {
          lines.push(v[1].trim());
        }
      }
    }
  }
  return lines.join('\n');
}

// ── Walk public/recursos ────────────────────────────────────────────────────

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.(docx|xlsx)$/i.test(e.name)) out.push(full);
  }
  return out;
}

const files = walk(DIR).sort();
const index = {};
let failed = 0;

for (const file of files) {
  // Keys are relative to public/ (e.g. 'recursos/estandares/X.docx') so they
  // match RecursoDocMeta.path and the site download URLs directly.
  const rel = path.relative(path.join(ROOT, 'public'), file).split(path.sep).join('/');
  try {
    const buf = fs.readFileSync(file);
    // Some corpus files are plain text (Markdown) with an Office extension —
    // fall back to a direct UTF-8 read when the ZIP signature is absent.
    const isZip = buf.length > 4 && buf.readUInt32LE(0) === 0x04034b50;
    const text = isZip
      ? (/\.xlsx$/i.test(rel) ? xlsxText(buf) : docxText(buf))
      : buf.toString('utf8');
    index[rel] = text;
    console.log(`✓ ${rel} — ${text.length} chars${isZip ? '' : ' (plaintext)'}`);
  } catch (err) {
    failed += 1;
    console.error(`✗ ${rel} — ${err.message}`);
    index[rel] = '';
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(`\n${Object.keys(index).length} files indexed → ${path.relative(ROOT, OUT)} (${failed} failed)`);
if (failed > 0) process.exit(1);
