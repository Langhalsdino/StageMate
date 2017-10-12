const WebSocket = require('ws');
const Processor = require('./processing/processor');

const wss = new WebSocket.Server({ port: 8080 });

// Load the slide note data.
Processor.onInit();

const express = require('express');
const path = require('path');
const app = express();
const Mustache  = require('mustache');
const fs = require('fs');
const bodyParser = require('body-parser')

const Slides = require('./processing/slides');

app.use(bodyParser.json());


// Define the port to run on
app.set('port', 3000);

app.use('/', express.static(path.join(__dirname + '/stageMateApp')));
app.use('/node_modules', express.static(path.join(__dirname + '/node_modules')));
app.use('/reveal', express.static(path.join(__dirname + '/reveal')));

// Reveal.js notes.
app.use('/style.css', express.static(path.join(__dirname + '/style.css')));
app.use('/presentation', express.static(path.join(__dirname + '/presentation.html')));
app.get( '/notes/:socketId', function( req, res ) {

  fs.readFile( __dirname + '/reveal/plugin/notes-server/notes.html', function( err, data ) {
    res.send( Mustache.to_html( data.toString(), {
      socketId : req.params.socketId
    }));
  });

});

app.post('/speech', function (req, res) {
  console.log("R: ", req.body.text);
  Processor.onNewTranscribedText(req.body.text);
  res.send('aarrg!');
});

// Listen for requests
const server = app.listen(app.get('port'), function() {
  const port = server.address().port;
  console.log('Magic happens on port ' + port);
});

// Do the socket magic.
const io = require('socket.io').listen(server);
io.on('connection', socket => {
  console.log('Connection established');

  // Add socket and set initial "init" event.
  Processor.onFrontendConnected(socket);

  Slides.onSlideInit(socket);
  Slides.onStateChanged(data => {
    Processor.onSlideChange(data.state.indexh);
  });
  // Slides.sendCommand('next');

});
