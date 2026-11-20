import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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
  let cleanUrl = decodeURI(req.url.split('?')[0]);
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
