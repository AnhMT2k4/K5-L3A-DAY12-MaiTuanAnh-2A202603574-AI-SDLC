import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadLeaderboard, addLeaderboardEntry, saveLeaderboard } from './core/leaderboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Check CLI export argument: node src/server.js --export-leaderboard out.json
const args = process.argv.slice(2);
const exportIdx = args.indexOf('--export-leaderboard');
if (exportIdx !== -1) {
  const targetFile = args[exportIdx + 1] || 'out.json';
  const lbFile = path.join(ROOT_DIR, 'leaderboard.json');
  const entries = loadLeaderboard(lbFile);
  const outData = { entries };
  fs.writeFileSync(path.resolve(targetFile), JSON.stringify(outData, null, 2), 'utf-8');
  console.log(`✅ Đã xuất bảng xếp hạng ra: ${targetFile} (${entries.length} mục)`);
  process.exit(0);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const urlParts = req.url.split('?');
  let cleanUrl = decodeURI(urlParts[0]);

  // Leaderboard API
  if (cleanUrl === '/api/leaderboard') {
    const lbFile = path.join(ROOT_DIR, 'leaderboard.json');
    if (req.method === 'GET') {
      const entries = loadLeaderboard(lbFile);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ entries }));
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const entryData = JSON.parse(body);
          entryData.filePath = lbFile;
          const updated = addLeaderboardEntry(entryData);
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ entries: updated }));
        } catch (err) {
          res.writeHead(400, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  if (cleanUrl === '/' || cleanUrl === '') {
    cleanUrl = '/index.html';
  }

  // Candidate paths to check in order:
  const candidates = [
    path.join(ROOT_DIR, 'src', 'web', cleanUrl),
    path.join(ROOT_DIR, 'src', cleanUrl),
    path.join(ROOT_DIR, cleanUrl)
  ];

  let foundFile = null;
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        foundFile = c;
        break;
      }
    } catch (e) {
      // ignore
    }
  }

  if (!foundFile) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(foundFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(foundFile).pipe(res);
});

let currentPort = parseInt(process.env.PORT || '3000', 10);

function listen(port) {
  server.listen(port, () => {
    console.log(`\n==============================================`);
    console.log(`🏮 Đảo Đèn Lồng - Web 3D Server running!`);
    console.log(`🎮 Mở trên trình duyệt: http://localhost:${port}`);
    console.log(`==============================================\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = currentPort + 1;
    console.warn(`⚠️ Cổng ${currentPort} đang bận, tự động chuyển sang cổng ${nextPort}...`);
    currentPort = nextPort;
    setTimeout(() => listen(nextPort), 200);
  } else {
    console.error('Server error:', err);
  }
});

listen(currentPort);
