import 'phaser';
import { onDebug } from './signals';


export default class Block extends Phaser.Sprite {
  debugBlock: Phaser.Graphics;
  debugText: Phaser.Text;
  debugColor: number = 0x77ff88;

  constructor(game: Phaser.Game, x: number, y: number, name: string) {
    super(game, x, y, null);
    
    this.name = name

    this.initDebug()
  }

  static of(
    game: Phaser.Game, 
    x: number,
    y: number, 
    name: string,
    height: number,
    width: number
  ) {
    let block = new this(game, x * window.app.scaleFactor, y * window.app.scaleFactor, name);
    block.height = height * window.app.scaleFactor;
    block.width = width * window.app.scaleFactor;
    block.inputEnabled = true;

    return block;
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


  static parseBlocks(game: Phaser.Game, blocksData: BlockData[]) {
    let blocks: Block[] = [];

    for (let blockData of blocksData) {
      let {name, x, y} = blockData;
      let block = new this(game, x, y, name);
      blocks.push(block);
    }

    return blocks;
  }

  debugSprite(debugOn: boolean) {
    this.debugBlock.visible = debugOn
    this.debugText.visible = debugOn
  }
}