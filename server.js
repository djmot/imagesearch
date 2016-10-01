var express = require('express');
var path = require('path');
var url = require('url');
var https = require('https');
var fs = require('fs');
var app = express();


//----------------------------------------------------------------------------
// Helper functions.
//

// Replace contents of 'recent_searches.txt' with new search query info.
function setText(newLine) {
    fs.readFile('recent_searches.txt', 'utf8', function(err, data) {
        if (err) {
            return console.log("Err: readFile");
        }
        if (newLine.charAt(newLine.length - 1) !== '\n') {
            newLine += '\n';
        }
        data += newLine;
        var lines = data.split('\n');
        var newText = "";
        for (var i = 1; i < lines.length - 1; i++) {
            newText += lines[i] + '\n';
        }
        fs.writeFile('recent_searches.txt', newText, function(err) {
            if (err) {
                console.log('Err: writeFile');
            }
        });
    });
}


//-----------------------------------------------------------------------------
// HTTP routing.
//

// Send recent queries.
app.get('/imagesearch/', function(request, response) {
    // Send recent queries, stored in 'recent_searches.txt'.
    fs.readFile('recent_searches.txt', 'utf8', function(err, data) {
        if (err) {
            return console.log('Err: readFile');
        }
        var lines = data.split('\n');
        var result = "[";
        for (var i = 0; i < lines.length - 1; i++) {
            result += lines[i] + ',';
        }
        result = result.slice(0, -1);
        result += ']';
        response.end(result);
    });
});

// Search using given string.
app.get('/imagesearch/*', function(request, response) {
    // Extract search string and page offset from URL.
    var parsedURL = url.parse(request.url, true);
    var searchString = parsedURL.pathname.slice(13); //remove '/imagesearch/'.
    var params = parsedURL.query;
    var pageOffset = 0;
    if (params.hasOwnProperty("offset")) {
        var check = parseInt(params["offset"]);
        if (!isNaN(check) && check > 0 && check < 1000) { //1000 is arbitrary.
            pageOffset = check;
        } else {
            console.log("Bad offset parameter");
        }
    }
    
    // Update file 'recent_searches.txt' with new query.
    var date = new Date();
    setText( JSON.stringify(
        {term:searchString,time:date.toISOString()}
    ));
    
    // Search images using Bing Search API.
    https.get({
        host : 'api.cognitive.microsoft.com',
        path : '/bing/v5.0/images/search?q='+searchString+'&offset='+pageOffset.toString(),
        headers : {"Ocp-Apim-Subscription-Key" : process.env.BS_API}
    }, function(searchResponse) {
        
        // Store search response data in var searchData.
        var searchData = "";
        searchResponse.setEncoding('utf8');
        searchResponse.on('data', function(chunk) {
            searchData += chunk;
        });
        
        // Format results into array and send it.
        searchResponse.on('end', function() {
            var searchDataJSON = JSON.parse(searchData);
            var numResults = searchDataJSON["value"].length;
            var searchReturn = [];
            for (var i = 0; i < 10 && pageOffset + i < numResults; i++) {
                searchReturn[i] = {
                    "url": searchDataJSON["value"][pageOffset + i]["contentUrl"],
                    "snippet": searchDataJSON["value"][pageOffset + i]["name"],
                    "thumbnail": searchDataJSON["value"][pageOffset + i]["thumbnailUrl"],
                    "context": searchDataJSON["value"][pageOffset + i]["hostPageDisplayUrl"]
                };
            }
            response.writeHead(200, { 'Content-Type' : 'application/json' });
            response.end(JSON.stringify(searchReturn));
        });
        
    });
    
});

// For any other URL, send about page.
app.get('*', function(request, response) {
    response.sendFile(path.join(__dirname, '/about.html'));
});

app.listen(process.env.PORT, process.env.IP);
console.log("Listening on port " + process.env.PORT);
