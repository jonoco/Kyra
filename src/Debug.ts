import 'phaser'

import { onDebug } from './signals';
import Game from './states/Game';
import { log } from './utils';


export enum DebugLevel {
  off, screen, info
}


export default class Debugger {
  static Level: DebugLevel = DebugLevel.off;

  debugPos: number;
  game: Phaser.Game;
  state: Game;

  constructor(game: Phaser.Game, state: Game) {
    this.game = game;
    this.state = state;

    game.input.keyboard.addKeys({ "a": Phaser.KeyCode.A, "b": Phaser.KeyCode.B })
    let tildeKey = game.input.keyboard.addKey(Phaser.KeyCode.TILDE)
    tildeKey.onDown.add(this.toggleDebug, this)
  }

  display() {
    switch(Debugger.Level) {
      case DebugLevel.off:
        return null
      case DebugLevel.screen:
        return null
      case DebugLevel.info:
        return this.debugScreen()
      default:
        throw Error('Unknown debug level')
    }
  }

 
  /**
   * Toggle the debug screen
   */
   toggleDebug() {
    Debugger.Level = (
      Debugger.Level + 1 >= Object.keys(DebugLevel).length/2 
      ? 0 : Debugger.Level + 1);

    log(`toggling debug level ${Debugger.Level} ${DebugLevel[Debugger.Level]}`)

    onDebug.dispatch(Debugger.Level)
  }


  /**
   * Show debug text
   */
   debugScreen() {
    this.debugPos = 1

    this.addDebugText(`Room: ${this.state.currentRoom.name}`);
    this.addDebugText(`Input enabled: ${this.state.input.enabled ? 'input on' : 'input off'}`)
    this.addDebugText(`Events queue length : ${this.state.eventQueue.length}`);
    this.addDebugText(`Player position: ${this.state.player.x}, ${this.state.player.y}\
    [${Math.floor(this.state.player.x/window.app.scaleFactor)}, ${Math.floor(this.state.player.y/window.app.scaleFactor)}]`);
    
    this.addDebugText(`Pointer position: ${this.game.input.position.x}, ${this.game.input.position.y}\
    [${Math.floor(this.game.input.position.x/window.app.scaleFactor)}, ${Math.floor(this.game.input.position.y/window.app.scaleFactor)}]`);
    
    this.addDebugText(`Player z index: ${this.state.player.z}`);
    this.addDebugText(`GUI z index: ${this.state.gui.z}`);
    this.addDebugText(`room z index: ${this.state.room.z}`);
    this.addDebugText(`blocks z index: ${this.state.blockGroup.z}`)
    this.addDebugText(`bgSprites z index: ${this.state.bgSprites.z}`);
    this.addDebugText(`mgSprites z index: ${this.state.mgSprites.z}`);
    this.addDebugText(`fgSprites z index: ${this.state.fgSprites.z}`);

    this.addDebugText(`background sprites:`);
    this.state.bgSprites.forEach(spr => this.addDebugSprite(spr), this)

    this.addDebugText(`midground sprites:`);
    this.state.mgSprites.forEach(spr => this.addDebugSprite(spr), this)

    this.addDebugText(`foreground sprites:`);
    this.state.fgSprites.forEach(spr => this.addDebugSprite(spr), this)

    this.addDebugText(`held items:`);
    this.state.heldItem.forEach(spr => this.addDebugSprite(spr), this)

    this.addDebugText(`room items:`);
    this.state.itemGroup.forEach(spr => this.addDebugSprite(spr), this)

    this.addDebugText(`inventory items:`);
    this.state.inventory.slots.forEach(spr =>
      this.addDebugText(`    item: ${spr.item ? spr.item.name : 'empty'}`), this)
  }


  /**
   * Add debug text to the debug screen
   */
   addDebugText(text: string) {
    this.game.debug.text(text, 5, this.debugPos * 25);

    this.debugPos++
  }


  /**
   * Add sprite debug info
   */
  addDebugSprite(sprite: Phaser.Sprite) {
    this.addDebugText(`   name: ${sprite.name}`)
  }

}