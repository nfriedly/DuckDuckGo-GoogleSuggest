var 	port = 8080,
	ip = null, // string ip, or null for any ip
	http = require('http'),
	url = require('url'),
	querystring = require('querystring')
	server = http.createServer(function(request, response){

	console.log('New Request: ' + request.url);

	// get our request
	var params = querystring.parse( url.parse(request.url).query );
	
	params.q = params.q || "";

	// check that there was a bang at the beginning of the request
	// if there's not, then this shoud really be handled by nginx,
	// but oh well....
	var bang = params.q && params.q.substr(0,1) === "!";
	
	console.log(bang ? "bang!" : "no bang...");
	
	var xml = params.client && params.client.substr(0,2) == "ie";
	
	var options = {
		host: 'suggestqueries.google.com',
		path: '/complete/search?' + querystring.stringify(params)
	}
	
	console.log(options);
	
	// initiate our call to google
	http.get(options, 
		function(g_response){
		
			// todo: send headers, body, and close
			console.log('STATUS: ' + g_response.statusCode);
			console.log('HEADERS: ' + JSON.stringify(g_response.headers));
			
			response.writeHead(g_response.statusCode,
				g_response.headers);
			
			
			g_response.on('data', function (chunk) {
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
				response.write(chunk); // , 'binary'
			});

			g_response.addListener('end', function(){
				response.end();
			});
		}
	);

});

try {
	server.listen(port, ip);

	console.log('node-bang-suggest server running on ' + 
		((ip) ? ip + ":" : "port ") + port);
} catch (ex) {
	console.log("server failed, perhaps the port (" + port + ") was taken?");
	console.error(ex);
}
