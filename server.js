/***************
* Proxy Server for Google Suggestions for Duck Duck Go searches with bangs
*
* This server takes a given query and pulls in google suggestions. If the query started with a !,
* this server will restore the ! in all of google's suggestions. 
*
* This is designed for use with the Duck Duck Go + google Suggest OpenSearch plugin found here:
* http://ddgg.nfriedly.com/
*
* This project is hosted on github:  https://github.com/nfriedly/node-bang-suggest
*
* Copyright Nathan Friedly - http://nfriedly.com - MIT License
*/

/*
todo:
 - stress test (apache bench?)
 - see if I can make nginx handle requests that don't need to be modified
   - see if that's any faster
 - look into npm
*/

// imports
var http = require('http'),
	url = require('url'),
	querystring = require('querystring'),
	path = require("path"),
	fs = require("fs");

// configuration
var port = 8080,
	ip = null; // string ip, or null for any ip


var server = http.createServer(function(request, response){
	var url_data = url.parse(request.url);
	
	incrementRequests();
	
	try {
	
		if(url_data.pathname == "/complete/search"){
			forward(request, response);
			return;
		}
		
		if(url_data.pathname == "/status"){
			status(request, response);
			return;
		}
		
		if(url_data.pathname  == "/"){
			request.url = "/index.html";
		}
		readFile(request, response);
	
	} catch (ex2) {
		console.error(ex);
		error(request, response, 500, ex);
	}

}); // we'll start the server at the bottom of the file


function forward(request, response){

	// get our request
	var params = querystring.parse( url.parse(request.url).query );
	
	params.q = params.q || "";

	// check that there was a bang at the beginning of the request
	// if there's not, then this shoud really be handled by nginx,
	// but oh well....
	var bang = params.q && params.q.substr(0,1) == "!";
	
	var xml = params.client && params.client.substr(0,2) == "ie";
	
	var options = {
		host: 'suggestqueries.google.com',
		path: '/complete/search?' + querystring.stringify(params)
	}
	
	// initiate our call to google
	var g_request = http.get(options, function(g_response){

		// forward the HTTP status code and headers
		response.writeHead(g_response.statusCode,
			g_response.headers);
		
		// forward the data when it arrives
		g_response.on('data', function (chunk) {
		
			// only process the data if the original request started with a !
			if(bang){
				chunk = chunk.toString();
				if(xml){
					chunk = chunk.replace(/<Text>(\w)/g, '<Text>!$1');
				} else {
					try {
						// try to do it properly first
						data = JSON.parse(chunk);
						data[1] = data[1].map( function(str){
							return "!" + str;
						});
						chunk = JSON.stringify(data);
					} catch(ex) {
						// for incomplete data / invalid JSON; 
						// this method adds in extra !'s if there are quotes within the query.
						chunk = chunk.replace(/"(\w)/g,'"!$1');
					}
				}
			}
			
			// send the data back to the client
			response.write(chunk); // , 'binary'
		});

		// when the connection to google ends, close the client's connection
		g_response.addListener('end', function(){
			response.end();
			decrementRequests();
		});
		
	});
	
	g_request.addListener('error', function(err){
		error(request, response, 500, err);
	});
}

// counters to get a rough picture of how busy the server is and how busy it's been (and also if it was restarted any time recently)
var counter = 0,
	openRequests = 0,
	maxRequests = 0,
	serverStart = new Date();

function incrementRequests(){
	openRequests++;
	if(openRequests > maxRequests){
		maxRequests = openRequests;
	}
	counter++;
}

function decrementRequests(){
	openRequests--;
}

// simple way to get the curent status of the server
function status(request, response){
	response.writeHead("200", {"Content-Type": "text/plain", "Expires": 0});
	response.write("Open Requests: " + openRequests + "\n" + 
		"Max Open Requests: " + maxRequests + "\n" +
		"Total Requests: " + counter + "\n" + 
		"Online Since: " + serverStart
	);
	response.end();
	decrementRequests();
}

// a quick way to throw error messages
function error(request, response, status, text){
	response.writeHead(status, {"Content-Type": "text/plain"});
	response.write("Error " + status + ": " + text + "\n");
	response.end();
	decrementRequests();
}

// a super-basic file server
function readFile(request, response){

	//response.setHeader('x-cwd', process.cwd());
	//response.setheader('x-dir', __dirname);
	//process.cwd() - doesn't always point to the directory this script is in.

	var pathname = url.parse(request.url).pathname,
   		filename = path.join(__dirname, pathname);

  
	//console.log(filename, " - ", pathname);
 
 	// send the file out if it exists and it's readable, error otherwise
	path.exists(filename, function(exists) {
	
		if (!exists) {
			return error(request, response, 404, "The requested file could not be found.");
		}
		
		fs.readFile(filename, "binary", function(err, data) {
			if (err) {
				return error(request, response, 500, err);
			}

			// some reverse proxies (apache) add a default text/plain content-type header if none is specified			
			var headers = {};
			if(filename.substr(-5) == ".html" || filename.substr(-4) == ".htm"){
				headers['content-type'] = "text/html";
			}

			response.writeHead(200, headers);
			response.write(data, "binary");
			response.end();
			decrementRequests();
		});
	});
}

try {
	server.listen(port, ip);
	console.log('node-bang-suggest server running on ' + ((ip) ? ip + ":" : "port ") + port);
} catch (ex) {
	console.log("server failed, perhaps the port (" + port + ") was taken?");
	console.error(ex);
}
