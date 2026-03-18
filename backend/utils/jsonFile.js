const fs = require('fs');
const path = require('path');

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e && (e.code === 'ENOENT' || e.name === 'SyntaxError')) return fallback;
    return fallback;
  }
}

function writeJsonAtomic(filePath, data) {
  ensureDirForFile(filePath);
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

module.exports = { readJson, writeJsonAtomic };

