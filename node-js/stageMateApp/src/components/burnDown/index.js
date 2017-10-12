import angular from 'angular';
import template from './burnDown.html';
import socket from '../../services/socket';
import 'angular-chart.js/dist/angular-chart';
const angularCharts = 'chart.js';
import 'chart.js/dist/Chart.min';
import './burnDown.scss';

function zeroPadInteger( num ) {

  let str = '00' + parseInt( num );
  return str.substring( str.length - 2 );

}

class BurnDownController {
  constructor(socket, $interval) {

    this.socket = socket;
    this.$interval = $interval;
    this.startTs = new Date();
    this.targetSeconds = 180;


    socket.on('update', msg => {
      this.all = 0;
      this.remaining = 0;
      msg.slides.forEach(slide => {
        this.all += slide.notes.length;
        this.remaining += slide.notes.filter(n => !n.completed).length;
      });
      this.start();
    });


    this.series = ['Ideal', 'Actual'];
    this.labels = Array.from(Array(this.targetSeconds).keys());

    this.data = [ [], [] ];
    this.data[0] = Array.from(Array(this.targetSeconds).keys());
    this.data[0] = this.data[0].map(d => this.targetSeconds - d);

    this.colors = ['#aaaaaa', '#ff0000'];

    this.options = {
      elements: { point: { radius: 0 } },
      animation: false,
      scales: {
        xAxes: [{
          // ticks: {max: this.targetTime},
          display: false
        }],
        yAxes: [{
          // ticks: {
          //   max: this.remaining,
          //   min: 0,
          // },
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Notes'
          },
          ticks: {display: false}
        }]
      }
    };

  }

  // onClick(points, evt) {
  //   console.log(points, evt);
  // }

  start() {
    if (this.interval) return;
    this.interval = this.$interval(() => {
      this.update();
    }, 1000);
  }

  cancel() {
    if (!this.interval) return;
    this.$interval.cancel(this.interval);
    delete this.interval;
  }

  update() {
    this.data[1].push(this.remaining / this.all * this.targetSeconds);
    this.updateTimer();
  }

  updateTimer() {
    let diff, hours, minutes, seconds, now = new Date();

    diff = now.getTime() - this.startTs.getTime();
    hours = zeroPadInteger(Math.floor( diff / ( 1000 * 60 * 60 ) ));
    minutes = zeroPadInteger(Math.floor( ( diff / ( 1000 * 60 ) ) % 60 ));
    seconds = zeroPadInteger(Math.floor( ( diff / 1000 ) % 60 ));

    this.timer = `${hours}:${minutes}:${seconds}`;
  }

}

const burnDown = {
  template,
  controller: BurnDownController,
  controllerAs: 'vm'
};

export default angular.module('burnDownModule', [socket, angularCharts])
  .component('burnDown', burnDown)
  .name;
