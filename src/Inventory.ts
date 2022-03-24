import { inBounds, moveToCenter, log, LOG_LEVEL } from './utils'
import Debugger, { DebugLevel } from './Debug'
import Item from './Item';
import KSprite from './KSprite';
import { Point } from 'phaser-ce';
import { onDebug } from './signals';

class Slot extends KSprite {
  item: Item
  inventory: Inventory

  static of(game: Phaser.Game, inventory: Inventory, x: number, y: number) {
    const newSlot = new this(
      game, 
      x * window.app.scaleFactor, 
      y * window.app.scaleFactor, 
      null);

    newSlot.inventory = inventory;
    newSlot.name = `slot`;
    newSlot.height = 16 * window.app.scaleFactor;
    newSlot.width = 16 * window.app.scaleFactor;
    newSlot.item = null;
    
    return newSlot;
  }

  addItem(item: Item) {
    this.item = item;
    this.inventory.add(item);
  }

  removeItem() {
    this.inventory.removeChild(this.item);
    this.item = null;
  }
}

export default class Inventory extends Phaser.Group {
  game: Phaser.Game;
  slotDebug: Phaser.Group
  slots: Slot[]

  constructor(game: Phaser.Game) {
    super(game)

    this.name = `inventory`;
    this.slotDebug = this.game.add.group(this.game.world, 'slot debug');

    this.slots = [
      Slot.of(game, this, 95, 161),
      Slot.of(game, this, 115, 161),
      Slot.of(game, this, 135, 161),
      Slot.of(game, this, 155, 161),
      Slot.of(game, this, 175, 161),
      Slot.of(game, this, 95, 182),
      Slot.of(game, this, 115, 182),
      Slot.of(game, this, 135, 182),
      Slot.of(game, this, 155, 182),
      Slot.of(game, this, 175, 182)
    ];

    onDebug.add(this.displayDebugSlots, this);
  }


  /**
   * Display inventory debug
   */
  displayDebugSlots() {
    if (Debugger.Level == DebugLevel.screen) {
      for (let s of this.slots) {
        let slotBackground = this.game.make.graphics();
        slotBackground.beginFill(0xffffff, 0.25);
        slotBackground.drawRect(s.x, s.y, s.width, s.height);
        slotBackground.endFill();
        this.slotDebug.add(slotBackground);
      }
    } else {
      this.slotDebug.removeAll(true)
    }
  }


  /**
   * Remove and return item from inventory group
   */
  removeItemFromInventory (item: Item) {
    if (!item.parent) {
      log(`item ${item.name} cannot be removed, is not in inventory`, LOG_LEVEL.ERROR);
      return;
    }

    log(`removing ${item.name} from inventory`);
    
    const slot = this.getSlotOverlappingItem(item);
    slot.removeItem();
    
    return item;
  }


  /**
   * Move item from room to inventory
   * @returns swapped item if inventory slot was occupied, else null
   */
  moveItemToInventory (item: Item, slot: Slot) {
    let swappedItem = null

    // swap items in occupied slot if necessary
    if (slot.item) {
      slot.item.position = new Point(
        (Math.random()*100 + 50) * window.app.scaleFactor,
        100 * window.app.scaleFactor
      );
      
      swappedItem = slot.item
    } 

    // move item too inventory
    moveToCenter(item, slot)
    slot.addItem(item);

    return swappedItem
  }


  /**
   * Returns inventory slot that item was dropped onto
   * @param item Item being dropped on inventory
   * @returns Slot item was dropped on, else null
   */
  getSlotOverlappingItem(item: Item) {
    for (const s of this.slots) {
      if (inBounds(item, s)) {
        log(`item ${item.name} dropped on slot`, LOG_LEVEL.DEBUG);

        return s
      }
    }

    log(`item ${item.name} not dropped on inventory`, LOG_LEVEL.DEBUG);

    return null;
  }
}