import 'phaser';


export default class Block extends Phaser.Graphics {
  name: string;

  static parseBlocks(game: Phaser.Game, blocksData: BlockData[]) {
    let blocks: Block[] = [];

    for (let blockData of blocksData) {
      let {name, x, y} = blockData;
      let block = new this(game, x, y);
      block.name = name;
      blocks.push(block);
    }

    return blocks;
  }
}