import angular from 'angular';
import buzzList from './components/buzzList';
import burnDown from './components/burnDown';

angular
  .module('stageMate', [buzzList, burnDown]);
