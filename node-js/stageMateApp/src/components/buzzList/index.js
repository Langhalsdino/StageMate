import angular from 'angular';
import template from './buzz-list.html';
import socket from '../../services/socket';
import './buzzList.scss';

class BuzzListController {
  constructor(socket, $http) {

    this.socket = socket;
    this.$http = $http;
    this.slideNo = 0;

    socket.on('slide-change', msg => {
      this.slideNo = msg.slide;
      this.updateCurrentNoteList();
    });

    socket.on('update', msg => {
      this.slideNo = msg.slide;
      this.notesList = msg.slides;
      this.updateCurrentNoteList();
    });

  }

  updateCurrentNoteList() {
    this.currentNoteList = this.notesList
      .filter(el => el.slide === this.slideNo);
  }

  previousSlide() {
    this.socket.emit('slide-command', 'prev');
  }

  nextSlide() {
    this.socket.emit('slide-command', 'next');
  }

  onBulletClick(bullet) {
    // console.log(bullet);
    const req = {
      method: 'POST',
      url: '/speech',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {text: bullet.remaining.join(' ')}
    };
    this.$http(req)
      .then(res => {
        // console.log(res); // arrrg!
      })
      .catch(err => {
        console.log(err);
      });
  }
}

const buzzList = {
  template,
  controller: BuzzListController,
  controllerAs: 'vm'
};

export default angular.module('buzzListModule', [socket])
  .component('buzzList', buzzList)
  .name;
