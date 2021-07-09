import Phaser from 'phaser';
import PF from 'pathfinding';
import lang from '../lang';
import events from '../events'
import Quests from '../quests'
import itemAtlas from '../items'
import { log, dlog } from '../utils'

export default class extends Phaser.State {
  init() {
    this.Quests = new Quests()

    // game debugging
    this.startRoom = 'room04';

    // utility variables
    this.timer;

    // event variables
    this.quests;
    this.eventTriggers;
    this.eventQueue = [];
    this.blockEvents = events

    // tilemap variables
    this.tileSize = (320/120) * window.game.scaleFactor; // native width / tile width
    this.tileX = 120;
    this.tileY = 75;
    this.map;
    this.layer;

    // grid variables
    this.grid;
    this.finder;

    // sprite variables
    this.spritesJSON;
    this.spritesGroup;
    this.player;
    this.tween;
    this.between;
    this.speed = 40; // lower is faster tweening
    this.direction;
    this.speech;
    this.animation;
    this.talkingSprite;
    this.colorAtlas = {
        "herman" : "#ffcc99",
        "player" : "#eeeeee",
        "brynn" : "#ff9999"
      };

    // inventory variables
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
    ];
    this.itemAtlas = itemAtlas
    this.inventory;
    this.slotsGroup;
    this.itemGroup;

    // gui variables
    this.gui;
    this.amulet;
    this.amuletGroup;

    // room variables
    this.room; // sprite of current room
    this.roomsJSON;
    this.currentRoom; // room meta from rooms.json
    this.previousRoom; // room meta from rooms.json
    this.door; // door name
    this.doors;
    this.doorGroup;
    this.blockGroup;
    this.music;
    this.text;
    this.currentMusic;
    this.openDoor; // checks if last click was on a door > reset on move complete
  }


  preload() { }


  create() {
    this.roomsJSON = this.cache.getJSON('rooms');
    this.spritesJSON = this.cache.getJSON('sprites');
    this.stage.backgroundColor = '#2d2d2d';
    this.physics.startSystem(Phaser.Physics.ARCADE);

    this.quests = this.Quests.quests
    this.eventTriggers = this.Quests.triggers

    this.createRoom();
    this.spritesGroup = this.game.add.group();
    this.createGui();
    this.createText();
    this.itemGroup = this.game.add.group();
    this.createMap();
    this.createGrid();
    this.createInputs();
    this.createInventory();
    this.doorGroup = this.game.add.group();
    this.doorDebug = this.game.add.group();
    this.blockGroup = this.add.group();
    this.createStartRoom();
    this.createPlayer();
  }


  update () {
    if (__DEBUG__) {
      this.game.debug.text('Open door: ' + this.openDoor, 5, 50);
      this.game.debug.text('Player position: ' + this.player.x +', '+ this.player.y, 5, 175);
      this.game.debug.text('Pointer position: ' + this.game.input.position.x + ', ' + this.game.input.position.y, 16, 525);
      //this.game.debug.soundInfo(this.music, 286, 475);
      this.game.debug.text('Text z index: ' + this.text.z, 276, 450);
      this.game.debug.text('Player z index: ' + this.player.z, 276, 475);
      this.game.debug.text('GUI z index: ' + this.gui.z, 276, 500);
      this.game.debug.text('room z index: ' + this.room.z, 276, 525);
      this.game.debug.text('itemGroup z index: ' + this.itemGroup.z, 276, 550);
      this.game.debug.text('spritesGroup z index: ' + this.spritesGroup.z, 276, 575);
      this.game.debug.text('slotsGroup z index: ' + this.slotsGroup.z, 276, 600);
    }

    if (this.openDoor) {
      this.physics.arcade.overlap(this.player, this.doorGroup, this.peekInDoor, null, this);
    }

    if (this.eventQueue.length) {
      this.enableInput(false);
    } else {
      this.enableInput(true);
    }
  }


  render() {
    this.changeSpriteIndex();
    this.changePlayerAnimation();
  }


  quitGame () {
    var blockBg = this.make.graphics();
        blockBg.beginFill(0x000000, 1);
        blockBg.drawRect(0, 0, this.game.width, this.game.height);
        blockBg.endFill();
        blockBg.alpha = 0;
    this.world.add(blockBg);

    var endMessage = this.add.image( 0, 0, 'end');
        endMessage.scale.setTo(window.game.scaleFactor);
        endMessage.alpha = 0;
        endMessage.inputEnabled = true;

    var fade = this.game.add.tween(blockBg);
        fade.to({ alpha: 1 }, 2000);
        fade.start();

    var message = this.game.add.tween(endMessage);
        message.to({ alpha: 1 }, 2000);
        message.start();

    endMessage.events.onInputDown.add(function () {
      this.cache.destroy();
      this.state.start('MainMenu');
    }, this);
  }


  // Evaulate an event
  evalEvent (event) {
    dlog(event + ' has triggered')

    // check whether event is linked to quest event
    if (this.eventTriggers[event]) {
      dlog('there is a quest linked to this event')
      var i = this.eventTriggers[event].length
      while (i--) {
        const events = this.Quests.updateQuest(this.eventTriggers[event][i])
        if (events) {
          this.queueEvents(events)
        }
      }
    }

    // pop next item in eventQueue
    if (event != null && this.eventQueue.length) {
      this.popEventQueue();
    }
  }


  // Add an event array to the event queue
  queueEvents (events) {
    var i = events.length;
    while (i--) {
      this.eventQueue.push(events[i]);
    }
  }


  // Pop next event from the event queue and execute it
  popEventQueue () {
    var event = this.eventQueue.pop();
    event ? this.exeEvent(event): null;
  }


  // Evaluate a block, executing any related events
  evalBlock (block) {
    var events = this.blockEvents[block].slice();

    this.queueEvents(events);
    this.popEventQueue();
  }


  // Determine event type then execute it
  exeEvent (event) {
    event.say         ? this.say(event.say, event.sprite, event.color) : null;
    event.turn        ? this.turnPlayer(event.turn) : null;
    event.wait        ? this.wait(event.wait) : null;
    event.togAnim     ? this.toggleAnimation(event.togAnim) : null;
    event.modAttr     ? this.modAttribute(event.modAttr) : null;
    event.playAnim    ? this.playAnimation(event.playAnim) : null;
    event.addItem     ? this.addItem(event.addItem) : null;
    event.removeItem  ? this.removeItem(event.removeItem) : null;
    event.move        ? this.move(event.move) : null;
    event.signal      ? this.evalEvent(event.signal) : null;
    event.altRoom     ? this.altRoom(event.altRoom) : null;
    event.killBlock   ? this.killBlock(event.killBlock) : null;
    event.killSprite  ? this.killSprite(event.killSprite) : null;
    event.modMeta     ? this.modMeta(event.modMeta) : null;
    event.sayAnim     ? this.sayAnim(event.sayAnim) : null;
    event.moveSprite  ? this.tweenSprite(event.moveSprite) : null;
    event.modRoomMeta ? this.modRoomMeta(event.modRoomMeta) : null;
    event.quit        ? this.quitGame() : null;
  }


  // Events


  // Remove block, e.g. after executing one-time block
  killBlock (block) {
    var blocks = this.blockGroup.children;
    var blocksMeta = this.currentRoom.blocks;

    var i = blocks.length;
    while (i--) {
      if (blocks[i].name == block) {
        this.blockGroup.remove(blocks[i], true);
      }
    }

    var j = blocksMeta.length;
    while (j--) {
      if (blocksMeta[j].name == block) {
        blocksMeta.splice( j, 1 );
      }
    }
  }


  // Change sprite frame
  setFrame (sprite, frame) {
    dlog('setting frame: ', frame);
    sprite.frameName = frame;
    sprite.alpha = 1;
  }


  // Creation chain


  // Create sprites for the current room
  createSprites () {
    const roomSprites = this.currentRoom.sprites;

    for (let i = 0 ; i < roomSprites.length ; i++ ) {
      let spriteProperty = this.spritesJSON[roomSprites[i].name];
      
      if (!spriteProperty) {
        throw new Error(`Sprite for room [${this.currentRoom.name}] not found in cache: check if sprite [${roomSprites[i].name}] exists`)
      }

      let newSprite = this.spritesGroup.create( roomSprites[i].x, roomSprites[i].y, roomSprites[i].name);
      newSprite.position.x = Math.round(newSprite.position.x * window.game.scaleFactor)
      newSprite.position.y = Math.round(newSprite.position.y * window.game.scaleFactor)

      if (spriteProperty.scale) {
        newSprite.scale.setTo(spriteProperty.scale * window.game.scaleFactor);
      } else {
        newSprite.scale.setTo(window.game.scaleFactor);
      }

      newSprite.width = Math.round(newSprite.width)
      newSprite.height = Math.round(newSprite.height)

      if (spriteProperty.invisible) {
        this.showSprite(newSprite, false);
      }

      if (spriteProperty.reverse) {
        newSprite.anchor.x = 0.5;
        newSprite.scale.x *= -1;
      }

      dlog(`creating sprite ${roomSprites[i].name} at { ${newSprite.position.x}, ${newSprite.position.y} } with scale: ${newSprite.scale} h: ${newSprite.height} w: ${newSprite.width}`)

      spriteProperty.animated ? this.createSpriteAnimation(newSprite, spriteProperty):null;
      spriteProperty.action ? this.createSpriteAction(newSprite, spriteProperty):null;
      spriteProperty.startFrame ? this.setFrame(newSprite, spriteProperty.startFrame):null;
    }
  }


  // Create room blocks
  createBlocks () {
    var blank;
    var blocks = this.currentRoom.blocks;

    var i = blocks.length;
    while (i--) {
      blank = this.blockGroup.create( blocks[i].x, blocks[i].y);
      blank.position.x *= window.game.scaleFactor
      blank.position.y *= window.game.scaleFactor
      blank.height = blocks[i].height * window.game.scaleFactor;
      blank.width = blocks[i].width * window.game.scaleFactor;
      blank.name = blocks[i].name;
      blank.inputEnabled = true;
      blank.events.onInputDown.add(function (data) {
        this.evalBlock(data.name);
      }, this);

      if (__DEBUG__) {
        var blockBg = this.game.make.graphics();
        blockBg.beginFill(0x00ffff, 0.5);
        blockBg.drawRect(
            blocks[i].x * window.game.scaleFactor,
            blocks[i].y * window.game.scaleFactor,
            blocks[i].width * window.game.scaleFactor,
            blocks[i].height * window.game.scaleFactor);
        blockBg.endFill();
        this.blockGroup.add(blockBg);
      }
    }
  }


  // Compile a sprite's animations
  createSpriteAnimation (sprite, property) {
    var animations = property.animations;

    for (const [anim, _] of Object.entries(animations)) {
      sprite.animations.add(
        animations[anim].name,
        animations[anim].frames,
        animations[anim].speed,
        animations[anim].loop,
        false);

      // unless sprite is set to start automatically, hide it
      if (animations[anim].start) {
        sprite.animations.play(animations[anim].name);
      } else {
        sprite.alpha = 0;
      }
    }
  }


  // Add actions to sprite
  createSpriteAction (sprite, property) {
    var action = property.action;

    sprite.inputEnabled = true;
    if (action.click) {
      sprite.events.onInputDown.add(function (data) {
        this.evalEvent(sprite.key);

        if (action.click.animation) {

          sprite.alpha = 1;
          this.animation = sprite.animations.play(action.click.animation, null, false, true);
          this.animation.onComplete.add(function (data) {
            if (__DEBUG__) console.log('animation complete');
            this.evalEvent(action.click.animation);
          }, this);
        }// if has animation on click

        if (action.click.text) {
          //say something
          this.say(action.click.text);
        }// if has text on click

      }, this);
    }// if has click action

    if (action.drag) {
      // have sprite respond to item dragged onto it
      // sprite should have array of drag-actionable items to compare to

    }// if has drag action
  }


  // Create room
  createRoom () {
    this.room = this.game.add.image(window.game.scaleFactor, window.game.scaleFactor );
    this.room.scale.setTo(window.game.scaleFactor);
    this.room.inputEnabled = true;
  }


  // Create text
  createText () {
    this.speech = this.add.text();
    this.speech.font = 'kyrandia';
    this.speech.fontSize = 22;
    this.speech.stroke = '#000000';
    this.speech.strokeThickness = 3;
    this.speech.kill();

    this.text = this.add.text();
    this.text.font = 'kyrandia';
    this.text.x = 8 * window.game.scaleFactor;
    this.text.y = 145 * window.game.scaleFactor;
    this.text.fill = '#bbbbbb';
  }


  // Create initial room
  createStartRoom () {
    this.currentRoom = this.roomsJSON[this.startRoom];
    this.room.loadTexture(this.startRoom);
    this.createDoors();
    this.createBlocks();
    this.createItems();
    this.createSprites();
    this.importGrid();
    this.checkMusic();
    this.changeRoomText(this.currentRoom.text);
  }


  // Create GUI
  createGui () {

    this.gui = this.add.image( 0, 0, 'gui');
    this.gui.scale.setTo(window.game.scaleFactor);

    this.createAmulet();
  }


  // Create amulet and animations
  createAmulet () {
    this.amulet = this.add.sprite( 224 * window.game.scaleFactor, 152 * window.game.scaleFactor, 'amulet');
    this.amulet.inputEnabled = true;
    this.amulet.scale.setTo(window.game.scaleFactor);
    this.amulet.alpha = 0;

    this.amulet.animations.add('on', [
      "amulet-1", "amulet-2", "amulet-3", "amulet-4", "amulet-5", "amulet-6",
      "amulet-7", "amulet-8", "amulet-9", "amulet-10", "amulet-11", "amulet-12",
      "amulet-13", "amulet-14", "amulet-15", "amulet-16", "amulet-17", "amulet-18",
      "amulet-19", "amulet-20", "amulet-21", "amulet-22", "amulet-23"],
      8, true, false);
  }


  // Create inventory
  createInventory () {
    this.slotsGroup = this.game.add.group(); // group for slot objects
    this.inventory = this.game.add.group(); // group for items held in slots

    for (var i = 0; i < this.slots.length ; i++) {
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

      var slot = this.slotsGroup.create( x, y );
      slot.width = width;
      slot.height = height;
      slot.name = null;
      slot.item = null;
      slot.occupied = false;
    }
  }


  // Create items
  createItems () {
    /*
      iter each item in room.items
      check item sprite sheet frame from itemAtlas
      make each item draggable
      save inventory items in separate inventory object
    */

    this.items = this.currentRoom.items;

    for (var i = 0 ; i < this.items.length ;i++) {
      this.spawnItem(this.items[i]);
    }
  }


  // Create player
  createPlayer () {

    // Use the first door's entry as the starting position when spawning player
    const startPosition = this.doors[Object.keys(this.doors)[0]].entry

    this.player = this.game.add.sprite(startPosition.x * window.game.scaleFactor, startPosition.y * window.game.scaleFactor, 'player', 'stand-right');
    this.player.name = 'player';

    this.player.animations.add('walk-right', [
      'right-1','right-2','right-3','right-4',
      'right-5','right-6','right-7', 'right-8'
    ], 10, true, false);

    this.player.animations.add('walk-left', [
      'left-1','left-2','left-3','left-4',
      'left-5','left-6','left-7', 'left-7'
    ], 10, true, false);

    this.player.animations.add('walk-up', [
      'up-1','up-2','up-3','up-4',
      'up-5','up-6'
    ], 10, true, false);

    this.player.animations.add('walk-down', [
      'down-1','down-2','down-3','down-4',
      'down-5','down-6'
    ], 9, true, false);

    this.player.animations.add('talk', [
      'talk-1', 'talk-2', 'talk-3', 'talk-4',
      'talk-5', 'talk-6', 'talk-7', 'talk-8',
      'talk-9', 'talk-10', 'talk-11', 'talk-12',
    ], 8, true, false);

    this.player.scale.setTo(window.game.scaleFactor);
    this.player.anchor = {x:0.5, y:0.9};
    this.physics.arcade.enableBody(this.player);

    this.spritesGroup.add(this.player);
  }


  // Create grid
  createGrid () {
    this.grid = new PF.Grid(this.tileX, this.tileY);
    this.finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });

    if (__DEBUG__) {
      this.map.addTilesetImage('pathing');
    }
  }


  // Create input events
  createInputs () {
    //this.input.onTap.add(function () {}, this);
    this.amulet.events.onInputDown.add(function (pointer) {
      if (__DEBUG__) console.log('amulet hit');
    }, this);

    this.room.events.onInputDown.add(function (pointer) {
      if (this.speech.alive) {
        this.speech.kill();
        return null;
      }

      this.closeDoor();
      this.stopMoving();
      this.move(this.game.input.position);
    }, this);
  }


  // Create pathfinding map
  createMap () {

    this.map = this.game.add.tilemap();
    this.map.tileWidth = this.tileSize;
    this.map.tileHeight = this.tileSize;

    this.layer = this.map.create('layer', this.tileX, this.tileY, this.tileSize, this.tileSize);
  }


  // Create doors
  createDoors () {
    this.doors = this.currentRoom.doors;
    for (const [door, _] of Object.entries(this.doors)) {

      let x = this.doors[door].x * window.game.scaleFactor
      let y = this.doors[door].y * window.game.scaleFactor
      let height = this.doors[door].height * window.game.scaleFactor
      let width = this.doors[door].width * window.game.scaleFactor
      let entry = this.doors[door].entry

      let newDoor = this.doorGroup.create( x, y );
        newDoor.height = height;
        newDoor.width = width;
        newDoor.name = this.doors[door].name;
        newDoor.inputEnabled = true;
        // newDoor.input.useHandCursor = true;
        this.physics.arcade.enable(newDoor);

        // door cursor
        newDoor.events.onInputOver.add(function () {
          this.game.canvas.style.cursor = "pointer";
        }, this);
        newDoor.events.onInputOut.add(function () {
          this.game.canvas.style.cursor = "default";
        }, this);

        newDoor.events.onInputDown.add(this.moveToDoor, this);

      if (__DEBUG__) {
        var doorBg = this.game.make.graphics();
        doorBg.beginFill(0x00ee00, 0.3);
        doorBg.drawRect(x, y, width, height);
        doorBg.endFill();

        this.doorDebug.add(doorBg);
      }
    }
  }


  // Update chain


  // Move sprites in front or behind player
  changeSpriteIndex () {
    // move sprites behind/in front of player
    for (let i = 0 ; i < this.spritesGroup.length ; i++) {
      let sprite = this.spritesGroup.children[i];

      if (sprite.name == 'player') {
        //pass
      } else if (this.player.bottom < sprite.bottom) {
        // sprite is in front of player
        sprite.bringToTop();

       //dlog(`pull ${sprite.name} in front of player`)
      } else {
        // sprite is behind player
        sprite.sendToBack();

        //dlog(`push ${sprite.name} behind player`)
      }
    }

    for (let item of this.itemGroup.children) {
      dlog(`item: ${item.bottom} player: ${this.player.bottom}`)
      if (this.player.bottom < item.bottom) {
        item.bringToTop()
      } else {
        item.sendToBack()
      }
    }
  }


  // Change player animation based on movement vector
  changePlayerAnimation () {

    if (Math.abs(this.player.deltaY) > Math.abs(this.player.deltaX)) {
      // change to up//down texture

      if (this.player.deltaY > 0) {

        this.player.animations.play('walk-down');
        this.direction = 'down';

      } else if ( this.player.deltaY < 0) {

        this.player.animations.play('walk-up');
        this.direction = 'up';
      }

    } else if (this.player.deltaX > 0) {

      this.player.animations.play('walk-right');
      this.direction = 'right';

    } else if (this.player.deltaX < 0) {

      this.player.animations.play('walk-left');
      this.direction = 'left';

    } else if (this.speech.alive) {

      if (this.speech.name == 'player') {
        this.player.animations.play('talk');
      } else {
        // this.talkingSprite = this.getSprite(this.speech.name);
        // this.talkingSprite.animations.play('talk');
        this.player.animations.stop();
      }

    } else {
      //stop
      this.talkingSprite ? this.talkingSprite.animations.stop():null;

      if (this.direction == 'left' || this.direction == 'up') {
        this.player.animations.stop();
        this.player.frameName = 'stand-left';
      } else {
        this.player.animations.stop();
        this.player.frameName = 'stand-right';
      }
    }
  }


  // Quest event functions


  // Sprite talking
  say (string, key, color) {

    // include key for event evaluation
    var sprite = key ? this.getSprite(key): this.player
    var textColor = color ? color: "player"

    this.speech.revive()
    this.speech.x = sprite.x
    this.speech.y = sprite.top - 40
    this.speech.text = string
    this.speech.stroke = '#000000'
    this.speech.strokeThickness = 5
    this.speech.fill = this.colorAtlas[textColor]
    this.speech.name = sprite.key

    if (this.speech.right > 306 * window.game.scaleFactor) {
      this.speech.x -= this.speech.right - (306 * window.game.scaleFactor)
    }

    if (this.speech.top < 40) {
      this.speech.y = 40
    }

    this.speech.events.onKilled.addOnce(function (data) {

      this.evalEvent(sprite.key);
    }, this);

    var length = string.split(' ').length;
    var timer = this.time.create();
    timer.add(length*400, function () {
      this.speech.kill();
    },this);
    timer.start();
  }


  // Change player sprite frame
  turnPlayer (direction) {
    if (__DEBUG__) console.log('turning ' + direction);

    if (direction == 'left') {
      this.player.frameName = 'stand-left';
    } else if (direction == 'right') {
      this.player.frameName = 'stand-right';
    }

    this.evalEvent(direction);
  }


  // Delay events
  wait (time) {
    if (__DEBUG__) console.log('wait called for ' + time + ' ms');

    var timer;
    timer ? timer.destroy():null;

    timer = this.time.create()
    timer.add(time, function () {
      this.evalEvent(time);
    }, this)
    timer.start();
  }


  // Change sprite animation
  toggleAnimation (data) {
    var sprite = data.sprite;
    var animation = data.animation;
    var toggle = data.start;

    this.spritesJSON[sprite].animations[animation].start = toggle;

    this.evalEvent(animation);
  }


  // Modify a sprite's meta information
  modMeta (data) {
    var sprite = data.sprite;
    var attr = data.attr;
    var val = data.value;

    this.spritesJSON[sprite][attr] = val;

    this.evalEvent(sprite);
  }


  // Modify a room's meta information
  modRoomMeta (data) {
    var room = data.room;
    var attr = data.attr;
    var value = data.value;
    var door = data.door || null;

    if (door) {
      this.roomsJSON[room][attr][door] = value;
    } else {
      this.roomsJSON[room][attr] = value;
    }

    this.evalEvent(room+attr);
  }


  // Modify an object's meta information
  modAttribute (data) {
    // much more powerful function to modify sprites, images
    // can find objects within groups
    // this.world.set(child, key, value);
    var key = data.sprite;
    var attr = data.attr;
    var value = data.value;

    var i = this.world.children.length;
    while (i--)
    {
      if (this.world.children[i].name == "group" && this.world.children[i].children.length) {

        var j = this.world.children[i].children.length;
        while (j--) {

          if (this.world.children[i].children[j].key == key) {
            // found object
            this.world.children[i].children[j][attr] = value;
            this.evalEvent('mod-' + key);
            return true;
          }

        }
      } else if (this.world.children[i].name != "group") {
        if (this.world.children[i].key == key) {
          // found object
          this.world.children[i][attr] = value;
          this.evalEvent('mod-' + key);
          return true;
         }
      }
    }
  }


  // Play sprite animation
  playAnimation (data) {
    var key = data.sprite;
    var animName = data.animation;
    var kill = data.kill || false;
    var hide = data.hide || false;
    var sprite;
    var loop = this.spritesJSON[key].animations[animName].loop;

    sprite = this.getSprite(key);
    this.showSprite(sprite, true);

    sprite.events.onAnimationComplete.addOnce(function () {
      hide ? this.showSprite(sprite, false):null;
      this.evalEvent(animName);
    }, this);

    sprite.animations.play(animName, null, loop, kill);
  }


  // Play animation with simultaneous speech
  sayAnim (data) {
    // event called by call to this.say()

    var key = data.sprite;
    var animName = data.animation;
    var kill = data.kill ? data.kill: false;
    var hide = data.hide ? data.hide: false;
    var text = data.say;
    var color = data.color;
    var sprite;
    var loop = this.spritesJSON[key].animations[animName].loop;

    sprite = this.getSprite(key);
    this.showSprite(sprite, true);
    this.say(text, key, color);

    sprite.events.onAnimationComplete.addOnce(function () {
      hide ? this.showSprite(sprite, false):null;
    }, this);

    sprite.animations.play(animName, null, loop, kill);
  }


  // Add an item to the room
  addItem (data) {
    var item = { name: data.item, x: data.x, y: data.y };
    this.currentRoom.items.push(item);
    this.spawnItem(item);

    this.evalEvent(data.item);
  }


  // Remove an item from the room
  removeItem (data) {
    dlog(`removing ${data}`)
    let itemName = data
    let removeItem = null

    this.itemGroup.forEach(function (item) {
      if (itemName == item.name) {
        removeItem = item
      }
    }, this)


    let i = this.currentRoom.items.length
    while (i--)
    {
      if (this.currentRoom.items[i].name == itemName) {
        this.currentRoom.items.splice( i, 1 )
      }
    }

    this.itemGroup.remove(removeItem)

    this.evalEvent('remove-' + data)
  }


  // Change room to alternate version
  altRoom (room) {

    var newTexture = room + '-alt';
    var newText = this.roomsJSON[room].altText;
    var newSprites = this.roomsJSON[room].altSprites;

    this.roomsJSON[room].alt = true;

    if (newSprites) {
      this.roomsJSON[room].sprites = this.roomsJSON[room].altSprites;
    }

    if (newText) {
      this.roomsJSON[room].text = this.roomsJSON[room].altText;
    }

    if (this.currentRoom.name == room) {
      this.room.loadTexture(newTexture);
      this.changeRoomText(newText);
      this.spritesGroup.remove(this.player);
      this.world.addAt(this.player, 1);
      this.spritesGroup.removeAll(true);

      this.createSprites();
      this.world.remove(this.player);
      this.spritesGroup.add(this.player);
    }
    if (__DEBUG__) console.log('altering ' + this.roomsJSON[myRoom]);

    this.evalEvent('altRoom');
  }


  // Remove sprite
  killSprite (sprite) {
    var sprites = this.spritesGroup.children;
    var spritesMeta = this.currentRoom.sprites;

    var i = sprites.length;
    while (i--) {
      if (sprites[i].name == sprite) {
        this.spritesGroup.remove(sprites[i], true);
      }
    }

    var j = spritesMeta.length;
    while (j--) {
      if (spritesMeta[j].name == sprite) {
        spritesMeta.splice( j, 1 );
      }
    }

    this.evalEvent(sprite);
  }


  // Movement functions


  // Move with intent to change rooms
  moveToDoor (door) {
    let myDoor = this.currentRoom.doors[door.name]

    dlog(`moving to door ${door.name} at { ${myDoor.entry.x}, ${myDoor.entry.y} }`)

    this.stopMoving()
    this.openDoor = myDoor.name
    this.move({
      x: myDoor.entry.x * window.game.scaleFactor,
      y: myDoor.entry.y * window.game.scaleFactor
    })
  }


  // Move player
  move (position) {
    dlog(`move to { ${position.x}, ${position.y} }`)

    this.findWay(position);
  }


  // Stop player
  stopMoving () {
    dlog('stop movement')

    if (this.tween) {
      this.tween.stop(true);
      this.tweens.remove(this.tween);
    }
  }


  // Find route in pathfinding grid
  findWay (position) {

    let startX = this.layer.getTileX(this.player.position.x);
    let startY = this.layer.getTileY(this.player.position.y);
    let endX = this.layer.getTileX(position.x);
    let endY = this.layer.getTileY(position.y);

    dlog(`moving from tile { ${startX},${startY} } to { ${endX}, ${endY} }`);

    if (endX > this.tileX || endX < 0 || endY > this.tileY || endY < 0) {
      log(`cannot move to tile { ${endX}, ${endY} }`)
      return
    }

    if (startX != endX || startY != endY) {

      let grid = this.grid.clone();
      let path = this.finder.findPath(startX, startY, endX, endY, grid);

      // Check if walkable path found
      if (path.length == 0) {
        dlog(`no walkable path found`)
        return;
      }

      var newPath = PF.Util.smoothenPath(this.grid, path);
      this.tweenPath(newPath);
    }
  }


  // Check if door will allow travel
  peekInDoor (player, door) {

    if (door.name == this.openDoor) {
      this.openDoor = false;
      this.door = door.name;

      this.exitRoom();
    }
  }


  // Close door
  closeDoor () {
    this.openDoor = null;
  }


  // Transfer out of current rooms via current selected door
  exitRoom () {
    let myDoor = this.currentRoom.doors[this.door];
    this.previousRoom = this.roomsJSON[this.currentRoom.name];

    this.enableInput(false);

    // use exit animation if present
    if (myDoor.animation.exit) {
      this.exitRoomAnimation();
    } else if (myDoor.offPoint) {
      this.tweenOut();
    }
  }


  // Transfer into room by currently selected door
  enterRoom () {
    let myDoor = this.currentRoom.doors[this.previousRoom.name];

    // check for enter animation
    if (myDoor.animation.enter) {
      this.enterRoomAnimation();
    } else {
       //move player into position for ontweening
      let startPoint = { ... myDoor.offPoint }

      // scale starting point coords
      startPoint.x *= window.game.scaleFactor
      startPoint.y *= window.game.scaleFactor

      dlog(`entering ${myDoor.name} at { ${startPoint.x}, ${startPoint.y} }`)

      this.player.alpha = 1;
      this.player.position = startPoint;
      this.tweenIn(myDoor);

    }
  }


  // Run exiting animation
  exitRoomAnimation () {
    var myDoor = this.currentRoom.doors[this.door];
    var spriteName;
    var exitSprite;
    var anim;

    this.player.alpha = 0;

    // find and play the entrance sprite from the room's this.spritesGroup
    var exitSpriteName = myDoor.animation.exit;

    for (var i = 0 ; i < this.spritesGroup.length ; i++) {
      if (this.spritesGroup.children[i].key == exitSpriteName) {
        exitSprite = this.spritesGroup.children[i];
      }
    }
    // remove exit sprite from spritesGroup to prevent preupdate error
    this.spritesGroup.remove(exitSprite);
    this.world.add(exitSprite);

    exitSprite.alpha = 1;
    exitSprite.bringToTop();
    anim = exitSprite.animations.play('on', null, false, true);
    anim.onComplete.add(function (data) {

      this.evalEvent('on');
      this.loadRoom();

    }, this);
  }


  // Run entering animation
  enterRoomAnimation () {
    var myDoor = this.currentRoom.doors[this.previousRoom.name];
    var spriteName;
    var enterSprite;
    var anim;

    let startPoint = {...myDoor.entry}

    // scale starting point coords
    startPoint.x *= window.game.scaleFactor
    startPoint.y *= window.game.scaleFactor

    this.player.alpha = 0;

    // find and play the exiting sprite from the room's this.spritesGroup
    spriteName = myDoor.animation.enter;

    for (var i = 0 ; i < this.spritesGroup.length ; i++) {
      if (this.spritesGroup.children[i].key == spriteName) {
        enterSprite = this.spritesGroup.children[i];
      }
    }

    enterSprite.alpha = 1;
    enterSprite.bringToTop();
    anim = enterSprite.animations.play('on', null, false, true);
    anim.onComplete.add(function (data) {
      this.evalEvent('on');
      // after animation end signal, change room
      this.player.position = startPoint;
      this.player.alpha = 1;
      this.openRoom();
    }, this);
  }


  // Move player into room
  tweenIn (door) {

    let entryPoint = {...door.entry}

    // scale entry point coord
    entryPoint.x *= window.game.scaleFactor
    entryPoint.y *= window.game.scaleFactor

    let dist = this.physics.arcade.distanceBetween(this.player.position, entryPoint)/this.tileSize;

    dlog(`tweening in to { ${entryPoint.x}, ${entryPoint.y} }`);

    this.tween = this.add.tween(this.player);
    this.tween.to(entryPoint, dist*this.speed); //todo adjust tween speed
    this.tween.onComplete.addOnce(function () {
      dlog('tween in finished');
      this.openRoom();
    }, this);
    this.tween.start();
  }


  // Move player out of room
  tweenOut () {

    let offPoint = {...this.currentRoom.doors[this.door].offPoint}

    // scale off point coord
    offPoint.x *= window.game.scaleFactor
    offPoint.y *= window.game.scaleFactor

    let dist = this.physics.arcade.distanceBetween(this.player.position, offPoint)/this.tileSize;

    dlog(`tweening out to { ${offPoint.x}, ${offPoint.y} }`);

    this.between = this.game.add.tween(this.player)
    this.between.to(offPoint, dist*this.speed); //todo adjust betweening speed

    this.between.onComplete.addOnce(function () {
      //check for exit animations

      dlog('tween out finished');
      this.loadRoom();

    }, this);

    if (this.tween.isRunning) {
      dlog('chaining tween');
      this.tween.chain(this.between);
    } else {
      dlog('running single tween');
      this.between.start();
    }
  }


  // Signal player tweening complete
  tweenComplete () {
    this.evalEvent('moved');

    // Close any open doors
    // TODO
    // closeDoor timer callback losing lexical scope, causing bug
    //var timer = this.time.create();
    //timer.add(500, this.closeDoor);
    //timer.start();
  }


  // Move a sprite
  tweenSprite (data) {

    this.playAnimation(data);

    var path = data.path;
    var key = data.sprite;
    var sprite = this.getSprite(key);

    this.tween = this.add.tween(sprite);
    this.tween.onComplete.addOnce(this.tweenComplete, this);

    var prevX = sprite.position.x/this.tileSize;
    var prevY = sprite.position.y/this.tileSize;
    var x;
    var y;
    var dist;

    for ( var i = 0; i < path.length ; i++ ) {
      x = path[i][0];
      y = path[i][1];
      dist = this.physics.arcade.distanceBetween({x: x, y: y}, {x: prevX, y: prevY});

      if (i == path.length - 1) {
        this.tween.to( { x: x*this.tileSize, y: y*this.tileSize }, dist*this.speed);
      } else if (x == prevX || y == prevY && i%3) {
        // pass
      }  else {
        this.tween.to( { x: x*this.tileSize, y: y*this.tileSize }, dist*this.speed);
        prevX = x;
        prevY = y;
      }
    }

    this.tween.start();
  }


  // Move player along path
  tweenPath (path) {

    this.tween = this.add.tween(this.player);
    this.tween.onComplete.addOnce(this.tweenComplete, this);

    var prevX = this.player.position.x/this.tileSize;
    var prevY = this.player.position.y/this.tileSize;

    for ( var i = 0; i < path.length ; i++ ) {
      var x = path[i][0];
      var y = path[i][1];
      var dist = this.physics.arcade.distanceBetween({x: x, y: y}, {x: prevX, y: prevY});

      if (i == path.length - 1) {
        this.tween.to( { x: x*this.tileSize, y: y*this.tileSize }, dist*this.speed);
      } else if (x == prevX || y == prevY && i%3) {
        // pass
      }  else {
        this.tween.to( { x: x*this.tileSize, y: y*this.tileSize }, dist*this.speed);
        prevX = x;
        prevY = y;
      }
    }

    this.tween.start();
  }


  // Prepare a room for entrance
  loadRoom() {
    var nextRoom = this.roomsJSON[this.door];
    if (__DEBUG__) console.log('loading room ' + nextRoom.name);

    this.closeRoom();

    // ready next room

    if (nextRoom.alt) {
      this.room.loadTexture(nextRoom.name + '-alt');
    } else {
      this.room.loadTexture(nextRoom.name);
    }

    this.currentRoom = this.roomsJSON[nextRoom.name];
    this.changeRoomText(nextRoom.text);
    this.checkMusic();
    this.importGrid();
    this.createDoors();
    this.createBlocks();
    this.createItems();
    this.createSprites();

    // return player sprite to spriteGroup
    this.world.remove(this.player);
    this.spritesGroup.add(this.player);

    this.enterRoom();
  }


  // Prepare to leave current room
  closeRoom () {
    dlog('closing room ' + this.currentRoom.name);
    this.saveItems(); // save room state

    // save player sprite
    this.spritesGroup.remove(this.player);
    this.world.addAt(this.player, 1);

    this.blockGroup.removeAll(true);
    this.doorGroup.removeAll(true);
    this.doorDebug.removeAll(true);
    this.itemGroup.removeAll(true);
    this.spritesGroup.removeAll(true);
  }


  // Enable input on room after entering
  openRoom () {
    if (__DEBUG__) console.log('opening room ' + this.currentRoom.name);

    this.evalEvent(this.currentRoom.name);
    this.enableInput(true);
  }


  // Item and inventory functions


  // Clear inventory space if inven. item removed
  checkItemOrigin (item) {

    // if item is from inventory : clear its slot
    var slots = this.slotsGroup.children;
    for (var i = 0 ; i < slots.length ; i++) {

      if (this.inBounds(item, slots[i])) {
        if (__DEBUG__) console.log('removing item from: ' + slots[i].x + ' ' + slots[i].y);
        this.removeItemFromInventory(item, slots[i]);
      }
    };
  }


  // Handle dropping an item
  checkItemDest (item) {
    var placed = false;


    // Check if item hit room
    if (this.inBounds(item, this.room) && !placed) {
      if (__DEBUG__) console.log('item hit room');

      // check for sprites hits -> event call them
      this.spritesGroup.forEach(function (sprite) {
        if (this.inBounds(item, sprite) && sprite.inputEnabled) {
          if (__DEBUG__) console.log(sprite.key + '-' + item.name);
          this.evalEvent(sprite.key + '-' + item.name);
          this.tossItem(item);
        }
      }, this);

      this.blockGroup.forEach(function (block) {
        if (this.inBounds(item, block) && block.inputEnabled) {
          if (__DEBUG__) console.log(block.name + '-' + item.name);
          this.evalEvent(block.name + '-' + item.name);
          this.tossItem(item);
        }
      }, this);

      placed = true;
    }
    //check if inventory hit
    else if (this.inBounds(item, this.slotsGroup) && !placed) {
      this.slotsGroup.forEach(function (slot) {
        if (this.inBounds(item, slot)) {
          this.moveItemToInventory(item, slot);
          placed = true;
        }
      }, this);
    }
    //otherwise: toss item onto the ground
    if (!placed) {
      this.tossItem(item);
    }
  }


  // Clear inventory slot
  clearSlot (slot) {
    slot.name = null;
    //slot.item = null;
    slot.occupied = false;
  }


  // Toss item into the room
  tossItem (item) {
    item.x = this.player.x;
    item.y = this.player.y - 25;
  }


  // Spawn item into room
  spawnItem (itemData) {
    var item = this.game.make.image(itemData.x * window.game.scaleFactor, itemData.y * window.game.scaleFactor, 'items');
    item.name = itemData.name;
    var frame = this.itemAtlas[item.name];
    item.frame = frame;
    item.scale.setTo(0.5 * window.game.scaleFactor);
    item.inputEnabled = true;
    item.input.enableDrag(true, true);

    dlog(`spawn ${item.name} at x: ${item.position.x} y: ${item.position.y}`)

    // check if item was in inventory, if so, remove from slot
    item.events.onDragStart.add(function (data) {
      dlog(item.name + ' picked up');
      this.changeRoomText(item.name + ' picked up');
      this.checkItemOrigin(data);
    }, this);

    // then check drop location
    item.events.onDragStop.add(function (data) {
      dlog(`${item.name} placed at { ${item.position.x/window.game.scaleFactor}, ${item.position.y/window.game.scaleFactor} }`);
      this.changeRoomText(`${item.name} placed`);
      this.checkItemDest(data);
    }, this);

    this.itemGroup.add(item);
  }


  // Move item from inventory to room
  removeItemFromInventory (item, slot) {

    this.currentRoom.items.push( {"name" : item.name} );

    this.inventory.remove(slot.item);
    this.itemGroup.add(item);
    this.clearSlot(slot);
  }


  // Move item from room to inventory
  moveItemToInventory (item, slot) {

    // move item from itemGroup to inventory group
    // if slot occupied, move item to room floor, random pos
    // and move from inventory group to itemGroup

    if (slot.occupied) {
      slot.item.position = {
        x: (Math.random()*100 + 50) * window.game.scaleFactor,
        y: 100 * window.game.scaleFactor
      }
      this.inventory.remove(slot.item)
      this.itemGroup.add(slot.item)
    }

    this.moveToCenter(item, slot)
    slot.name = item.name
    slot.item = item
    slot.occupied = true

    var i = this.currentRoom.items.length
    while (i--)
    {
      if (this.currentRoom.items[i].name == item.name) {
        this.currentRoom.items.splice( i, 1 )
      }
    }

    this.itemGroup.remove(item)
    this.inventory.add(item)
  }


  // Centers obj1 onto obj2
  moveToCenter (obj1, obj2) {
    obj1.x = obj2.x + obj2.width/2 - obj1.width/2;
    obj1.y = obj2.y + obj2.height/2 - obj1.height/2;
  }


  // Sprite bounds comparison; checks if obj1 is in the bounds of obj2
  inBounds (obj1, obj2) {
    var obj = obj1.getBounds();
    var bound = obj2.getBounds();

    if (bound.x < obj.centerX && (bound.x + bound.width) > obj.centerX &&
        bound.y < obj.centerY && (bound.y + bound.height) > obj.centerY) {
      return true;
    } else {
      return false;
    }
  }


  // Save room's item information
  saveItems () {
    // iter each item in itemGroup, the local items
    // save new position of each item to room.items

    this.itemGroup.forEach(function(item) {
      for (var i = 0; i < this.currentRoom.items.length ; i++) {
        if (item.name == this.currentRoom.items[i].name) {
          dlog('saving ' + item.name + ' location');
          this.currentRoom.items[i].x = item.x / window.game.scaleFactor
          this.currentRoom.items[i].y = item.y / window.game.scaleFactor
          break;
        }
      }
    }, this);
  }


  // Toggle player input
  enableInput (bool) {
    this.input.enabled = bool;
  }


  // Check if music needs to be updated
  checkMusic() {
    if (this.currentMusic != this.currentRoom.music) {

      this.music ? this.music.fadeOut(): null;
      this.currentMusic = this.currentRoom.music;

      if (this.currentMusic != null) {

        if (__DEBUG__) console.log('playing music: '+this.currentMusic);
        this.music = this.game.sound.add(this.currentMusic, 1, true);
        this.music.onDecoded.add(function() {
          //this.music.play();
          this.music.fadeIn();
        }, this);

      }
    }
  }


  // Change room GUI text
  changeRoomText (string) {
    this.text.text = string;
  }


  // Change pathing grid
  importGrid() {

    var roomJson = this.currentRoom.name + '_json';
    var gridJson = this.cache.getJSON(roomJson);
    this.grid.nodes = gridJson;

    if (__DEBUG__) {

      // Clear old debug tiles
      for (var x = 0; x < this.tileX; x++) {
        for (var y = 0; y < this.tileY; y++) {
          this.map.removeTile(x, y, this.layer);
        }
      }

      // Make debug tiles
      for (var i = 0; i < gridJson.length ; i++) {
        for ( var j = 0 ; j < gridJson[i].length ; j++ ) {
          if (!gridJson[i][j].walkable) {
            var tile = this.map.putTile(0, gridJson[i][j].x, gridJson[i][j].y, this.layer);
            tile.alpha = 0.5;
          }
        }
      }
    }
  }


  // Create a clone of an object
  clone (object) {

    var clone = {};

    for (const [value, _] of Object.entries(object)) {
      clone[value] = object[value];
    }

    return clone;
  }


  // Retrieve sprite by key from the cache
  getSprite (key) {
    var i = this.world.children.length;
    while (i--)
    {
      if (this.world.children[i].name == "group") {

        var j = this.world.children[i].children.length;
        while (j--) {

          if (this.world.children[i].children[j].key == key) {

            return this.world.children[i].children[j];
          }
        }
      } else if (this.world.children[i].name != "group") {
        if (this.world.children[i].key == key) {

          return this.world.children[i];
        }
      }
    }
  }


  // Toggle a sprite's alpha
  showSprite (sprite, bool) {
    if (__DEBUG__) console.log('show sprite? ' + sprite.key + ':' + bool);
    var alpha = bool ? 1:0;
    sprite.alpha = alpha;
  }
}
