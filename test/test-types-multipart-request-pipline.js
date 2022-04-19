'use strict';

const assert = require('assert');
const http = require('http');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const busboy = require('..');

const body = ['----------------------------719223781919663014682861',
    'Content-Disposition: form-data; name="file"; filename="test_file"',
    'Content-Type: application/octet-stream',
    '',
    'File content',
    '----------------------------719223781919663014682861--'].join('\r\n');

let pipelineResolves = false;

async function handler(req) {
    const bb = busboy({ headers: req.headers });
    bb.on('file', (fieldName, file) => {
        file.resume();
    });
    await pipeline(req, bb);
    pipelineResolves = true;
}
const port = 9000 + Math.ceil(Math.random() * 1000);
const server = http.createServer(async (req, res) => {
    await handler(req);
    res.writeHead(204, { 'Connection': 'close' }).end();
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
    assert.deepEqual(pipelineResolves, true);
    server.close();
});
Readable.from(body).pipe(req);
