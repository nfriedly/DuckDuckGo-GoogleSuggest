var fs = require('fs'),
    path = require("path"),
    zlib = require('zlib'),
    util = require('util'),

    async = require('async'),
    mime = require('mime'),

    package_info = require('../package.json');

// memoize = cache the results so that the file is only loaded from the hdd once
var getRawFile = async.memoize(function(name, cb) {
    fs.readFile(path.join(__dirname, '../public/', name), function(err, data) {
        if (err) {
            return cb(err);
        }
        var uncompressed = data.toString();
        uncompressed = uncompressed.replace('{version}', package_info.version);
        return cb(null, uncompressed);
    });
});


var GZIP = 'gzip';
var getCompressedFile = async.memoize(function(file, compression, cb) {
    getRawFile(file, function(err, data) {
        if (err) {
            return cb(err);
        }
        if (compression == GZIP) zlib.gzip(data, cb);
        else process.nextTick(cb.bind(cb, null, data));
    });
});

function serveStatic(request, response) {

    function handleError(err) {
        headers = {"content-type": "text/plain"};
        if (err.errno) {
            response.writeHead(404, headers);
            response.end("File not found");
        } else {
            response.writeHead(500, headers);
            response.end(util.inspect(err));
        }
    }

    var headers = {
        "content-type": mime.lookup(request.url)
    };
    
    if (headers['content-type'].indexOf('text') == -1) {
        fs.createReadStream(path.join(__dirname, '../public/', request.url)).pipe(response).on('error', function(err) {
            handleError(err);
        });
        return;
    }

    if ((request.headers['accept-encoding'] || '').match(/\bgzip\b/)) {
        headers['content-encoding'] = GZIP;
    }
    
    getCompressedFile(request.url, headers['content-encoding'], function(err, data) {
        if (err) {
            return handleError(err);
        }
        response.writeHead(200, headers);
        response.end(data);
    });
}

module.exports = serveStatic;
