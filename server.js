import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;
const DIST_DIR = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
  const filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  const contentType = mime.getType(filePath) || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Local copy of WebOasis running on: http://localhost:${PORT}`);
});
