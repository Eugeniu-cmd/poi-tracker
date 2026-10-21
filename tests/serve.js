/* POI Tracker tests — a small static file server for the suite.
   Plain Node (http, fs, path, no packages). It serves the repository root
   on 127.0.0.1:8765, so the app under test is at http://localhost:8765/app/.
   The tests open it through the host name localhost: a secure context,
   which the app needs (crypto.randomUUID, the service worker, Web Locks).
   Started by playwright.config.js (webServer); can also run by hand:
   node serve.js
*/
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = 8765;
const ROOT = path.resolve(__dirname, '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.woff2': 'font/woff2'
};

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
  res.end(body);
}

function serve(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://' + HOST).pathname); }
  catch (err) { return send(res, 400, 'Bad request'); }
  // path.normalize folds every ".." away at the root, so nothing above ROOT is reachable
  const file = path.join(ROOT, path.normalize(pathname));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 404, 'Not found');
  fs.stat(file, function (err, st) {
    if (err) return send(res, 404, 'Not found');
    if (st.isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' }); return res.end(); }
      return serveFile(path.join(file, 'index.html'), req, res);
    }
    serveFile(file, req, res);
  });
}

function serveFile(file, req, res) {
  fs.readFile(file, function (err, data) {
    if (err) return send(res, 404, 'Not found');
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length, 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

http.createServer(serve).listen(PORT, HOST, function () {
  console.log('serving ' + ROOT + ' at http://localhost:' + PORT + '/ (the app: /app/)');
});
