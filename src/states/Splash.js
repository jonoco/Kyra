import Phaser from 'phaser';
import { centerGameObjects } from '../utils';

export default class extends Phaser.State {
  init () {}

  preload () {
    this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'preloaderBackground');
    this.loaderBg.scale.setTo(3 * window.game.scaleFactor);

    this.message = this.add.text();
    this.message.x = this.game.world.centerX;
    this.message.y = 420;
    this.message.font = 'kyrandia';
    this.message.fontSize = 30;
    this.message.fill = '#eeeeee';
    this.message.stroke = '#000000';
    this.message.strokeThickness = 3;
    this.message.text = "Tap to play";

    centerGameObjects([this.loaderBg, this.message]);
  }

  create () {
    this.input.onTap.add(this.startGame, this);
  }

  startGame () {
    this.state.start('Preloader');
  }
}