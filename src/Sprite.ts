import 'phaser';

import KSprite from './KSprite'


export default class Sprite extends KSprite {
  constructor(game: Phaser.Game, x: number, y: number, name: string) {
    super(game, x, y, name, 0xff8888);
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