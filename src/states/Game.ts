import 'phaser'
import 'pixi'

import Pathing from '../pathing'
import Item from '../Item';
import Inventory from '../inventory'
import Door from '../Door';
import { log, dlog, inBounds } from '../utils'
import PoolDrop from '../entities/PoolDrop'
import Block from '../Block'
import {
  Action, ActionType, AddItemAction, AltRoomAction, KillBlockAction,
  KillSpriteAction, ModAttrAction, ModMetaAction, ModRoomMetaAction,
  MoveAction, MoveSpriteAction, PlayAnimAction,
  PutSpriteAction, RemoveItemAction, SayAction, SayAnimAction,
  TogAnimAction, TurnAction, WaitAction
} from '../Action'
import { Event, parseEvents } from '../Event'
import { parseQuests, Quest } from '../Quest'

const colorAtlas = {
  "herman" : "#ffcc99",
  "player" : "#eeeeee",
  "brynn" : "#ff9999"
};


export default class extends Phaser.State {
  debugPos: number;

  amulet: Phaser.Sprite;
  amuletGroup: Phaser.Group;
  animation: Phaser.Animation;
  between: Phaser.Tween;
  bgSprites: Phaser.Group;
  blockGroup: Array<Block>;
  currentMusic: string;
  currentRoom: any;
  debugGroup: Phaser.Group;
  debugOn: boolean;
  direction: string;
  door: string
  doorDebug: Phaser.Group;
  doorGroup: Phaser.Group;
  doors: Array<Object>;
  eventQueue: Array<any>;
  events: Event[];
  fgSprites: Phaser.Group;
  gui: Phaser.Image;
  heldItem: Phaser.Group;
  inventory: Inventory;
  itemGroup: Phaser.Group;
  items: Array<any>;
  mgSprites: Phaser.Group;
  music: Phaser.Sound;
  openDoor: string | null; // checks if last click was on a door > reset on move complete
  pathing: Pathing;
  player: Phaser.Sprite;
  playMusic: boolean;
  previousRoom: any;
  quests: Quest[];
  room: Phaser.Image;
  roomsJSON: Object;
  roomText: Phaser.Text;
  speech: Phaser.Text;
  speed: number;
  spritesJSON: Object;
  startRoom: string;
  talkingSprite: Phaser.Sprite;
  tween: Phaser.Tween;


  init() {
    // this.Quests = new Quests()

    // game debugging
    this.startRoom = 'room09';
    this.debugOn = __DEBUG__ || false
    this.playMusic = false

    // event variables
    // this.quests;
    // this.eventTriggers;
    this.eventQueue = [];

    // sprite variables
    this.bgSprites;
    this.mgSprites;
    this.fgSprites;
    this.spritesJSON;

    this.player;
    this.tween;
    this.between;
    this.speed = 40; // lower is faster tweening
    this.direction;
    this.speech;
    this.animation;
    this.talkingSprite;

    this.inventory;
    this.itemGroup;   // all items on the floor of the room

    // gui variables
    this.gui;
    this.amulet;
    this.amuletGroup;

    // room variables
    this.room; // image of current room
    this.roomsJSON;
    this.currentRoom; // room meta from rooms.json
    this.previousRoom; // room meta from rooms.json
    this.door; // door name
    this.doors;
    this.doorGroup;
    this.blockGroup;
    this.debugGroup;
    this.music;
    this.roomText;
    this.currentMusic;
    this.openDoor; // checks if last click was on a door > reset on move complete
  }


  preload() { }


  create() {
    this.events = parseEvents(this.cache.getJSON('events').events)
    this.quests = parseQuests(this.cache.getJSON('quests').quests)

    this.roomsJSON = this.cache.getJSON('rooms');
    this.spritesJSON = this.cache.getJSON('sprites');
    this.stage.backgroundColor = '#2d2d2d';
    this.physics.startSystem(Phaser.Physics.ARCADE);

    // this.quests = this.Quests.quests
    // this.eventTriggers = this.Quests.triggers

    // display groups layered for correct z depths
    this.createRoom();
    this.bgSprites = this.game.add.group(this.world, 'background sprites')
    this.itemGroup = this.game.add.group(this.world, 'item sprites')
    this.mgSprites = this.game.add.group(this.world, 'midground sprites')
    this.fgSprites = this.game.add.group(this.world, 'foreground sprites')
    this.createGui();
    this.inventory = new Inventory(this)
    this.heldItem = this.game.add.group(this.world, 'held items')

    this.pathing = new Pathing(this)

    this.createText();
    this.createInputs();
    this.doorGroup = this.game.add.group();
    this.doorDebug = this.game.add.group();
    this.blockGroup = [];
    this.debugGroup = this.add.group();
    this.createStartRoom();
    this.createPlayer();

    this.input.keyboard.addKeys({ "a": Phaser.KeyCode.A, "b": Phaser.KeyCode.B })
    let tildeKey = this.input.keyboard.addKey(Phaser.KeyCode.TILDE)
    tildeKey.onDown.add(this.toggleDebug, this)

    let key_1 = this.input.keyboard.addKey(Phaser.KeyCode.ONE)
    key_1.onDown.add(this.toggleMusic, this)
  }


  update () {
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

    if (this.debugOn) {
      this.debugScreen()
    }
  }


  /**
   * Show debug text
   */
  debugScreen() {
    this.debugPos = 1

    this.addDebugText(`Room: ${this.currentRoom.name}`);
    this.addDebugText(`Open door: ${this.openDoor}`);
    this.addDebugText(`Player position: ${this.player.x}, ${this.player.y}`);
    this.addDebugText(`Pointer position: ${this.game.input.position.x}, ${this.game.input.position.y}`);
    this.addDebugText(`Player z index: ${this.player.z}`);
    this.addDebugText(`GUI z index: ${this.gui.z}`);
    this.addDebugText(`room z index: ${this.room.z}`);
    this.addDebugText(`bgSprites z index: ${this.bgSprites.z}`);
    this.addDebugText(`mgSprites z index: ${this.mgSprites.z}`);
    this.addDebugText(`fgSprites z index: ${this.fgSprites.z}`);

    this.addDebugText(`background sprites:`);
    this.bgSprites.forEach(spr => this.addDebugSprite(spr), this)

    this.addDebugText(`midground sprites:`);
    this.mgSprites.forEach(spr => this.addDebugSprite(spr), this)

    this.addDebugText(`foreground sprites:`);
    this.fgSprites.forEach(spr => this.addDebugSprite(spr), this)

    this.addDebugText(`held items:`);
    this.heldItem.forEach(spr => this.addDebugSprite(spr), this)

    this.addDebugText(`room items:`);
    this.itemGroup.forEach(spr => this.addDebugSprite(spr), this)

    this.addDebugText(`inventory items:`);
    this.inventory.inventory.forEach(spr =>
        this.addDebugText(`    name: ${spr.name} parent: ${spr.parent.name}`), this)
  }


  /**
   * Add debug text to the debug screen
   * @param {String} text debug text to display
   * @returns next open row
   */
  addDebugText(text: string) {
    this.game.debug.text(text, 5, this.debugPos * 25);

    this.debugPos++
  }


  /**
   * Add sprite debug info
   * @param {Sprite} sprite sprite to print debug
   */
  addDebugSprite(sprite: Phaser.Sprite) {
    this.addDebugText(`   name: ${sprite.name} z: ${sprite.z} visible: ${sprite.visible}`)
  }


  /**
   * Toggle the debug screen
   */
  toggleDebug() {
    this.debugOn = !this.debugOn

    log(`toggling debug ${this.debugOn ? 'on': 'off'}`)

    if (this.debugOn) {
      this.debugGroup.visible = true
      this.doorDebug.visible = true
    } else {
      this.debugGroup.visible = false
      this.doorDebug.visible = false
    }

    this.pathing.displayDebugTiles()
    this.inventory.dispalyDebugSlots()
  }


    /**
     * Show the game end message and return to the main menu
     */
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


  /**
   * Evaulate an event key, queuing any related events and starting event execution
   *
   * @param {String} trigger name of an event
   */
  evalEvent (trigger: string) {
    dlog(trigger + ' has triggered')

    for (let quest of this.quests) {
      let actions = quest.updateQuest(trigger)
      this.queueActions(actions)
    }

    this.popEventQueue()
  }


  /**
   * Add actions to the action queue
   */
  queueActions (actions: Action[]) {
    this.eventQueue = [...this.eventQueue, ...actions]

    dlog(`current event queue: `)
    for (let event of this.eventQueue)
      dlog(event)
  }


  /**
   * Pop next event from the event queue and execute it
   */
  popEventQueue () {
    let event = this.eventQueue.shift()
    if (event)
      this.executeAction(event)
  }


  /**
   * Evaluate a block, executing any related events
   *
   * @param {String} block name of the block
   */
  evalBlock (block: string) {
    dlog(`evaluating block ${block}`)

    let blockEvents = this.events.filter(e => e.trigger == block)

    for (let event of blockEvents) {
      this.queueActions(event.actions)
    }

    this.popEventQueue()
  }


  /**
   * Determine event type then execute it
   *
   * @param {Action} action event object to execute
   */
  executeAction (action: Action) {
    /*
    Concept of `event` is being replaced by `actions`
    */

    dlog(`executing event: ${Object.keys(action)}`)

    switch (action.type) {
      case ActionType.addItem:     return this.addItem(action as AddItemAction)
      case ActionType.altRoom:     return this.altRoom(action as AltRoomAction)
      case ActionType.killBlock:   return this.killBlock(action as KillBlockAction)
      case ActionType.killSprite:  return this.killSprite(action as KillSpriteAction)
      case ActionType.modAttr:     return this.modAttribute(action as ModAttrAction)
      case ActionType.modMeta:     return this.modMeta(action as ModMetaAction)
      case ActionType.modRoomMeta: return this.modRoomMeta(action as ModRoomMetaAction)
      case ActionType.move:        return this.move(action as MoveAction)
      case ActionType.moveSprite:  return this.tweenSprite(action as MoveSpriteAction)
      case ActionType.playAnim:    return this.playAnimation(action as PlayAnimAction)
      case ActionType.putSprite:   return this.putSprite(action as PutSpriteAction)
      case ActionType.quit:        return this.quitGame()
      case ActionType.removeItem:  return this.removeItem(action as RemoveItemAction)
      case ActionType.say:         return this.say(action as SayAction)
      case ActionType.sayAnim:     return this.sayAnim(action as SayAnimAction)
      case ActionType.signal:      return this.evalEvent(action.getType())
      case ActionType.togAnim:     return this.toggleAnimation(action as TogAnimAction)
      case ActionType.turn:        return this.turnPlayer(action as TurnAction)
      case ActionType.wait:        return this.wait(action as WaitAction)
    }
  }

  // Events

  putSprite (action: PutSpriteAction) {
    dlog(`putting ${this.spritesJSON[action.sprite].name}`)
    let sprite = this.getSprite(action.sprite)

    sprite.position = new PIXI.Point(action.x * window.game.scaleFactor, action.y * window.game.scaleFactor);

    dlog(`put sprite to ${sprite.position}`)

    this.evalEvent(`put-${action.sprite}`);
  }

  /**
   * Remove block, e.g. after executing one-time block
   *
   * @param {Sprite} block block to destroy
   */
  killBlock (action: KillBlockAction) {
    let block = action.block

    var blocks = this.blockGroup;
    var blocksMeta = this.currentRoom.blocks;

    var i = blocks.length;
    while (i--) {
        if (blocks[i].name == block) {
            this.blockGroup.splice(i, 1);
        }
    }

    var j = blocksMeta.length;
    while (j--) {
        if (blocksMeta[j].name == block) {
            blocksMeta.splice( j, 1 );
        }
    }
  }


  /**
   * Change sprite frame
   *
   * @param {Sprite} sprite sprite to modify
   * @param {String} frame name of frame to switch to
   */
  setFrame (sprite, frame) {
      dlog('setting frame: ', frame);
      sprite.frameName = frame;
      sprite.alpha = 1;
  }


  // Creation chain


  /**
   * Create sprites for the current room
   */
  createSprites () {
      const roomSprites = this.currentRoom.sprites;

      for (let i = 0 ; i < roomSprites.length ; i++ ) {
          let spriteProperty = this.spritesJSON[roomSprites[i].name];

          if (!spriteProperty) {
            let error = `Sprite for room [${this.currentRoom.name}] not found in cache: `+
            `check if sprite [${roomSprites[i].name}] exists`

            throw new Error(error)
          }

          let newSprite;
          let layer = roomSprites[i].layer || 'background'

          switch (layer) {
          case 'background':
              newSprite = this.bgSprites.create(
                  roomSprites[i].x * window.game.scaleFactor,
                  roomSprites[i].y * window.game.scaleFactor,
                  roomSprites[i].name);
              break
          case 'midground':
              newSprite = this.mgSprites.create(
                  roomSprites[i].x * window.game.scaleFactor,
                  roomSprites[i].y * window.game.scaleFactor,
                  roomSprites[i].name);
              break
          case 'foreground':
              newSprite = this.fgSprites.create(
                  roomSprites[i].x * window.game.scaleFactor,
                  roomSprites[i].y * window.game.scaleFactor,
                  roomSprites[i].name);
              break
          default:
              newSprite = this.bgSprites.create(
                  roomSprites[i].x * window.game.scaleFactor,
                  roomSprites[i].y * window.game.scaleFactor,
                  roomSprites[i].name);
          }

          newSprite.name = roomSprites[i].name

          if (spriteProperty.scale) {
              newSprite.scale.setTo(spriteProperty.scale * window.game.scaleFactor);
          } else {
              newSprite.scale.setTo(window.game.scaleFactor);
          }

          if (spriteProperty.invisible) {
              this.showSprite(newSprite, false);
          }

          if (spriteProperty.reverse) {
              newSprite.anchor.x = 0.5;
              newSprite.scale.x *= -1;
          }

          dlog(`creating sprite ${newSprite.name}
          in layer ${layer} at { ${newSprite.position.x}, ${newSprite.position.y} }
          with scale: ${newSprite.scale}
          h: ${newSprite.height} w: ${newSprite.width}`)

          spriteProperty.animated ? this.createSpriteAnimation(newSprite, spriteProperty):null;
          spriteProperty.action ? this.createSpriteAction(newSprite, spriteProperty):null;
          spriteProperty.startFrame ? this.setFrame(newSprite, spriteProperty.startFrame):null;
      }
  }


  /**
   * Create room blocks
   */
  createBlocks () {
      var block: Block;
      var blocks = this.currentRoom.blocks;

      var i = blocks.length;
      while (i--) {
          block = new Block(this.game, blocks[i].x, blocks[i].y);
          block.position.x *= window.game.scaleFactor
          block.position.y *= window.game.scaleFactor
          block.height = blocks[i].height * window.game.scaleFactor;
          block.width = blocks[i].width * window.game.scaleFactor;
          block.name = blocks[i].name;
          block.inputEnabled = true;
          block.events.onInputDown.add(function (data) {
                  this.evalBlock(data.name);
          }, this);
          this.blockGroup.push(block)

          if (this.debugOn) {
              var blockBg = this.game.make.graphics();
              blockBg.beginFill(0x00ffff, 0.5);
              blockBg.drawRect(
                  blocks[i].x * window.game.scaleFactor,
                  blocks[i].y * window.game.scaleFactor,
                  blocks[i].width * window.game.scaleFactor,
                  blocks[i].height * window.game.scaleFactor);
              blockBg.endFill();
              this.debugGroup.add(blockBg);
          }
      }
  }


  /**
   * Create room entities
   */
  createEntities () {
      if (!this.currentRoom.entities) {
          dlog("room has no entities")
          return
      }

      const entities = {
          'poolDrop': PoolDrop
      }

      const roomEntities = this.currentRoom.entities;
      for (let entityInfo of roomEntities) {
          dlog(`creating entity ${entityInfo['name']}
          in layer ${entityInfo['layer']}
          at { ${entityInfo['startPos'].x}, ${entityInfo['startPos'].y} }`)

          let {name, layer} = entityInfo
          let entityClass = entities[name]
          let entity = new entityClass({game: this.game, ...entityInfo})

          // create animation for entity
          let spriteProperty = this.spritesJSON[entity.animName];
          this.createSpriteAnimation(entity.anim, spriteProperty)

          // assumes the only animation is the 'on' anim for now
          let animation = entity.anim.animations.getAnimation('on')
          animation.onComplete.add(entity.onAnimComplete, entity)

          switch (layer) {
              case 'foreground':
                  this.fgSprites.add(entity)
                  this.fgSprites.add(entity.anim)
                  break
              case 'midground':
                  this.mgSprites.add(entity)
                  this.mgSprites.add(entity.anim)
                  break
              case 'background':
              default:
                  this.bgSprites.add(entity)
                  this.bgSprites.add(entity.anim)
              }
      }
  }


  /**
   * Compile a sprite's animations from sprites.json data
   *
   * @param {Sprite} sprite sprite to create animations for
   * @param {Object} property holds animation properties
   */
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
              let animation = sprite.animations.play(animations[anim].name);

              // hide non-looping animations after playing
              animation.onComplete.add(
                (data) => this.showSprite(sprite, false), this)
          } else {
              this.showSprite(sprite, false)
          }
      }
  }


  /**
   * Add actions to sprite
   *
   * @param {Sprite} sprite sprite to add actions to
   * @param {Object} property hold action properties
   */
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
                  dlog('animation complete');
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
      // TODO have sprite respond to item dragged onto it
      // sprite should have array of drag-actionable items to compare to

      }// if has drag action
  }


  /**
   * Create room sprite
   */
  createRoom () {
      this.room = this.game.add.image(window.game.scaleFactor, window.game.scaleFactor );
      this.room.scale.setTo(window.game.scaleFactor);
      this.room.inputEnabled = true;
  }


  /**
   * Create speech text and room description
   */
  createText () {
      this.speech = this.add.text()
      this.speech.font = 'kyrandia'
      this.speech.fontSize = 6 * window.game.scaleFactor
      this.speech.stroke = '#000000'
      this.speech.strokeThickness = 3
      this.speech.kill()

      this.roomText = this.add.text()
      this.roomText.font = 'kyrandia'
      this.roomText.fontSize = 6 * window.game.scaleFactor
      this.roomText.x = 8 * window.game.scaleFactor
      this.roomText.y = 145 * window.game.scaleFactor
      this.roomText.fill = '#bbbbbb'
  }


  /**
   * Create initial room
   */
  createStartRoom () {
      this.currentRoom = this.roomsJSON[this.startRoom];
      this.room.loadTexture(this.startRoom);
      this.createDoors();
      this.createBlocks();
      this.createItems();
      this.createSprites();
      this.createEntities();
      this.pathing.importGrid(this.currentRoom.name);
      this.checkMusic();
      this.changeRoomText(this.currentRoom.text);
      this.openRoom();
  }


  /**
   * Create GUI
   */
  createGui () {
      this.gui = this.add.image( 0, 0, 'gui');
      this.gui.scale.setTo(window.game.scaleFactor);
  }


  /**
   * Create amulet and animations
   */
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


  /**
   * Create room items
   */
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


  /**
   * Create player and animations
   */
  createPlayer () {

      // Use the first door's entry as the starting position when spawning player
      const startPosition = this.doors[Object.keys(this.doors)[0]].entry

      this.player = this.game.add.sprite(
          startPosition.x * window.game.scaleFactor,
          startPosition.y * window.game.scaleFactor,
          'player',
          'stand-right');
      this.player.name = 'player';

      this.player.animations.add('walk-right', [
      'right-1','right-2','right-3','right-4',
      'right-5','right-6','right-7', 'right-8'
      ], 15, true, false);

      this.player.animations.add('walk-left', [
      'left-1','left-2','left-3','left-4',
      'left-5','left-6','left-7', 'left-7'
      ], 15, true, false);

      this.player.animations.add('walk-up', [
      'up-1','up-2','up-3','up-4',
      'up-5','up-6'
      ], 15, true, false);

      this.player.animations.add('walk-down', [
      'down-1','down-2','down-3','down-4',
      'down-5','down-6'
      ], 15, true, false);

      this.player.animations.add('talk', [
      'talk-1', 'talk-2', 'talk-3', 'talk-4',
      'talk-5', 'talk-6', 'talk-7', 'talk-8',
      'talk-9', 'talk-10', 'talk-11', 'talk-12',
      ], 8, true, false);

      this.player.scale.setTo(window.game.scaleFactor);
      this.player.anchor.x = 0.5;
      this.player.anchor.y = 0.9;
      this.physics.arcade.enableBody(this.player);

      this.mgSprites.add(this.player);
  }


  /**
   * Create input events
   */
  createInputs () {
      //this.input.onTap.add(function () {}, this);
      // this.amulet.events.onInputDown.add(function (pointer) {
      //   dlog('amulet hit');
      // }, this);

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


  /**
   * Create room doors
   */
  createDoors () {
    this.doors = this.currentRoom.doors;
    for (const [doorName, _] of Object.entries(this.doors)) {
      let { x, y, height, width, entry } = this.doors[doorName]

      x *= window.game.scaleFactor
      y *= window.game.scaleFactor
      height *= window.game.scaleFactor
      width *= window.game.scaleFactor

      let door = new Door(this.game, x, y);
      door.height = height;
      door.width = width;
      door.name = this.doors[doorName].name;
      door.inputEnabled = true;
      
      this.doorGroup.add(door);
      this.physics.arcade.enable(door);

      // door cursor
      door.events.onInputOver.add(() => {
        this.game.canvas.style.cursor = "pointer";
      }, this);
      door.events.onInputOut.add(() => {
        this.game.canvas.style.cursor = "default";
      }, this);

      door.events.onInputDown.add(this.moveToDoor, this);

      if (this.debugOn) {
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
    this.mgSprites.forEach((sprite: Phaser.Sprite) => {
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
    })

    this.itemGroup.forEach((item: Phaser.Sprite) => {
        if (this.player.bottom < item.bottom) {
            item.bringToTop()
        } else {
            item.sendToBack()
        }
    })
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
  say (action: SayAction, onComplete = null) {
    let text = action.text
    let key = action.sprite
    let color = action.color

    // include key for event evaluation
    var sprite = key ? this.getSprite(key): this.player
    var textColor = color ? color: "player"

    this.speech.revive()
    this.speech.x = sprite.x
    this.speech.y = sprite.top - 40
    this.speech.text = text
    this.speech.stroke = '#000000'
    this.speech.strokeThickness = 5
    this.speech.fill = colorAtlas[textColor]
    this.speech.name = sprite.key

    if (this.speech.right > 306 * window.game.scaleFactor) {
      this.speech.x -= this.speech.right - (306 * window.game.scaleFactor)
    }

    if (this.speech.top < 40) {
      this.speech.y = 40
    }

    this.speech.events.onKilled.addOnce(function () {
      this.evalEvent(sprite.key);
    }, this);

    var length = text.split(' ').length;
    var timer = this.time.create();
    timer.add(length*400, function () {
      this.speech.kill();

      if (onComplete)
        onComplete()

    }, this);

      timer.start();
  }


  // Change player sprite frame
  turnPlayer (action: TurnAction) {
    let direction = action.direction
    dlog('turning ' + direction);

    if (direction == 'left') {
      this.player.frameName = 'stand-left';
    } else if (direction == 'right') {
      this.player.frameName = 'stand-right';
    }

    this.evalEvent(direction);
  }


  // Delay events
  wait (action: WaitAction) {
    let time = action.duration

    dlog('wait called for ' + time + ' ms');

    var timer;
    timer ? timer.destroy():null;

    timer = this.time.create()
    timer.add(time, function () {
      this.evalEvent(time);
    }, this)
    timer.start();
  }


  // Change sprite animation
  toggleAnimation (action: TogAnimAction) {
    var sprite = action.sprite;
    var animation = action.animName;
    var toggle = action.start;

    this.spritesJSON[sprite].animations[animation].start = toggle;

    this.evalEvent(animation);
  }


  // Modify a sprite's meta information
  modMeta (action: ModMetaAction) {
    var sprite = action.sprite;
    var attr = action.attr;
    var val = action.value;

    this.spritesJSON[sprite][attr] = val;

    this.evalEvent(sprite);
  }


  // Modify a room's meta information
  modRoomMeta (action: ModRoomMetaAction) {
    var room = action.room;
    var attr = action.attr;
    var value = action.value;
    var door = action.door || null;

    if (door) {
      this.roomsJSON[room][attr][door] = value;
    } else {
      this.roomsJSON[room][attr] = value;
    }

    this.evalEvent(room+attr);
  }


  // Modify an object's meta information
  modAttribute (action: ModAttrAction) {
    // much more powerful function to modify sprites, images
    // can find objects within groups
    // this.world.set(child, key, value);
    var key = action.sprite;
    var attr = action.attr;
    var value = action.value;

    this.world.forEach((child: any) => {
        if (child.name == "group" && child.children.length) {
            child.forEach((groupChild: any) => {
                if (groupChild.key == key) {
                    groupChild[attr] = value;
                    this.evalEvent('mod-' + key);
                    return true;
                }
            });
        } else if (child.name != "group") {
            child[attr] = value;
            this.evalEvent('mod-' + key);
            return true;
        }
    });
  }


  // Play sprite animation
  playAnimation (action: PlayAnimAction) {
    var key = action.sprite;
    var animName = action.animName;
    var kill = action.kill || false;
    var hide = action.hide || false;
    var loop = this.spritesJSON[key].animations[animName].loop;

    let sprite = this.getSprite(key);
    if (!sprite)
      throw new Error(`sprite for animation not found: ${key}`)

    this.showSprite(sprite, true);

    sprite.events.onAnimationComplete.addOnce(function () {
      hide ? this.showSprite(sprite, false):null;
      this.evalEvent(animName);
    }, this);

    sprite.animations.play(animName, null, loop, kill);
  }


  // Play animation with simultaneous speech
  sayAnim (action: SayAnimAction) {
    // event called by call to this.say()

    var key = action.sprite;
    var animName = action.animName;
    var kill = action.kill ? action.kill: false;
    var hide = action.hide ? action.hide: false;
    var text = action.text;
    var color = action.color;
    var loop = this.spritesJSON[key].animations[animName].loop;

    let sprite = this.getSprite(key);
    this.showSprite(sprite, true);

    this.say(
      new SayAction('say', { text, sprite: key, color }),
      () => this.showSprite(sprite, !hide));

    if (!loop)
        sprite.events.onAnimationComplete.addOnce(() => this.showSprite(sprite, !hide), this)

    sprite.animations.play(animName, null, loop, kill);
  }


  // Add an item to the room
  addItem (action: AddItemAction) {
    // todo; create item class
    var item = { name: action.item, x: action.x, y: action.y };
    this.currentRoom.items.push(item);
    this.spawnItem(item);

    this.evalEvent(action.item);
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
  altRoom (action: AltRoomAction) {
    let room = action.roomName

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
      this.mgSprites.remove(this.player);
      this.world.addAt(this.player, 1);

      this.bgSprites.removeAll(true)
      this.mgSprites.removeAll(true)
      this.fgSprites.removeAll(true)

      this.createSprites();
      this.world.remove(this.player);
      this.mgSprites.add(this.player);
    }
    dlog('altering ' + this.roomsJSON[room]);

    this.evalEvent('altRoom');
  }


  // Remove sprite by name
  killSprite (action: KillSpriteAction) {
    let spriteName = action.sprite

    // var sprites = this.spritesGroup.children;
    let spritesMeta = this.currentRoom.sprites;

    this.bgSprites.forEach(child => {
      if (child.name == spriteName) { child.destroy() }
    }, this)
    this.mgSprites.forEach(child => {
      if (child.name == spriteName) { child.destroy() }
    }, this)
    this.fgSprites.forEach(child => {
      if (child.name == spriteName) { child.destroy() }
    }, this)

    let j = spritesMeta.length;
    while (j--) {
      if (spritesMeta[j].name == spriteName) {
        spritesMeta.splice( j, 1 );
      }
    }

    this.evalEvent(spriteName);
  }


  // Movement functions


  // Move with intent to change rooms
  moveToDoor (door) {
    let myDoor = this.currentRoom.doors[door.name]

    dlog(`moving to door ${door.name} at { ${myDoor.entry.x}, ${myDoor.entry.y} }`)

    this.stopMoving()
    this.openDoor = myDoor.name
    this.move(
      new MoveAction(
        'move',
        {
          x: myDoor.entry.x * window.game.scaleFactor,
          y: myDoor.entry.y * window.game.scaleFactor
        }
    ))
  }


  // Move player
  move (action: MoveAction) {
    let position = {x: action.x, y: action.y}

    dlog(`move to { ${position.x}, ${position.y} }`)

    let path = this.pathing.findWay(this.player.position, position);
    this.tweenPath(path);
  }


  // Stop player
  stopMoving () {
    dlog('stop movement')

    if (this.tween) {
      this.tween.stop(true);
      this.tweens.remove(this.tween);
    }
  }


  // Check if door will allow travel
  peekInDoor (player, door) {

    if (door.name == this.openDoor) {
      this.openDoor = null;
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
    var anim;

    this.player.alpha = 0;

    // find and play the entrance sprite from the room's this.spritesGroup
    let exitSpriteName = myDoor.animation.exit;
    let exitSprite;

    this.bgSprites.forEach(child => { if (child.key == exitSpriteName) exitSprite = child }, this)
    this.mgSprites.forEach(child => { if (child.key == exitSpriteName) exitSprite = child }, this)
    this.fgSprites.forEach(child => { if (child.key == exitSpriteName) exitSprite = child }, this)

    // remove exit sprite from spritesGroup to prevent preupdate error
    this.bgSprites.remove(exitSprite)
    this.mgSprites.remove(exitSprite)
    this.fgSprites.remove(exitSprite)

    //this.spritesGroup.remove(exitSprite);

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
    var anim;

    let startPoint = {...myDoor.entry}

    // scale starting point coords
    startPoint.x *= window.game.scaleFactor
    startPoint.y *= window.game.scaleFactor

    this.player.alpha = 0;

    // find and play the exiting sprite from the room's this.spritesGroup
    let enterSpriteName = myDoor.animation.enter;
    let enterSprite;

    this.bgSprites.forEach(child => { if (child.key == enterSpriteName) enterSprite = child }, this)
    this.mgSprites.forEach(child => { if (child.key == enterSpriteName) enterSprite = child }, this)
    this.fgSprites.forEach(child => { if (child.key == enterSpriteName) enterSprite = child }, this)

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

    let dist = this.physics.arcade.distanceBetween(this.player.position, entryPoint)/this.pathing.tileSize;

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

    let dist = this.physics.arcade.distanceBetween(this.player.position, offPoint)/this.pathing.tileSize;

    dlog(`tweening out to { ${offPoint.x}, ${offPoint.y} }`);

    this.between = this.game.add.tween(this.player)
    this.between.to(offPoint, dist*this.speed); //todo adjust betweening speed

    this.between.onComplete.addOnce(function () {
      //check for exit animations

      dlog('tween out finished');
      this.loadRoom();

    }, this);

    if (this.tween && this.tween.isRunning) {
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
  tweenSprite (action: MoveSpriteAction) {
    if (action.animName)
      this.playAnimation(
        new PlayAnimAction(
          'playAnim',
          {sprite: action.sprite, animName: action.animName, kill: false,  hide: false}));

    var path = action.path;
    var key = action.sprite;
    var sprite = this.getSprite(key);

    this.tween = this.add.tween(sprite);
    this.tween.onComplete.addOnce(this.tweenComplete, this);

    var prevX = sprite.position.x/this.pathing.tileSize;
    var prevY = sprite.position.y/this.pathing.tileSize;
    var x;
    var y;
    var dist;

    for ( var i = 0; i < path.length ; i++ ) {
      x = path[i][0];
      y = path[i][1];
      dist = this.physics.arcade.distanceBetween({x: x, y: y}, {x: prevX, y: prevY});

      if (i == path.length - 1) {
        this.tween.to( { x: x*this.pathing.tileSize, y: y*this.pathing.tileSize }, dist*this.speed);
      } else if (x == prevX || y == prevY && i%3) {
        // pass
      }  else {
        this.tween.to( { x: x*this.pathing.tileSize, y: y*this.pathing.tileSize }, dist*this.speed);
        prevX = x;
        prevY = y;
      }
    }

    this.tween.start();
  }


  // Move player along path
  tweenPath (path) {
    if (!path) {
      log(`null path, cannot tween path`)
      return
    }

    this.tween = this.add.tween(this.player);
    this.tween.onComplete.addOnce(this.tweenComplete, this);

    var prevX = this.player.position.x/this.pathing.tileSize;
    var prevY = this.player.position.y/this.pathing.tileSize;

    for ( var i = 0; i < path.length ; i++ ) {
      var x = path[i][0];
      var y = path[i][1];
      var dist = this.physics.arcade.distanceBetween({x: x, y: y}, {x: prevX, y: prevY});

      if (i == path.length - 1) {
        this.tween.to( { x: x*this.pathing.tileSize, y: y*this.pathing.tileSize }, dist*this.speed);
      } else if (x == prevX || y == prevY && i%3) {
        // pass
      }  else {
        this.tween.to( { x: x*this.pathing.tileSize, y: y*this.pathing.tileSize }, dist*this.speed);
        prevX = x;
        prevY = y;
      }
    }

    this.tween.start();
  }


  // Prepare a room for entrance
  loadRoom() {
    var nextRoom = this.roomsJSON[this.door];
    dlog('loading room ' + nextRoom.name);

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
    this.pathing.importGrid(this.currentRoom.name);
    this.createDoors();
    this.createBlocks();
    this.createItems();
    this.createSprites();
    this.createEntities();

    // return player sprite to spriteGroup
    this.world.remove(this.player);
    this.mgSprites.add(this.player);

    this.enterRoom();
  }


  // Prepare to leave current room
  closeRoom () {
    dlog('closing room ' + this.currentRoom.name);
    this.saveItems(); // save room state

    // save player sprite
    this.mgSprites.remove(this.player);
    this.world.addAt(this.player, 1);

    for (let b of this.blockGroup) b.destroy()
    this.debugGroup.removeAll(true)
    this.doorGroup.removeAll(true)
    this.doorDebug.removeAll(true)
    this.itemGroup.removeAll(true)
    this.bgSprites.removeAll(true)
    this.mgSprites.removeAll(true)
    this.fgSprites.removeAll(true)
  }


  // Enable input on room after entering
  openRoom () {
    dlog('opening room ' + this.currentRoom.name);

    this.evalEvent(this.currentRoom.name);
    this.enableInput(true);
  }


  // Item and inventory functions


  // Handle dropping an item
  findItemDestination (item) {
    let placed = false;
    let spriteHit = false

    // check if inventory hit
    if (this.inventory.itemDroppedOnInventory(item) && !placed) {
      dlog('item dropped onto inventory')

      let swappedItem = this.inventory.moveItemToInventory(item)
      if (swappedItem) {
        // TODO remove duplicate data entry for currentRoom.items and itemGroup
        this.itemGroup.add(swappedItem)
        this.currentRoom.items.push({
          name: swappedItem.name,
          x: swappedItem.position.x,
          y: swappedItem.position.y
        })
      }

      placed = true;
    } else if (inBounds(item, this.room) && !placed) {
      dlog('item hit room')

      // check for sprites hits -> event call them
      this.bgSprites.forEach(function (sprite) {
        if (inBounds(item, sprite) && sprite.inputEnabled) { this.evalEvent(sprite.key + '-' + item.name) }
      }, this)

      this.mgSprites.forEach(function (sprite) {
        if (inBounds(item, sprite) && sprite.inputEnabled) { this.evalEvent(sprite.key + '-' + item.name) }
      }, this)

      this.fgSprites.forEach(function (sprite) {
        if (sprite.overlap(item)) {
        // if (inBounds(item, sprite)) {
          if (sprite.inputEnabled)
            this.evalEvent(sprite.key + '-' + item.name)

          dlog(`item overlapped foreground sprite`)
          spriteHit = true
        }
      }, this)

      this.blockGroup.forEach(function (block) {
        if (inBounds(item, block) && block.inputEnabled) { this.evalEvent(block.name + '-' + item.name) }
      }, this)

      // place item under cursor if the location is walkable, and no foreground sprites hit
      if (!spriteHit && this.pathing.findWay(this.player.position, {x: item.x, y: item.y })) {
        dlog(`placing ${item.name} into room at { ${item.position.x}, ${item.position.y} }`)
        this.itemGroup.addChild(item)
      } else {
        this.tossItem(item)
      }
    }
  }

  // Toss item into the room
  tossItem (item) {
    item.x = this.player.x
    item.y = this.player.y - 25

    dlog(`tossing ${item.name} into room at { ${item.position.x}, ${item.position.y} }`)
    this.itemGroup.addChild(item)
  }


  // Spawn item into room
  spawnItem (itemData) {
    let { name, x, y } = itemData;

    let item = new Item(
        name, 
        this.game, 
        x * window.game.scaleFactor, 
        y * window.game.scaleFactor);

    item.scale.setTo(0.5 * window.game.scaleFactor);
    item.inputEnabled = true;
    item.input.enableDrag(true, true);

    dlog(`spawn ${item.name} at x: ${item.position.x} y: ${item.position.y}`)

    // check if item was in inventory, if so, remove from slot
    item.events.onDragStart.add((data) => {
      dlog(`${data.name} picked up | parent ${data.parent.name}`);

      this.changeRoomText(`${data.name} picked up`);

      if (data.parent.name == 'inventory') {
        dlog(`${data.name} is from inventory`)
        this.inventory.removeItemFromInventory(data);
      }

      this.heldItem.addChild(data)
    }, this)

    // check drop location
    item.events.onDragStop.add((data) => {

      this.changeRoomText(`${data.name} placed`);
      this.heldItem.removeChild(data)

      this.findItemDestination(data);

      dlog(`${data.name} placed at { ${item.position.x}, ${item.position.y} } in ${item.parent}`)
    }, this);

    this.itemGroup.add(item);
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
    if (!this.playMusic)
      return

    if (this.currentMusic != this.currentRoom.music) {

      this.music ? this.music.fadeOut(): null;
      this.currentMusic = this.currentRoom.music;

      if (this.currentMusic != null) {

        dlog('playing music: '+this.currentMusic);
        this.music = this.game.sound.add(this.currentMusic, 1, true);
        this.music.onDecoded.add(function() {

          this.music.fadeIn();
        }, this);

      }
    }
  }


  toggleMusic() {
    this.playMusic = !this.playMusic

    dlog(`turning music ${this.playMusic ? 'on' : 'off'}`);

    if (this.playMusic) {
      this.checkMusic()

      if (this.music)
        this.music.play()
    } else if (!this.playMusic && this.music) {
      this.music.stop()
    }
  }


  // Change room GUI text
  changeRoomText (string) {
    this.roomText.text = string;
  }


  // Retrieve sprite by key from the cache
  getSprite (key) {
    dlog(`retrieving sprite from the sprite cache: ${key}`)

    let sprites = [
      ...this.bgSprites.children,
      ...this.mgSprites.children,
      ...this.fgSprites.children,
      ...this.itemGroup.children
    ]

    let sprite;

    sprites.forEach(spr => {
      if (spr['name'] == key) {
        sprite = spr
      }
    })

    return sprite
  }


  // Toggle a sprite's alpha
  showSprite (sprite, bool) {
    dlog('show sprite? ' + sprite.name + ':' + bool);
    var alpha = bool ? 1:0;
    sprite.alpha = alpha;
  }
}
