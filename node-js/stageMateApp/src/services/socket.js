import angular from 'angular';

function socket($rootScope) {

  // https://www.html5rocks.com/de/tutorials/websockets/basics/
  // let socket = new WebSocket('ws://localhost:8080', ['soap', 'xmpp']);
  let socket = io.connect();

  function on(eventName, callback) {
    socket.on(eventName, (...args) => {
      $rootScope.$apply(() => callback.apply(socket, args));
    });
  }

  function emit(eventName, data, callback) {
    socket.emit(eventName, data, function () {
      let args = arguments;
      $rootScope.$apply(function () {
        if (callback) {
          callback.apply(socket, args);
        }
      });
    });
  }

  return {on, emit};
}


export default angular.module('socketModule', [])
  .factory('socket', socket)
  .name;
