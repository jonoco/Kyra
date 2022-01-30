import 'phaser';

import Block from './Block';
import Door from './Door';
import Item from './Item';
import Entity from './entities/Entity';
import Sprite from './Sprite';

export default class Room extends Phaser.Image {
  text: string;
  music: string;
  items: Item[];
  sprites: Sprite[];
  blocks: Block[];
  entities: Entity[];
  grid: string;
  path: string;
  doors: Door[];

  static of(
    game: Phaser.Game, 
    x: number, 
    y: number, 
    roomData: RoomData
    ) {
    let {name, text, music, items, sprites, 
      blocks, entities, grid, path, doors,
    } = roomData;

    let room = new this(game, x, y, name);
    
    room.name = name;
    room.text = text;
    room.music = music;
    room.items = Item.parseItems(game, items);
    room.sprites = Sprite.parseSprites(game, sprites);
    room.blocks = Block.parseBlocks(game, blocks);
    room.entities = Entity.parseEntities(game, entities)
    room.grid = grid;
    room.path = path;
    room.doors = Door.parseDoors(game, Object.values(doors));

    room.scale.setTo(window.app.scaleFactor);
    room.inputEnabled = true;
    room.game.world.add(room);

    return room;
  }


  loadRoom(roomName: string) {
    this.name = roomName;

    this.loadTexture(roomName);
  }
}