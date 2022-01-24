import 'phaser';
import { DebugLevel } from './Debug';
import KSprite from './KSprite';
import { onDebug } from './signals';


export default class Block extends KSprite {
  constructor(
    game: Phaser.Game, 
    x: number, 
    y: number, 
    name: string, 
    debugColor: number
  ) {
    super(game, x, y, null, debugColor);
  }

  static of(
    game: Phaser.Game, 
    x: number,
    y: number, 
    name: string,
    height: number,
    width: number
  ) {
    let block = new this(
      game, 
      x * window.app.scaleFactor, 
      y * window.app.scaleFactor, 
      name,
      0x77ff88);
      
    block.height = height * window.app.scaleFactor;
    block.width = width * window.app.scaleFactor;
    block.inputEnabled = true;

    return block;
  }


  static parseBlocks(game: Phaser.Game, blocksData: BlockData[]) {
    let blocks: Block[] = [];

    for (let blockData of blocksData) {
      let {name, x, y, height, width} = blockData;
      let block = Block.of(game, x, y, name, height, width);
      blocks.push(block);
    }

    return blocks;
  }
}