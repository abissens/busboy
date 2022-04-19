'use strict';

const assert = require('assert');
const http = require('http');
const { Readable } = require('stream');
const busboy = require('..');

const body = ['----------------------------719223781919663014682861',
    'Content-Disposition: form-data; name="file"; filename="test_file"',
    'Content-Type: application/octet-stream',
    '',
    'File content',
    '----------------------------719223781919663014682861--'].join('\r\n');

let [end, close] = [false, false];
const port = 9000 + Math.ceil(Math.random() * 1000);
const server = http.createServer((req, res) => {
    const bb = busboy({ headers: req.headers });
    bb.on('file', (fieldName, file) => {
        file.resume();
    });
    req.on('end', () => end = true)
        .on('close', () => close = true)
        .pipe(bb)
        .on('close', () => res.writeHead(204, { 'Connection': 'close' }).end());
}).listen(port);

const req = http.request({
    host: 'localhost',
    port: port,
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data; '
            + 'boundary=--------------------------719223781919663014682861',
    },
}, (res) => {
    assert.strictEqual(res.statusCode, 204);
    assert.deepEqual([close, end], [true, true]);
    server.close();
});
Readable.from(body).pipe(req);
