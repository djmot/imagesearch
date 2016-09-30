var express = require('express');
var path = require('path');
var url = require('url');
var https = require('https');
var mongo = require('mongodb').MongoClient;
var app = express();

// For heroku deployment:
//var appURL = 'https://imagesearch-djmot.herokuapp.com';

// For cloud9 development:
var appURL = 'https://project-djmot.c9users.io';


var dbURL = 'mongodb://djmot:' + process.env.MDB_PASS + '@ds021326.mlab.com:21326/imagesearch_data';

//----------------------------------------------------------------------------
// Helper functions.
//


//-----------------------------------------------------------------------------
// Connect to database and access collections.
// 
mongo.connect(dbURL, function(err, db) {
if (err) {
    return console.log("Error: database connect");
}
console.log("Connected to database");

db.createCollection('queries', function(err, queries) {
if (err) {
    return console.log("Error: access 'queries' collection");
}
console.log("Accessed 'queries' collection");


//-----------------------------------------------------------------------------
// HTTP routing.
//
app.get('/imagesearch/', function(request, response) {
    // TODO: show the 10 latest queries.
    response.end("Show recent queries.");
});


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
    
    
    // Store new query document.
    // TODO: store search query and time in mongo db.
    
    
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
            var searchReturn = [];
            for (var i = 0; i < 10; i++) {
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

app.get('*', function(request, response) {
    response.sendFile(path.join(__dirname, '/about.html'));
});


}); // end of createCollection() call.
}); // end of connect() call.

app.listen(process.env.PORT, process.env.IP);
console.log("Listening on port " + process.env.PORT);
