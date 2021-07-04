import Phaser from 'phaser';

import BootState from './Boot';
import SplashState from './Splash';
import GameState from './Game';
import Preloader from './Preloader';

import config from '../config';

export default class App extends Phaser.Game {
  constructor () {
    const docElement = document.documentElement
    let height = innerHeight
    let width = innerWidth
    const hwRatio = (height / 5) / (width / 8)

    // if window is wider than the aspect ratio, size by height, else by width
    if (hwRatio < 1) {
      width = height * 1.6
    } else {
      height = width / 1.6
    }

    // const width = docElement.clientWidth > config.gameWidth ? config.gameWidth : docElement.clientWidth;
    // const height = docElement.clientHeight > config.gameHeight ? config.gameHeight : docElement.clientHeight;

    super(width, height, Phaser.CANVAS, 'content', null);

    this.state.add('Boot', BootState, false);
    this.state.add('Splash', SplashState, false);
    this.state.add('Game', GameState, false);
    this.state.add('Preloader', Preloader, false);

    this.scaleFactor = width / 320

    // with Cordova with need to wait that the device is ready so we will call the Boot state in another file
    if (!window.cordova) {
      this.state.start('Boot');
    }
  }
}