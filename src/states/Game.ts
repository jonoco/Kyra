import 'phaser'
import 'pixi'

import Pathing from '../pathing'
import Item from '../Item';
import Inventory from '../Inventory'
import Debugger from '../Debug'
import Door from '../Door';
import { log, dlog, inBounds, LOG_LEVEL } from '../utils'
import PoolDrop from '../entities/PoolDrop'
import Block from '../Block'
import Room from '../Room';
import {
  Action, ActionType, AddItemAction, AltRoomAction, KillBlockAction,
  KillSpriteAction, ModAttrAction, ModMetaAction, ModRoomMetaAction,
  MoveAction, MoveSpriteAction, PlayAnimAction,
  PutSpriteAction, RemoveItemAction, SayAction, SayAnimAction,
  SignalAction,
  StepCompletionAction,
  TogAnimAction, TurnAction, WaitAction
} from '../Action'
import { Event, parseEvents } from '../Event'
import { parseQuests, Quest } from '../Quest'
import { onDebug, enterRoom } from '../signals'
import Sprite from '../Sprite';

const colorAtlas = {
  "herman" : "#ffcc99",
  "player" : "#eeeeee",
  "brynn" : "#ff9999"
};


export default class Game extends Phaser.State {
  amulet: Phaser.Sprite;
  amuletGroup: Phaser.Group;
  animation: Phaser.Animation;
  between: Phaser.Tween;
  bgSprites: Phaser.Group;
  blockGroup: Phaser.Group;
  currentMusic: string;
  
  /** todo: refactor to use Room object instead of pulling in from JSON */
  currentRoom: RoomData;
  previousRoom: RoomData;
  debugGroup: Phaser.Group;
  debugOn: boolean;
  direction: string;

  /** door being traversed */
  door: Door; 
  doorDebug: Phaser.Group;
  doorGroup: Phaser.Group;
  doors: DoorData[];
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
    
  pathing: Pathing;
  player: Phaser.Sprite;
  playMusic: boolean;
  quests: Quest[];
  room: Room;
  roomsData: RoomData[];
  roomText: Phaser.Text;
  speech: Phaser.Text;
  speed: number;
  spritesJSON: SpriteData[];
  startRoom: string;
  talkingSprite: Phaser.Sprite;
  tween: Phaser.Tween;

  debugger: Debugger;


  init() {
    // this.Quests = new Quests()

    // game debugging
    this.startRoom = 'room08';
    this.playMusic = false

    // event variables
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
    this.doors;
    this.doorGroup;
    this.blockGroup;
    this.debugGroup;
    this.music;
    this.roomText;
    this.currentMusic;
  }


  preload() { }


  create() {
    this.events = parseEvents(this.cache.getJSON('events').events)
    this.quests = parseQuests(this.cache.getJSON('quests').quests)

    this.roomsData = this.cache.getJSON('rooms')['rooms'];
    this.spritesJSON = this.cache.getJSON('sprites')['sprites'];
    this.stage.backgroundColor = '#2d2d2d';
    this.physics.startSystem(Phaser.Physics.ARCADE);

    // display groups layered for correct z depths
    this.room = Room.of(
      this.game, 
      window.app.scaleFactor, 
      window.app.scaleFactor,
      this.roomsData.find(r => r.name == this.startRoom))
    
    this.bgSprites = this.game.add.group(this.world, 'background sprites')
    this.itemGroup = this.game.add.group(this.world, 'item sprites')
    this.mgSprites = this.game.add.group(this.world, 'midground sprites')
    this.fgSprites = this.game.add.group(this.world, 'foreground sprites')
    this.createGui();
    this.inventory = this.game.world.add(new Inventory(this.game));
    this.heldItem = this.game.add.group(this.world, 'held items')

    this.pathing = new Pathing(this)

    this.createText();
    this.createInputs();
    this.doorGroup = this.game.add.group();
    this.doorDebug = this.game.add.group();
    this.blockGroup = this.game.add.group();
    this.debugGroup = this.add.group();
    this.createStartRoom();
    this.createPlayer();

    let key_1 = this.input.keyboard.addKey(Phaser.KeyCode.ONE)
    key_1.onDown.add(this.toggleMusic, this)

    this.debugger = new Debugger(this.game, this);

    this.openRoom();
  }


  update () {
    this.physics.arcade.overlap(this.player, this.doorGroup, this.peekInDoor, null, this);

    if (this.eventQueue.length) {
        this.enableInput(false);
    } else {
        this.enableInput(true);
    }
  }


  render() {
    this.changeSpriteIndex();
    this.changePlayerAnimation();

    this.debugger.display()
  }

  /**
   * Show the game end message and return to the main menu
   */
  quitGame () {
    const blockBg = this.make.graphics();
    blockBg.beginFill(0x000000, 1);
    blockBg.drawRect(0, 0, this.game.width, this.game.height);
    blockBg.endFill();
    blockBg.alpha = 0;

    this.world.add(blockBg);

    const endMessage = this.add.image( 0, 0, 'end');
    endMessage.scale.setTo(window.app.scaleFactor);
    endMessage.alpha = 0;
    endMessage.inputEnabled = true;

    const fade = this.game.add.tween(blockBg);
    fade.to({ alpha: 1 }, 2000);
    fade.start();

    const message = this.game.add.tween(endMessage);
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
    dlog(`${trigger} has triggered`)

    for (let event of this.events.filter(e => e.trigger == trigger)) {
      this.queueActions(event.actions)
    }
    
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
   * Determine event type then execute it
   *
   * @param {Action} action event object to execute
   */
  executeAction (action: Action) {
    /*
    Concept of `event` is being replaced by `actions`
    */

    dlog(`executing event: ${action.getType()}`)

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
      case ActionType.signal:      return this.evalEvent((action as SignalAction).signal)
      case ActionType.stepCompletion: return this.completeStep(action as StepCompletionAction)
      case ActionType.togAnim:     return this.toggleAnimation(action as TogAnimAction)
      case ActionType.turn:        return this.turnPlayer(action as TurnAction)
      case ActionType.wait:        return this.wait(action as WaitAction)
    }
  }

  // Events

  completeStep(action: StepCompletionAction) {
    log(`completing step ${action.step.step}`, LOG_LEVEL.DEBUG)

    if (action.step.complete)
      log(`quest step already complete`, LOG_LEVEL.WARN)

    action.step.complete = true

    this.evalEvent(`step-${action.step.step}`)
  }

  /**
   * Spawn a new sprite
   */
  putSprite (action: PutSpriteAction) {
    dlog(`put sprite ${action.sprite} to [${action.x}, ${action.y}]`)

    let spriteData = this.spritesJSON.find(s => s.name == action.sprite)
    this.createSprite(spriteData, action.x, action.y, action.layer)    

    this.evalEvent(`put-${action.sprite}`);
  }

  /**
   * Remove block, e.g. after executing one-time block
   */
  killBlock (action: KillBlockAction) {
    let blockName = action.block

    let block: Block = this.blockGroup.getByName(blockName);
    block.destroy();
    
    let j = this.currentRoom.blocks.length;
    while (j--) {
        if (this.currentRoom.blocks[j].name == blockName) {
          this.currentRoom.blocks.splice(j, 1);
        }
    }
  }


  /**
   * Change sprite frame
   *
   * @param {Sprite} sprite sprite to modify
   * @param {String} frame name of frame to switch to
   */
  setFrame (sprite: Sprite, frame: string) {
      log(`setting frame: ${frame}`, LOG_LEVEL.INFO);

      sprite.frameName = frame;
      sprite.alpha = 1;
  }


  // Creation chain


  /**
   * Create sprites for the current room
   */
  createSprites () {
    const roomSprites = this.currentRoom.sprites;

    for (let roomSprite of roomSprites) {
      let { x, y, layer } = roomSprite;
      let spriteData = this.spritesJSON.find(s => s.name == roomSprite.name)
      if (!spriteData) {
        let error = `Sprite for room [${this.currentRoom.name}] not found in cache: `+
        `check if sprite [${roomSprite.name}] exists`
        
        throw new Error(error)
      }
      this.createSprite(spriteData, x, y, layer)
    }
  }


  // /** Create sprite */
  createSprite(spriteData: SpriteData, x: number, y: number, layer: Layer) {
    const { name, invisible, reverse, animated, action, startFrame 
    } = spriteData;

    let newSprite = Sprite.of(this.game, x, y, name, invisible, reverse);

    switch (layer) {
    case 'background':
        this.bgSprites.add(newSprite);
        break
    case 'midground':
        this.mgSprites.add(newSprite);
        break
    case 'foreground':
        this.fgSprites.add(newSprite);
        break
    default:
        this.bgSprites.add(newSprite);
    }

    dlog(`creating sprite ${newSprite.name}
    in layer ${layer} at { ${newSprite.position.x}, ${newSprite.position.y} }
    with scale: ${newSprite.scale}
    h: ${newSprite.height} w: ${newSprite.width},
    visible: ${invisible ? 'invisible' : 'visible'},
    reversed: ${reverse ? 'reversed' : 'normal'}`)

    if (animated) this.createSpriteAnimation(newSprite, spriteData);
    if (action) this.createSpriteAction(newSprite, spriteData);
    if (startFrame) this.setFrame(newSprite, spriteData.startFrame);

    return newSprite;
  }


  /**
   * Create room blocks
   */
  createBlocks () {
    for (let blockData of this.currentRoom.blocks) {
      dlog(`creating block ${blockData.name}`)

      let block = Block.of(
        this.game, blockData.x, blockData.y, blockData.name, blockData.height, blockData.width);

      block.events.onInputDown.add((b: Block) => {
        dlog(`clicked block ${b.name}`)
        this.stopMoving();
        this.evalEvent(b.name);
      }, this);
      
      this.blockGroup.add(block)
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
          let spriteProperty = this.spritesJSON.find(s => s.name == entity.animName);
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
  createSpriteAnimation (sprite: Sprite, property: SpriteData) {
    log(`create animation ${property.name} for sprite ${sprite.name}`, LOG_LEVEL.DEBUG)
  
    let animations = property.animations;

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
  createSpriteAction (sprite: Sprite, property: SpriteData) {
    log(`create sprite action ${property.name} for ${sprite.name}`, LOG_LEVEL.DEBUG)
      let action = property.action;

      sprite.inputEnabled = true;
      if (action.click) {
        sprite.events.onInputDown.add(function (data) {
          this.evalEvent(sprite.key);

          if (action.click.text) {

            sprite.alpha = 1;
            this.animation = sprite.animations.play(action.click.text, null, false, true);
            this.animation.onComplete.add(function (data) {
                dlog('animation complete');
                this.evalEvent(action.click.text);
            }, this);
          }// if has animation on click

          if (action.click.text) {
            //say something
            this.say(action.click.text);
          }// if has text on click

        }, this);
      }// if has click action

      // if (action.drag) {
      // TODO have sprite respond to item dragged onto it
      // sprite should have array of drag-actionable items to compare to

      // }// if has drag action
  }


  /**
   * Create speech text and room description
   */
  createText () {
      this.speech = this.add.text()
      this.speech.font = 'kyrandia'
      this.speech.fontSize = 6 * window.app.scaleFactor
      this.speech.stroke = '#000000'
      this.speech.strokeThickness = 3
      this.speech.kill()

      this.roomText = this.add.text()
      this.roomText.font = 'kyrandia'
      this.roomText.fontSize = 6 * window.app.scaleFactor
      this.roomText.x = 8 * window.app.scaleFactor
      this.roomText.y = 145 * window.app.scaleFactor
      this.roomText.fill = '#bbbbbb'
  }


  /**
   * Create initial room
   */
  createStartRoom () {
      this.currentRoom = this.roomsData.find(r => r.name == this.startRoom);
      this.room.loadTexture(this.currentRoom.path);
      this.createDoors();
      this.createBlocks();
      this.createItems();
      this.createSprites();
      this.createEntities();
      this.pathing.importGrid(this.currentRoom.grid);
      this.checkMusic();
      this.changeRoomText(this.currentRoom.text);
  }


  /**
   * Create GUI
   */
  createGui () {
      this.gui = this.add.image( 0, 0, 'gui');
      this.gui.scale.setTo(window.app.scaleFactor);
  }


  /**
   * Create amulet and animations
   */
  createAmulet () {
      this.amulet = this.add.sprite( 224 * window.app.scaleFactor, 152 * window.app.scaleFactor, 'amulet');
      this.amulet.inputEnabled = true;
      this.amulet.scale.setTo(window.app.scaleFactor);
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
    const spriteData = this.spritesJSON.find(s => s.name == 'player')
    
    this.player = this.createSprite(spriteData, startPosition.x, startPosition.y, 'midground')
    this.player.anchor.x = 0.5;
    this.player.anchor.y = 0.9;
    this.physics.arcade.enableBody(this.player);
  }


  /**
   * Create input events
   */
  createInputs () {
    this.room.events.onInputDown.add(pointer => {
      if (this.speech.alive) {
        this.speech.kill();
        return null;
      }

      this.closeDoor();
      this.stopMoving();
      
      let { x, y } = this.game.input.position;
      this.move(
        new MoveAction(
          'move', 
          { x: x / window.app.scaleFactor, y: y / window.app.scaleFactor }))
    }, this);
  }


  /**
   * Create room doors
   */
  createDoors () {
    this.doors = this.currentRoom.doors;

    const doors = Door.parseDoors(this.game, this.currentRoom.doors as DoorData[]);

    for (const door of doors) {
      let { x, y, height, width, entry, offPoint, animation } = door;
      this.doorGroup.add(door);
      this.physics.arcade.enable(door);

      door.events.onInputDown.add(this.moveToDoor, this);
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
  say (action: SayAction, onComplete: () => void = null) {
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
    this.speech.name = key

    if (this.speech.right > 306 * window.app.scaleFactor) {
      this.speech.x -= this.speech.right - (306 * window.app.scaleFactor)
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

    this.spritesJSON.find(s => s.name == sprite).animations[animation].start = toggle;

    this.evalEvent(animation);
  }


  // Modify a sprite's meta information
  modMeta (action: ModMetaAction) {
    var sprite = action.sprite;
    var attr = action.attr;
    var val = action.value;

    let spriteData = this.spritesJSON.find(s => s.name == sprite)
    spriteData[attr] = val;

    this.evalEvent(sprite);
  }


  // Modify a room's meta information
  modRoomMeta (action: ModRoomMetaAction) {
    var room = action.room;
    var attr = action.attr;
    var value = action.value;
    var door = action.door || null;

    let roomData = this.roomsData.find(r => r.name == room)
    if (door) {
      roomData[attr][door] = value;
    } else {
      roomData[attr] = value;
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

    let sprite = this.getSprite(key);
    sprite[attr] = value
    this.evalEvent('mod-' + key);
  }


  // Play sprite animation
  playAnimation (action: PlayAnimAction) {
    log(`play anim ${action.animName} for sprite ${action.sprite}`)

    var key = action.sprite;
    var animName = action.animName;
    var kill = action.kill || false;
    var hide = action.hide || false;
    var loop = this.spritesJSON.find(s => s.name == key).animations[animName].loop;

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
    dlog(`sayAnim: ${action.sprite} anim: ${action.animName}`)

    var key = action.sprite;
    var animName = action.animName;
    var kill = action.kill ? action.kill: false;
    var hide = action.hide ? action.hide: false;
    var text = action.text;
    var color = action.color;
    var loop = this.spritesJSON.find(s => s.name == key).animations[animName].loop;

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
  removeItem (action: RemoveItemAction) {
    dlog(`removing item ${action.item}`)
    
    let itemName = action.item
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

    this.evalEvent('remove-' + itemName)
  }


  // Change room to alternate version
  altRoom (action: AltRoomAction) {
    let { roomName } = action;

    dlog(`altering ${roomName}`);

    let room = this.roomsData.find(r => r.name == roomName);
    if (!room.alt)
      throw Error(`Attempting to alter room, ${roomName} has no alternate`)

    room.alt.active = true;

    let { text, music, items, sprites, blocks, entities, grid, path, doors } = room.alt;

    room.text = text || room.text;
    room.music = music || room.music;
    room.items = items || room.items;
    room.sprites = sprites || room.sprites;
    room.blocks = blocks || room.blocks;
    room.entities = entities || room.entities;
    room.grid = grid || room.grid;
    room.path = path || room.path;
    room.doors = doors || room.doors;

    this.closeRoom()
    this.loadRoomAssets(this.currentRoom)
    
    this.evalEvent(`alt-${roomName}`);
  }


  // Remove sprite by name
  killSprite (action: KillSpriteAction) {
    let spriteName = action.sprite

    let sprite = this.getSprite(spriteName);
    sprite.destroy();

    this.evalEvent(`kill-${spriteName}`);
  }


  // Movement functions


  // Move with intent to change rooms
  moveToDoor (door: Door) {
    dlog(`moving to door ${door.name} at { ${door.entry.x}, ${door.entry.y} }`)

    this.stopMoving()
    this.closeDoor();
    
    door.open = true;
    
    this.move(
      new MoveAction(
        'move',
        {
          x: door.entry.x,
          y: door.entry.y
        }
    ))
  }


  /** Move player to scaled position */ 
  move (action: MoveAction) {
    let position = {x: action.x, y: action.y}

    dlog(`move to { ${position.x}, ${position.y} }`)

    let path = this.pathing.findWay(this.player.position, position);
    
    if (!path) {
      dlog(`no path found to travel`)
      this.tweenComplete();
    } else {
      this.tweenPath(path);
    }
  }


  // Stop player
  stopMoving () {
    dlog('stop movement')

    if (this.tween) {
      this.tween.stop(true);
      this.tweens.remove(this.tween);
    }
  }


  /** Check if door will allow travel */
  peekInDoor (door: Door) {
    if (door.open) {
      this.closeDoor()
      
      this.door = door;

      this.exitRoom();
    }
  }


  /** Close all doors */ 
  closeDoor () {
    this.doorGroup.forEach(d => d.open = false)
  }


  /** Transfer out of current rooms via current selected door */
  exitRoom () {
    // let myDoor = this.currentRoom.doors[this.door.name];
    this.previousRoom = this.currentRoom;

    this.enableInput(false);

    // use exit animation if present
    if (this.door.animation && this.door.animation.exit) {
      this.exitRoomAnimation();
    } else if (this.door.offPoint) {
      this.tweenOut();
    }
  }


  // Transfer into room by currently selected door
  enterRoom () {
    enterRoom.dispatch();

    let myDoor = this.currentRoom.doors.find(d => d.name == this.previousRoom.name);

    // check for enter animation
    if (myDoor.animation) {
      this.enterRoomAnimation();
    } else {
       //move player into position for ontweening
      let startPoint = { ... myDoor.offPoint }

      // scale starting point coords
      startPoint.x *= window.app.scaleFactor
      startPoint.y *= window.app.scaleFactor

      dlog(`entering ${myDoor.name} at { ${startPoint.x}, ${startPoint.y} }`)

      this.player.alpha = 1;
      this.player.position.x = startPoint.x;
      this.player.position.y = startPoint.y;
      this.tweenIn(myDoor);

    }
  }


  // Run exiting animation
  exitRoomAnimation () {
    var myDoor = this.currentRoom.doors.find(d => d.name == this.door.name);
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
    var myDoor = this.currentRoom.doors.find(d => d.name == this.previousRoom.name);
    var anim;

    let startPoint = {...myDoor.entry}

    // scale starting point coords
    startPoint.x *= window.app.scaleFactor
    startPoint.y *= window.app.scaleFactor

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
  tweenIn (door: DoorData) {

    let entryPoint = {...door.entry}

    // scale entry point coord
    entryPoint.x *= window.app.scaleFactor
    entryPoint.y *= window.app.scaleFactor

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

    let offPoint = this.door.offPoint;

    // let offPoint = {...this.currentRoom.doors[this.door.name].offPoint}

    // scale off point coord
    offPoint.x *= window.app.scaleFactor
    offPoint.y *= window.app.scaleFactor

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
  tweenPath (path: [[number, number]]) {
    if (!path) {
      log(`null path, cannot tween path`, LOG_LEVEL.ERROR)
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
    let nextRoom = this.roomsData.find(r => r.name == this.door.name);
    log(`loading room ${nextRoom.name}`, LOG_LEVEL.DEBUG);

    this.closeRoom();

    this.currentRoom = nextRoom;
    
    this.loadRoomAssets(this.currentRoom);

    this.enterRoom();
  }


  loadRoomAssets(room: RoomData) {
    this.room.loadTexture(room.path);
    this.changeRoomText(room.text);
    this.checkMusic();
    this.pathing.importGrid(room.grid);
    this.createDoors();
    this.createBlocks();
    this.createItems();
    this.createSprites();
    this.createEntities();  

    // return player sprite to spriteGroup
    this.world.remove(this.player);
    this.mgSprites.add(this.player);
  }


  // Prepare to leave current room
  closeRoom () {
    log(`closing room ${this.currentRoom.name}`, LOG_LEVEL.DEBUG);
    this.saveItems(); // save room state

    // save player sprite
    this.mgSprites.remove(this.player);
    this.world.addAt(this.player, 1);

    this.blockGroup.removeAll(true)
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
    log('opening room ' + this.currentRoom.name, LOG_LEVEL.DEBUG);

    this.evalEvent(this.currentRoom.name);
    this.enableInput(true);
  }


  // Item and inventory functions


  // Handle dropping an item
  findItemDestination (item: Item) {
    let spriteHit = false

    // check if inventory hit
    const slot = this.inventory.getSlotOverlappingItem(item);
    if (slot) {
      log(`item dropped onto inventory slot ${slot.name}`)

      const swappedItem = this.inventory.moveItemToInventory(item, slot);
      if (swappedItem) {
        // TODO remove duplicate data entry for currentRoom.items and itemGroup
        this.itemGroup.add(swappedItem)
        this.currentRoom.items.push({
          name: swappedItem.name,
          x: swappedItem.position.x,
          y: swappedItem.position.y
        })
      }
    } else if (inBounds(item, this.room)) {
      log('item hit room', LOG_LEVEL.DEBUG)

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

          log(`item overlapped foreground sprite`, LOG_LEVEL.DEBUG)
          spriteHit = true
        }
      }, this)

      this.blockGroup.forEach(function (block) {
        if (inBounds(item, block) && block.inputEnabled) { this.evalEvent(block.name + '-' + item.name) }
      }, this)

      // place item under cursor if the location is walkable, and no foreground sprites hit
      if (!spriteHit && this.pathing.findWay(this.player.position, {x: item.x, y: item.y })) {
        log(`placing ${item.name} into room at { ${item.position.x}, ${item.position.y} }`, LOG_LEVEL.INFO)
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

    log(`tossing ${item.name} into room at { ${item.position.x}, ${item.position.y} }`, LOG_LEVEL.INFO)
    this.itemGroup.addChild(item)
  }


  // Spawn item into room
  spawnItem (itemData: ItemData) {
    let { name, x, y } = itemData;

    let item = new Item(
      this.game, 
      name, 
      x * window.app.scaleFactor, 
      y * window.app.scaleFactor);

    item.scale.setTo(0.5 * window.app.scaleFactor);
    item.inputEnabled = true;
    item.input.enableDrag(true, true);

    log(`spawn ${item.name} at x: ${item.position.x} y: ${item.position.y}`)

    // check if item was in inventory, if so, remove from slot
    item.events.onDragStart.add((draggedItem: Item) => {
      log(`${draggedItem.name} picked up | parent ${draggedItem.parent.name}`);

      this.changeRoomText(`${draggedItem.name} picked up`);

      if (draggedItem.parent.name == 'inventory') {
        log(`${draggedItem.name} is from inventory`, LOG_LEVEL.DEBUG)
        this.inventory.removeItemFromInventory(draggedItem);
      }

      this.heldItem.addChild(draggedItem)
    }, this)

    // check drop location
    item.events.onDragStop.add((draggedItem: Item) => {

      this.changeRoomText(`${draggedItem.name} placed`);
      this.heldItem.removeChild(draggedItem)

      this.findItemDestination(draggedItem);

      log(`${draggedItem.name} placed at { ${item.position.x}, ${item.position.y} } in ${item.parent.name}`)
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
          log('saving ' + item.name + ' location', LOG_LEVEL.DEBUG);
          this.currentRoom.items[i].x = item.x / window.app.scaleFactor
          this.currentRoom.items[i].y = item.y / window.app.scaleFactor
          break;
        }
      }
    }, this);
  }


  // Toggle player input
  enableInput (bool: boolean) {
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

        log('playing music: '+this.currentMusic, LOG_LEVEL.INFO);
        this.music = this.game.sound.add(this.currentMusic, 1, true);
        this.music.onDecoded.add(function() {

          this.music.fadeIn();
        }, this);

      }
    }
  }


  toggleMusic() {
    this.playMusic = !this.playMusic

    log(`turning music ${this.playMusic ? 'on' : 'off'}`, LOG_LEVEL.DEBUG);

    if (this.playMusic) {
      this.checkMusic()

      if (this.music)
        this.music.play()
    } else if (!this.playMusic && this.music) {
      this.music.stop()
    }
  }


  // Change room GUI text
  changeRoomText (text: string) {
    this.roomText.text = text;
  }


  /** Retrieve active sprite by key from the scene */
  getSprite (key: string) {
    log(`get sprite from the scene: ${key}`, LOG_LEVEL.DEBUG)

    let sprites = [
      ...this.bgSprites.children,
      ...this.mgSprites.children,
      ...this.fgSprites.children,
      ...this.itemGroup.children
    ]

    let sprite: Sprite;

    sprites.forEach(spr => {
      if (spr['name'] == key) {
        sprite = spr as Sprite
      }
    })

    return sprite
  }


  // Toggle a sprite's alpha
  showSprite (sprite: Sprite, show: boolean) {
    log(`show sprite ${sprite.name} = ${show}`, LOG_LEVEL.DEBUG);
    let alpha = show ? 1:0;
    sprite.alpha = alpha;
  }
}
