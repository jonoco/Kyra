import itemAtlas from '../items'

export default class Inventory {
  constructor(game) {
    this.game = game
    this.itemAtlas = itemAtlas
    this.itemGroup

    this.slots = [
      {x: 95, y: 160, height: 16, width: 16, name: null, item: null, occupied: false},
      {x: 115, y: 160, height: 16, width: 16, name: null, item: null, occupied: false},
      {x: 135, y: 160, height: 16, width: 16, name: null, item: null, occupied: false},
      {x: 155, y: 160, height: 16, width: 16, name: null, item: null, occupied: false},
      {x: 175, y: 160, height: 16, width: 16, name: null, item: null, occupied: false},
      {x: 95, y: 182, height: 16, width: 16, name: null, item: null, occupied: false},
      {x: 115, y: 182, height: 16, width: 16, name: null, item: null, occupied: false},
      {x: 135, y: 182, height: 16, width: 16, name: null, item: null, occupied: false},
      {x: 155, y: 182, height: 16, width: 16, name: null, item: null, occupied: false},
      {x: 175, y: 182, height: 16, width: 16, name: null, item: null, occupied: false}
    ]

    this.slotsGroup = this.game.add.group(); // group for slot objects
    this.inventory = this.game.add.group(); // group for items held in slots

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
      slot.name = null;
      slot.item = null;
      slot.occupied = false;
    }
  }


  add(item) {
    //
  }


  remove(item) {
    //
  }
}