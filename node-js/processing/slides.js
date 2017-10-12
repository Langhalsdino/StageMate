
let _socket;

const onSlideInit = socket => {
  _socket = socket;
  _socket.on( 'new-subscriber', function( data ) {
    _socket.broadcast.emit( 'new-subscriber', data );
  });
  _socket.on( 'statechanged', function( data ) {
    // console.log('statechanged', data);
    // data = {notes: HTML notes, _socketId, state: {indexh, indexv, overview: false}}
    // @TODO the user manually moved to the next or previous slide.
    // Update the stage mate here.
    delete data.state.overview;
    _socket.broadcast.emit( 'statechanged', data );
  });
  // socket.on( 'statechanged-speaker', function( data ) {
  //   // console.log('statechanged-speaker'); // NOT CALLED!
  //   delete data.state.overview;
  //   socket.broadcast.emit( 'statechanged-speaker', data );
  // });
};

// Catch state changes, especially when changing slides.
const onStateChanged = callback => {
  if (!_socket) throw Error('Initialize the socket first!');
  _socket.on( 'statechanged', function( data ) {
    callback(data);
  });
};

// Send an arbitrary command to reveal.js.
const sendCommand = cmd => {
  // console.log(`Sending Reveal.${cmd}()`);
  _socket.broadcast.emit('reveal-function', {cmd});
};

module.exports = {
  onSlideInit,
  onStateChanged,
  sendCommand
};
