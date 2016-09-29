var express = require('express');
var path = require('path');
var mongo = require('mongodb').MongoClient;
var app = express();

// For heroku deployment:
//var appURL = 'https://imagesearch-djmot.herokuapp.com';

// For cloud9 development:
var appURL = 'https://project-djmot.c9users.io';


var dbURL = 'mongodb://djmot:' + process.env.MONGODB_PASSWORD + '@ds021326.mlab.com:21326/imagesearch_data';

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

db.createCollection('queries', function(err, collection) {
if (err) {
    return console.log("Error: access 'queries' collection");
}
console.log("Accessed 'queries' collection");

//-----------------------------------------------------------------------------
// HTTP routing.
//
app.get('*', function(request, response) {
    response.sendFile(path.join(__dirname, '/about.html'));
});


}); // end of createCollection() call.
}); // end of connect() call.

app.listen(process.env.PORT, process.env.IP);
console.log("Listening on port " + process.env.PORT);
