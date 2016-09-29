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
    
    console.log('searchString: ' + searchString + ', offset: ' + pageOffset);
    console.log('URL: api.cognitive.microsoft.com' + '/bing/v5.0/images/search?q='+searchString+'&count=10&offset='+pageOffset.toString()+'&mkt=en-us&safeSearch=Moderate');
    
    
    // Store new query document.
    // TODO: store search query and time in mongo db.
    
    // Search images using Bing Search API.
    https.get({
        host : 'api.cognitive.microsoft.com',
        path : '/bing/v5.0/images/search?q='+searchString
        //headers : {"Ocp-Apim-Subscription-Key" : process.env.BS_API}
    }, function(err, searchResponse) {
        
        //TODO: see why this always gives an error and fix it.
        
        if (err) {
            response.writeHead(400, { 'Content-Type' : 'text/plain' });
            response.end("Error: https search error");
            return console.log("Error: https search error");
        }
        
        console.log("In https request callback");
        console.log(searchResponse);
        
        // Store search response data in var searchData.
        var searchData = "";
        searchResponse.setEncoding('utf8');
        searchResponse.on('error', function() {
            response.writeHead(400, { 'Content-Type' : 'text/plain' });
            response.end("Error: https response read error");
            return console.log("Error: https response read error");
        });
        searchResponse.on('data', function(chunk) {
            searchData += chunk;
        });
        
        // When searchData is complete, format results into searchReturn object.
        // searchReturn will be an array of results; each result will have keys 
        // "url", "snippet", "thumbnail", and "context".
        // The relevant keys of objects from searchData are "contentUrl",
        // "name", "thumbnailUrl", and "hostPageDisplayUrl" respectively.
        searchResponse.on('end', function() {
            // TODO: format the results properly.
            var searchReturn = searchData;
            response.writeHead(200, { 'Content-Type' : 'application/json' });
            response.end(searchReturn);
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
