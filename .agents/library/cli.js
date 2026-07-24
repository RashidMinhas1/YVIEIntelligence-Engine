const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

const dbPath = path.join(__dirname, 'data.json');

function loadDb() {
  if (!fs.existsSync(dbPath)) {
    return { titles: [], scripts: [], niches: [] };
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

const db = loadDb();

const command = process.argv[2];

if (command === 'search') {
  const query = process.argv[3];
  if (!query) {
    console.error("Usage: node cli.js search <query>");
    process.exit(1);
  }

  const allItems = [
    ...db.titles.map(t => ({ ...t, _type: 'title' })),
    ...db.scripts.map(s => ({ ...s, _type: 'script' })),
    ...db.niches.map(n => ({ ...n, _type: 'niche' }))
  ];

  const fuse = new Fuse(allItems, {
    keys: ['patternName', 'template', 'scriptFormatName', 'nicheName', 'notes'],
    threshold: 0.4,
    includeScore: true
  });

  const results = fuse.search(query);
  console.log(JSON.stringify(results.map(r => r.item), null, 2));
} else if (command === 'add-title') {
  let payloadStr = process.argv[3];
  if (!payloadStr) {
    console.error("Usage: node cli.js add-title <json_payload_or_file>");
    process.exit(1);
  }
  if (fs.existsSync(payloadStr)) {
    payloadStr = fs.readFileSync(payloadStr, 'utf8');
  }
  const payload = JSON.parse(payloadStr);
  payload.id = 't' + Date.now();
  db.titles.push(payload);
  saveDb(db);
  console.log("Successfully added title pattern:", payload.patternName);
} else if (command === 'add-script') {
  let payloadStr = process.argv[3];
  if (!payloadStr) {
    console.error("Usage: node cli.js add-script <json_payload_or_file>");
    process.exit(1);
  }
  if (fs.existsSync(payloadStr)) {
    payloadStr = fs.readFileSync(payloadStr, 'utf8');
  }
  const payload = JSON.parse(payloadStr);
  payload.id = 's' + Date.now();
  db.scripts.push(payload);
  saveDb(db);
  console.log("Successfully added script pattern:", payload.scriptFormatName);
} else if (command === 'add-niche') {
  let payloadStr = process.argv[3];
  if (!payloadStr) {
    console.error("Usage: node cli.js add-niche <json_payload_or_file>");
    process.exit(1);
  }
  if (fs.existsSync(payloadStr)) {
    payloadStr = fs.readFileSync(payloadStr, 'utf8');
  }
  const payload = JSON.parse(payloadStr);
  payload.id = 'n' + Date.now();
  db.niches.push(payload);
  saveDb(db);
  console.log("Successfully added niche:", payload.nicheName);
} else {
  console.log("Commands: search <query>, add-title <json>, add-script <json>, add-niche <json>");
}
