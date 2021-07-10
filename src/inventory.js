import itemAtlas from './items'
import { inBounds, moveToCenter, log, dlog } from './utils'

export default class Inventory {
  constructor(game) {
    this.game = game
    this.itemAtlas = itemAtlas

    this.slots = [
      {x:  95, y: 160, height: 16, width: 16},
      {x: 115, y: 160, height: 16, width: 16},
      {x: 135, y: 160, height: 16, width: 16},
      {x: 155, y: 160, height: 16, width: 16},
      {x: 175, y: 160, height: 16, width: 16},
      {x:  95, y: 182, height: 16, width: 16},
      {x: 115, y: 182, height: 16, width: 16},
      {x: 135, y: 182, height: 16, width: 16},
      {x: 155, y: 182, height: 16, width: 16},
      {x: 175, y: 182, height: 16, width: 16}
    ]

    // group for slot objects
    this.slotsGroup = this.game.add.group(this.game.world, 'slots'); 
    // group for items held in slots
    this.inventory = this.game.add.group(this.game.world, 'inventory');  

    for (let i = 0; i < this.slots.length ; i++) {
      let x = this.slots[i].x * window.game.scaleFactor
      let y = this.slots[i].y * window.game.scaleFactor
      let height = this.slots[i].height * window.game.scaleFactor
      let width = this.slots[i].width * window.game.scaleFactor

      if (__DEBUG__) {
        // for inventory size debugging
        let slotBackground = this.game.make.graphics();
        slotBackground.beginFill(0xffffff, 0.5);
        slotBackground.drawRect(x, y, width, height);
        slotBackground.endFill();
        this.slotsGroup.add(slotBackground);
      }

      let slot = this.slotsGroup.create( x, y );
      slot.width = width;
      slot.height = height;
      slot.item = null;
    }
  }


  /**
   * Remove and return item from inventory group
   * @param {Sprite} item item to remove from inventory
   * @returns {Sprite} item removed from inventory
   */
  removeItemFromInventory (item) {
    dlog(`removing ${item.name} from inventory`);
    
    // clear the slot
    this.slotsGroup.forEach(slot =>{
      if (item === slot.item) {
        dlog(`removing ${item.name} from slot`)
        slot.item = null
        return this.inventory.removeChild(slot.item);
      }
    }, this)
  }


  /**
   * Move item from room to inventory
   * 
   * @param {Sprite} item item to move to inventory
   * @returns swapped item if inventory slot was occupied, else null
   */
  moveItemToInventory (item) {
    let swappedItem = null

    // move item from itemGroup to inventory group
    this.inventory.addChild(item)

    // find slot for item
    let slot;
    this.slotsGroup.forEach(_slot =>{
      if (inBounds(item, _slot)) {
        slot = _slot
      }
    }, this)

    if (!slot) {
      dlog(`${__filename} failed to move ${item.name} to inventory; no valid slot`)
      return
    }

    // swap items in occupied slot if necessary
    if (slot.item) {
      slot.item.position = {
        x: (Math.random()*100 + 50) * window.game.scaleFactor,
        y: 100 * window.game.scaleFactor
      }

      swappedItem = this.inventory.removeChild(slot.item)
    } 

    moveToCenter(item, slot)
    slot.item = item
    this.inventory.add(item)

    return swappedItem
  }


  itemDroppedOnInventory(item) {
    return (inBounds(item, this.slotsGroup))
  }
}