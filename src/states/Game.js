import Phaser from 'phaser'
import PF from 'pathfinding'

import Pathing from '../pathing'
import lang from '../lang'
import events from '../events'
import Quests from '../quests'
import itemAtlas from '../items'
import Inventory from '../inventory'
import { log, dlog, inBounds, moveToCenter } from '../utils'
import PoolDrop from '../entities/PoolDrop'

export default class extends Phaser.State {
    static debugPos = 1

    init() {
        this.Quests = new Quests()

        // game debugging
        this.startRoom = 'room09';
        this.debugOn = __DEBUG__ || false
        this.playMusic = false

        // utility variables
        this.timer;

        // event variables
        this.quests;
        this.eventTriggers;
        this.eventQueue = [];
        this.blockEvents = events

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
        this.colorAtlas = {
            "herman" : "#ffcc99",
            "player" : "#eeeeee",
            "brynn" : "#ff9999"
        };

        this.itemAtlas = itemAtlas
        this.inventory;
        this.itemGroup;   // all items on the floor of the room

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
        this.debugGroup;
        this.music;
        this.roomText;
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
        this.blockGroup = this.add.group();
        this.debugGroup = this.add.group();;
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
    addDebugText(text, pos) {
        this.game.debug.text(text, 5, this.debugPos * 25);

        this.debugPos++
    }


    /**
     * Add sprite debug info
     * @param {Sprite} sprite sprite to print debug 
     */
    addDebugSprite(sprite, pos) {
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
     * @param {String} eventKey name of an event
     */
    evalEvent (eventKey) {
        dlog(eventKey + ' has triggered')

        // check whether event is linked to quest event
        if (this.eventTriggers[eventKey]) {
            dlog('there is a quest linked to this event')
            var i = this.eventTriggers[eventKey].length
            while (i--) {
                const events = this.Quests.updateQuest(this.eventTriggers[eventKey][i])
                if (events) {
                  this.queueEvents(events)
                }
            }
        }

        this.popEventQueue()
    }


    /**
     * Add events to the event queue
     * 
     * @param {Event[] | Event} events events to add to queue
     */
    queueEvents (events) {
      this.eventQueue = [...this.eventQueue, ...events]
      
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
        this.exeEvent(event)
    }


    /**
     * Evaluate a block, executing any related events
     * 
     * @param {String} block name of the block
     */
    evalBlock (block) {
        dlog(`evaluating block ${block}`)

        let events = this.blockEvents[block]

        if (events) {
            this.queueEvents(events.slice())
            this.popEventQueue()
        }
    }


    /**
     * Determine event type then execute it
     * 
     * @param {Event} event event object to execute
     */
    exeEvent (event) {
      dlog(`executing event: ${Object.keys(event)}`)

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
        event.putSprite   ? this.putSprite(event.putSprite) : null;
    }


  // Events

    putSprite (data) {
      dlog(`putting ${this.spritesJSON[data.sprite].name}`)
      let sprite = this.getSprite(data.sprite)

      sprite.position = new PIXI.Point(data.x * window.game.scaleFactor, data.y * window.game.scaleFactor);

      dlog(`put sprite to ${sprite.position}`)

      this.evalEvent(`put-${data.sprite}`);
    }

    /**
     * Remove block, e.g. after executing one-time block
     * 
     * @param {Sprite} block block to destroy
     */
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
                throw new Error(`Sprite for room [${this.currentRoom.name}] not found in cache: check if sprite [${roomSprites[i].name}] exists`)
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
            dlog('creating entity ' + entityInfo['name'])

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

        this.player = this.game.add.sprite(startPosition.x * window.game.scaleFactor, startPosition.y * window.game.scaleFactor, 'player', 'stand-right');
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
        this.player.anchor = {x:0.5, y:0.9};
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
    for (let i = 0 ; i < this.mgSprites.length ; i++) {
      let sprite = this.mgSprites.children[i];

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
  say (string, key, color, onComplete) {

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
      
      if (onComplete)
        onComplete()
    },this);
    timer.start();
  }


  // Change player sprite frame
  turnPlayer (direction) {
    dlog('turning ' + direction);

    if (direction == 'left') {
      this.player.frameName = 'stand-left';
    } else if (direction == 'right') {
      this.player.frameName = 'stand-right';
    }

    this.evalEvent(direction);
  }


  // Delay events
  wait (time) {
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
    this.say(text, key, color, () => this.showSprite(sprite, !hide));

    if (!loop)
        sprite.events.onAnimationComplete.addOnce(() => this.showSprite(sprite, !hide), this)

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
      this.mgSprites.remove(this.player);
      this.world.addAt(this.player, 1);

      this.bgSprites.removeAll(true)
      this.mgSprites.removeAll(true)
      this.fgSprites.removeAll(true)

      this.createSprites();
      this.world.remove(this.player);
      this.mgSprites.add(this.player);
    }
    dlog('altering ' + this.roomsJSON[myRoom]);

    this.evalEvent('altRoom');
  }


  // Remove sprite by name
  killSprite (spriteName) {
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
    this.move({
      x: myDoor.entry.x * window.game.scaleFactor,
      y: myDoor.entry.y * window.game.scaleFactor
    })
  }


  // Move player
  move (position) {
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
  tweenSprite (data) {

    if (data.animation)
      this.playAnimation(data);

    var path = data.path;
    var key = data.sprite;
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
    var item = this.game.make.image(itemData.x * window.game.scaleFactor, itemData.y * window.game.scaleFactor, 'items');
    item.name = itemData.name;
    var frame = this.itemAtlas[item.name];
    item.frame = frame;
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
