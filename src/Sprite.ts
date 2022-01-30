import 'phaser';

import KSprite from './KSprite'


export default class Sprite extends KSprite {
  layer: string;

  constructor(game: Phaser.Game, x: number, y: number, name: string) {
    super(game, x, y, name, 0xff8888);

    this.layer = 'background';

    this.scale.setTo(window.app.scaleFactor);
  }


  static of(
    game: Phaser.Game, 
    x: number, 
    y: number, 
    name: string,
    invisible: boolean = false,
    reverse: boolean = false,
  ) {
    let sprite = new this(
      game, 
      x * window.app.scaleFactor, 
      y * window.app.scaleFactor, 
      name);

    sprite.alpha = invisible ? 0 : 1;
    if (reverse) {
      sprite.anchor.setTo(.5, 0);
      sprite.scale.x *= -1;
    }

    return sprite;
  }


  static parseSprites(game: Phaser.Game, spritesData: RoomSpriteData[]) {
    let sprites: Sprite[] = [];

    for (let spriteData of spritesData) {
      let {name, x, y} = spriteData;
      sprites.push(new this(game, x, y, name));
    }

    return sprites;
  }
}