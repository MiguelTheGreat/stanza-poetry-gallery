const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const { INITIAL_COLLECTION } = require('./data/seed');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'stanza.db');
const PUBLIC_DIR = path.join(__dirname, 'docs');

// ============================================
// SQLITE DATABASE INITIALIZATION (Node 24 Built-in)
// ============================================
const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    volume TEXT NOT NULL,
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    epigraph TEXT DEFAULT '',
    author TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    accent_color TEXT DEFAULT '#a67c52',
    ambient_glow TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS poems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT DEFAULT '',
    mood TEXT DEFAULT '',
    accent_hex TEXT DEFAULT '#a67c52',
    glow TEXT DEFAULT '',
    watercolor_rgb TEXT DEFAULT '166, 124, 82',
    stanzas_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collection_id, slug),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    collection_slug TEXT NOT NULL,
    poem_slug TEXT NOT NULL,
    lines_json TEXT NOT NULL,
    card_style TEXT NOT NULL DEFAULT 'museum',
    show_title INTEGER NOT NULL DEFAULT 1,
    music_code TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

function seedIfEmpty() {
  const existing = db.prepare('SELECT id FROM collections WHERE slug = ?').get(INITIAL_COLLECTION.slug);
  if (existing) return;

  const insertCol = db.prepare(`
    INSERT INTO collections (slug, volume, year, title, subtitle, epigraph, author, cover_image, accent_color, ambient_glow)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const res = insertCol.run(
    INITIAL_COLLECTION.slug,
    INITIAL_COLLECTION.volume,
    INITIAL_COLLECTION.year,
    INITIAL_COLLECTION.title,
    INITIAL_COLLECTION.subtitle,
    INITIAL_COLLECTION.epigraph,
    INITIAL_COLLECTION.author,
    INITIAL_COLLECTION.coverImage,
    INITIAL_COLLECTION.accentColor,
    INITIAL_COLLECTION.ambientGlow
  );

  const collectionId = res.lastInsertRowid;

  const insertPoem = db.prepare(`
    INSERT INTO poems (collection_id, slug, order_index, title, subtitle, mood, accent_hex, glow, watercolor_rgb, stanzas_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const poem of INITIAL_COLLECTION.poems) {
    insertPoem.run(
      collectionId,
      poem.slug,
      poem.orderIndex,
      poem.title,
      poem.subtitle,
      poem.mood,
      poem.accentHex,
      poem.glow,
      poem.watercolorRgb,
      JSON.stringify(poem.stanzas)
    );
  }
}

seedIfEmpty();

// ============================================
// EXPRESS SERVER & REST API
// ============================================
const app = express();
app.use(express.json({ limit: '1mb' }));

function formatCollectionRow(row, poemCount = 0) {
  return {
    id: row.id,
    slug: row.slug,
    volume: row.volume,
    year: row.year,
    title: row.title,
    subtitle: row.subtitle,
    epigraph: row.epigraph,
    author: row.author,
    coverImage: row.cover_image,
    accentColor: row.accent_color,
    ambientGlow: row.ambient_glow,
    poemCount
  };
}

function formatPoemRow(row, totalPoems) {
  const pad = (n) => String(n).padStart(2, '0');
  return {
    id: row.id,
    slug: row.slug,
    orderIndex: row.order_index,
    indexLabel: `${pad(row.order_index)} / ${pad(totalPoems)}`,
    watermark: pad(row.order_index),
    title: row.title,
    subtitle: row.subtitle,
    mood: row.mood,
    accentHex: row.accent_hex,
    glow: row.glow,
    watercolorRgb: row.watercolor_rgb,
    stanzas: JSON.parse(row.stanzas_json)
  };
}

// List all collections on the shelf
app.get('/api/collections', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, COUNT(p.id) AS poem_count
    FROM collections c
    LEFT JOIN poems p ON p.collection_id = c.id
    GROUP BY c.id
    ORDER BY c.id ASC
  `).all();

  res.json(rows.map((r) => formatCollectionRow(r, r.poem_count)));
});

// Get a single collection with all its poems
app.get('/api/collections/:slug', (req, res) => {
  const col = db.prepare('SELECT * FROM collections WHERE slug = ?').get(req.params.slug);
  if (!col) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  const poemRows = db.prepare('SELECT * FROM poems WHERE collection_id = ? ORDER BY order_index ASC, id ASC').all(col.id);
  const formatted = formatCollectionRow(col, poemRows.length);
  formatted.poems = poemRows.map((p) => formatPoemRow(p, poemRows.length));
  res.json(formatted);
});

// Create a new collection (allows the poet to expand the shelf)
app.post('/api/collections', (req, res) => {
  const { title, subtitle, epigraph, author, year, accentColor, poems } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Collection title is required' });
  }

  const countRow = db.prepare('SELECT COUNT(*) AS cnt FROM collections').get();
  const volNum = String((countRow?.cnt || 0) + 1).padStart(2, '0');
  let slug = slugify(title);
  if (db.prepare('SELECT id FROM collections WHERE slug = ?').get(slug)) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const accent = accentColor || '#a67c52';
  const ambientGlow = `radial-gradient(circle at 50% 45%, rgba(166, 124, 82, 0.28) 0%, rgba(196, 168, 134, 0.14) 45%, transparent 75%)`;

  const result = db.prepare(`
    INSERT INTO collections (slug, volume, year, title, subtitle, epigraph, author, cover_image, accent_color, ambient_glow)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    slug,
    `VOL. ${volNum}`,
    String(year || new Date().getFullYear()),
    String(title).trim(),
    String(subtitle || 'Original Poetry Collection').trim(),
    String(epigraph || '').trim(),
    String(author || '').trim(),
    '',
    accent,
    ambientGlow
  );

  const collectionId = result.lastInsertRowid;
  const insertPoem = db.prepare(`
    INSERT INTO poems (collection_id, slug, order_index, title, subtitle, mood, accent_hex, glow, watercolor_rgb, stanzas_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const parsedPoems = Array.isArray(poems) && poems.length > 0 ? poems : [];
  parsedPoems.forEach((p, idx) => {
    const pTitle = String(p.title || `Untitled ${idx + 1}`).trim();
    const pSlug = slugify(pTitle) + (idx > 0 ? `-${idx + 1}` : '');
    const stanzas = Array.isArray(p.stanzas)
      ? p.stanzas
      : String(p.body || '')
          .trim()
          .split(/\n\s*\n/)
          .map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean))
          .filter((block) => block.length > 0);

    if (stanzas.length > 0) {
      insertPoem.run(
        collectionId,
        pSlug,
        idx + 1,
        pTitle,
        String(p.subtitle || `Poem ${idx + 1}`).trim(),
        String(p.mood || 'Archival Ink').trim(),
        accent,
        ambientGlow,
        '166, 124, 82',
        JSON.stringify(stanzas)
      );
    }
  });

  res.status(201).json({ slug, volume: `VOL. ${volNum}` });
});

// Add a poem to an existing collection
app.post('/api/collections/:slug/poems', (req, res) => {
  const col = db.prepare('SELECT * FROM collections WHERE slug = ?').get(req.params.slug);
  if (!col) return res.status(404).json({ error: 'Collection not found' });

  const { title, subtitle, body } = req.body || {};
  if (!title || !body) {
    return res.status(400).json({ error: 'Poem title and body are required' });
  }

  const stanzas = String(body)
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((block) => block.length > 0);

  if (stanzas.length === 0) {
    return res.status(400).json({ error: 'Poem must contain at least one line' });
  }

  const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), 0) AS m FROM poems WHERE collection_id = ?').get(col.id);
  const orderIndex = (maxOrder?.m || 0) + 1;
  let poemSlug = slugify(title);
  if (db.prepare('SELECT id FROM poems WHERE collection_id = ? AND slug = ?').get(col.id, poemSlug)) {
    poemSlug = `${poemSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  db.prepare(`
    INSERT INTO poems (collection_id, slug, order_index, title, subtitle, mood, accent_hex, glow, watercolor_rgb, stanzas_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    col.id,
    poemSlug,
    orderIndex,
    String(title).trim(),
    String(subtitle || `Study ${orderIndex}`).trim(),
    'Archival Ink',
    col.accent_color || '#a67c52',
    col.ambient_glow || '',
    '166, 124, 82',
    JSON.stringify(stanzas)
  );

  res.status(201).json({ slug: poemSlug, orderIndex });
});

// Create a persisted Share Card (max 4 lines enforced server-side as well)
app.post('/api/shares', (req, res) => {
  const { collectionSlug, poemSlug, lines, cardStyle, showTitle, musicCode } = req.body || {};

  if (!collectionSlug || !poemSlug) {
    return res.status(400).json({ error: 'collectionSlug and poemSlug are required' });
  }
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 4) {
    return res.status(400).json({ error: 'Please select between 1 and 4 lines to share.' });
  }

  const allowedStyles = ['etched', 'museum', 'noir', 'broadsheet', 'atmosphere', 'keepsake'];
  const safeStyle = allowedStyles.includes(cardStyle) ? cardStyle : 'etched';
  const cleanLines = lines.slice(0, 4).map((l) => String(l).trim()).filter(Boolean);
  if (cleanLines.length === 0) {
    return res.status(400).json({ error: 'Selected lines cannot be empty.' });
  }

  const id = crypto.randomBytes(5).toString('hex');
  db.prepare(`
    INSERT INTO shares (id, collection_slug, poem_slug, lines_json, card_style, show_title, music_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    String(collectionSlug),
    String(poemSlug),
    JSON.stringify(cleanLines),
    safeStyle,
    showTitle === false ? 0 : 1,
    String(musicCode || '').slice(0, 120)
  );

  res.status(201).json({
    id,
    path: `/share/${id}`
  });
});

// Retrieve a persisted Share Card
app.get('/api/shares/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM shares WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Shared card not found' });
  }

  const col = db.prepare('SELECT * FROM collections WHERE slug = ?').get(row.collection_slug);
  const poem = col
    ? db.prepare('SELECT * FROM poems WHERE collection_id = ? AND slug = ?').get(col.id, row.poem_slug)
    : null;
  const totalPoems = col
    ? db.prepare('SELECT COUNT(*) AS cnt FROM poems WHERE collection_id = ?').get(col.id)?.cnt || 1
    : 1;

  res.json({
    id: row.id,
    collectionSlug: row.collection_slug,
    poemSlug: row.poem_slug,
    lines: JSON.parse(row.lines_json),
    cardStyle: row.card_style,
    showTitle: Boolean(row.show_title),
    musicCode: row.music_code || '',
    collection: col ? formatCollectionRow(col, totalPoems) : null,
    poem: poem ? formatPoemRow(poem, totalPoems) : null
  });
});

// Dynamic OpenGraph SSR route for shared links
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

app.get('/share/:id', (req, res) => {
  const galleryHtmlPath = path.join(PUBLIC_DIR, 'gallery.html');
  let html = fs.readFileSync(galleryHtmlPath, 'utf8');

  const row = db.prepare('SELECT * FROM shares WHERE id = ?').get(req.params.id);
  if (row) {
    const col = db.prepare('SELECT * FROM collections WHERE slug = ?').get(row.collection_slug);
    const poem = col
      ? db.prepare('SELECT * FROM poems WHERE collection_id = ? AND slug = ?').get(col.id, row.poem_slug)
      : null;
    const lines = JSON.parse(row.lines_json);
    const excerpt = escapeHtml(lines.join(' / '));
    const title = escapeHtml(poem ? `${poem.title} — ${col.title}` : 'Stanza. Shared Verse');

    html = html
      .replace(/<title>.*?<\/title>/, `<title>${title} | Stanza.</title>`)
      .replace(/content="Explore the Stanza\. poetry exhibition[^"]*"/, `content="${excerpt}"`)
      .replace(/property="og:title" content="[^"]*"/, `property="og:title" content="${title}"`)
      .replace(/property="og:description" content="[^"]*"/, `property="og:description" content="${excerpt}"`);
  }

  res.send(html);
});

// Serve static frontend files
app.use(express.static(PUBLIC_DIR));

// Clean routes
app.get('/gallery', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'gallery.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Stanza. Poetry House running at http://localhost:${PORT}`);
});
