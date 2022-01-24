import 'phaser';
import { onDebug } from './signals';


export default class Sprite extends Phaser.Sprite {
  debugBlock: Phaser.Graphics;
  debugText: Phaser.Text;
  debugColor: number = 0xff8888;

  constructor(game: Phaser.Game, x: number, y: number, name: string) {
    super(game, x, y, name);

    this.name = name;
    
    this.initDebug()
  }


  initDebug() {
    this.debugBlock = this.game.make.graphics();
    this.debugBlock.beginFill(this.debugColor, 0.5);
    this.debugBlock.drawRect(0, 0, this.width, this.height);
    this.debugBlock.endFill();
    this.addChild(this.debugBlock);

    this.debugText = new Phaser.Text(this.game, 0, 0, this.name, { fontSize: 8, fontWeight: 'normal' })
    this.addChild(this.debugText)

    onDebug.add(this.debugSprite, this);
  }


  static parseSprites(game: Phaser.Game, spritesData: RoomSpriteData[]) {
    let sprites: Sprite[] = [];

    for (let spriteData of spritesData) {
      let {name, x, y} = spriteData;
      sprites.push(new this(game, x, y, name));
    }

    return sprites;
  }

  debugSprite(debugOn: boolean) {
    this.debugBlock.visible = debugOn
    this.debugText.visible = debugOn
  }
}