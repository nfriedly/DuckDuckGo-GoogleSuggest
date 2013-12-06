# Duck Duck Go + (Proxied) Google Suggests

This project creates OpenSearch Plugins that combine [Duck Duck Go](http://duckduckgo.com/) searches with [Google Suggestions](http://www.google.com/support/websearch/bin/answer.py?hl=en&answer=106230). It optionally proxies the suggestions via a node.js server to restore the !bangs that Google removes from the suggestions.

About !bangs: [http://duckduckgo.com/bang.html](http://duckduckgo.com/bang.html)

# Todo
* Add some basic tests
* Add clustering
* Add monitoring

# Installation / Server Configuration:

Installing this script is almost as simple as downloading it to a directory and running it. You'll need to do two things to get it ready:

* find-and-replace "ddgg.nfriedly.com" with your site's url in `index.html` and `ddg-google-proxied.xml`.
* update or delete the Google Analytics code at the bottom of `index.html`

After that, run 
    node server.js
And your server should be up and running on port 8080!

## Deployment to Heroku

This should be runnable for free on Heroku



## MIT License:

Copyright (c) 2011 Nathan Friedly - [http://nfriedly.com](http://nfriedly.com "Node.js developer, JavaScript Expert")

Encrypted Search Plugin Copyright Eli Grey - [http://eligrey.com](http://eligrey.com)

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
