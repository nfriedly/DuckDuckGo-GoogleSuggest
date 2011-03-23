# Duck Duck Go + (Proxied) Google Suggests

This project creates OpenSearch Plugins that combine Duck Duck Go searches with Google Suggestions. It optionally proxies the suggestions via a node.js server to restore the !bangs that Google removes from the suggestions.

About !bangs: [http://duckduckgo.com/bang.html](http://duckduckgo.com/bang.html)

## Installation / Server Configuration:

Installing this script is as simple as downloading it to a directory and running it. However, setting up node.js, upstart, and monit take a little more work:

### Install Node.js:

I installed node.js 0.4.3 by compiling from source, then installed npm via the shell script, then installed nodejs 0.5.0-pre from npm.

* [https://github.com/joyent/node/wiki/Installation](https://github.com/joyent/node/wiki/Installation)
* Installing NPM: [http://howtonode.org/introduction-to-npm](http://howtonode.org/introduction-to-npm)


### Upstart Script

Upstart is not required, but it is recommended because it allow the server to be easily started and stopped easily and come up automatically if your server is restarted.

* Node.js Upstart service: [http://kevin.vanzonneveld.net/techblog/article/run_nodejs_as_a_service_on_ubuntu_karmic/](http://kevin.vanzonneveld.net/techblog/article/run_nodejs_as_a_service_on_ubuntu_karmic/)

This is my current upstart script. It's located in `/etc/init/nodejs-ddgg.conf`. 

	#!upstart
	description "node.js ddg.nfriedly.com server"
	author      "nfriedly"
	
	start on startup
	stop on shutdown
	
	script
		export HOME="/home/nfriedly"
	
		exec sudo -u nfriedly /home/nfriedly/local/node/bin/node /home/nfriedly/ddgg.nfriedly.com/server.js 2>&1 >> /var/log/node-ddgg.log
	end script
	
### Monit

Monit is also not required. It checks on the server and restarts it if it's unresponsive for more than a few seconds. This is highly recommended. 

This is at the top of my current `/etc/monit/monitrc` script (I left the existing instructions there below this)

	#!monit
	
	# based on info from http://howtonode.org/deploying-node-upstart-monit
	
	set logfile /var/log/monit.log
	
	check host nodejs with address 127.0.0.1
		start program = "/sbin/start nodejs-ddgg"
		stop program  = "/sbin/stop nodejs-ddgg"
		if failed port 8080 protocol HTTP
			request /
			with timeout 10 seconds
			then restart

### NginX

NginX is a high-performance web server. It is not required, this script will actually work without any server in front of it, but I prefer to have NginX set up as a Reverse Proxy.

This is my current nginx script. For my server, I have nginx on port 80, apache on port 81, and this node.js server on port 8080:

`/etc/nginx/sites-available/ddgg.nfriedly.com.conf` (with a symbolic link to it in `/etc/nginx/sites-enabled/ddgg.nfriedly.com.conf`)

	server {
			listen 80;
			server_name ddgg.nfriedly.com;
	
			access_log /var/log/nginx/ddgg.nfriedly.com.access.log;
	
			location / {
					proxy_pass http://localhost:8080;
			}
	}

I may tweak this to serve static files directly instead of passing those requests on to node. 

And then, if you're like me, and already had a number of sites set up in Apache on your server, this is my `/etc/nginx/sites-available/apache-proxy.conf` (with another symlink in sites-enabled) that allows my old Apache install to continue serving websites.I just had to edit Apache's ports.conf and each site's config file to listen on 81 instead of 80.

	server {
		listen 80;
		server_name nfriedly.com *.nfriedly.com;
	
		access_log /var/log/nginx/apache-proxy.access.log;
	
		location / {
			proxy_pass http://localhost:81;
			
			#fix for apache redirects that include the port number
			proxy_redirect http://nfriedly.com:81/ http://nfriedly.com/;
			
			proxy_set_header Host $host;
			proxy_set_header X-Real-IP $remote_addr;
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	
			client_max_body_size 10m;
			client_body_buffer_size 128k;
			proxy_connect_timeout 6000;
			proxy_send_timeout 6000;
			proxy_read_timeout 6000;
			proxy_buffer_size 4k;
			proxy_buffers 4 32k;
			proxy_busy_buffers_size 64k;
			proxy_temp_file_write_size 64k;
			send_timeout 6000;
			proxy_buffering off;
			proxy_next_upstream error;
	
		}
	}

## MIT License:

Copyright (c) 2011 Nathan Friedly - http://nfriedly.com

Encrypted Search Plugin Copyright Eli Grey - http://eligrey.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
