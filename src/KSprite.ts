import 'phaser';
import Debugger, { DebugLevel } from './Debug';
import { enterRoom, onDebug } from './signals';


export default class KSprite extends Phaser.Sprite {
  debugBlock: Phaser.Graphics;
  debugText: Phaser.Text;
  debugColor: number;
  debugLevel: DebugLevel = DebugLevel.off;

  constructor(
    game: Phaser.Game, 
    x: number, 
    y: number, 
    name: string,
    debugColor: number = 0xff8888
  ) {
    super(game, x, y, name);

    this.name = name;
    this.debugColor = debugColor;
    
    this.initDebug();
    this.displayDebug();

    onDebug.add(this.displayDebug, this);
    enterRoom.add(this.displayDebug, this);
  }

  initDebug() {
    this.debugBlock = this.game.make.graphics();
    this.debugBlock.beginFill(this.debugColor, 0.5);
    this.debugBlock.drawRect(0, 0, this.width, this.height);
    this.debugBlock.endFill();
    this.debugBlock.visible = false;
    this.addChild(this.debugBlock);

    this.debugText = new Phaser.Text(this.game, 0, 0, this.name, { fontSize: 8, fontWeight: 'normal' })
    this.debugText.visible = false;
    this.addChild(this.debugText)
  }


  displayDebug() {
    this.debugBlock.visible = Debugger.Level == DebugLevel.screen
    this.debugText.visible = Debugger.Level == DebugLevel.screen
  }
}