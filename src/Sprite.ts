import 'phaser';


export default class Sprite extends Phaser.Sprite {
  name: string;

  static parseSprites(game: Phaser.Game, spritesData: RoomSpriteData[]) {
    let sprites: Sprite[] = [];

    for (let spriteData of spritesData) {
      let {name, x, y} = spriteData;
      sprites.push(new this(game, x, y, name));
    }

    return sprites;
  }
}