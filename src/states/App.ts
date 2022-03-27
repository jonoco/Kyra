import 'phaser';

import BootState from './Boot';
import SplashState from './Splash';
import GameState from './Game';
import Preloader from './Preloader';


export default class App extends Phaser.Game {
  scaleFactor: number;
  
  constructor () {
    const docElement = document.documentElement
    let height = innerHeight
    let width = innerWidth
    const hwRatio = (height / 5) / (width / 8)

    // if window is wider than the aspect ratio, size by height, else by width
    if (hwRatio < 1) {
      width = Math.floor(height * 1.6)
    } else {
      height = Math.floor(width / 1.6)
    }

    super(width, height, Phaser.CANVAS, 'content', null, true, false);

    this.state.add('Boot', BootState, false);
    this.state.add('Splash', SplashState, false);
    this.state.add('Game', GameState, false);
    this.state.add('Preloader', Preloader, false);

    this.scaleFactor = width / 320

    console.log(`Running Phaser at h: ${height} w: ${width} scale: ${this.scaleFactor}`)

    // with Cordova with need to wait that the device is ready so we will call the Boot state in another file
    if (!window.cordova) {
      this.state.start('Boot');
    }
  }
}