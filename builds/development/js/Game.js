
BasicGame.Game = function (game) {

  this.game;      //  a reference to the currently running game (Phaser.Game)
  this.add;       //  used to add sprites, text, groups, etc (Phaser.GameObjectFactory)
  this.camera;    //  a reference to the game camera (Phaser.Camera)
  this.cache;     //  the game cache (Phaser.Cache)
  this.input;     //  the global input manager. (Phaser.Input)
  this.load;      //  for preloading assets (Phaser.Loader)
  this.math;      //  lots of useful common math operations (Phaser.Math)
  this.sound;     //  the sound manager (Phaser.SoundManager)
  this.stage;     //  the game stage (Phaser.Stage)
  this.time;      //  the clock (Phaser.Time)
  this.tweens;    //  the tween manager (Phaser.TweenManager)
  this.state;     //  the state manager (Phaser.StateManager)
  this.world;     //  the game world (Phaser.World)
  this.particles; //  the particle manager (Phaser.Particles)
  this.physics;   //  the physics manager (Phaser.Physics)
  this.rnd;       //  the repeatable random number generator (Phaser.RandomDataGenerator)

  //  You can use any of these from any function within this State.
  //  But do consider them as being 'reserved words', i.e. don't create a property for 
  //  your own game called "world" or you'll over-write the world reference.

  
  /*  Z indices
    room = 0 
    spriteGroup = 1
    text = 3
    gui = 2
    itemGroup = 4
    slotsGroup = 6
  */

  // game debugging
  this.debug = false;

  // signals
  this.questAlert;
  this.quests;

  // tilemap variables
  this.tileSize = 8;
  this.tileX = 120;
  this.tileY = 75;
  this.map = null;
  this.layer = null;

  // grid variables
  this.grid;
  this.finder;
  this.path;

  // sprite variabels
  this.sprites = null;
  this.spritesGroup = null;
  this.player = null;
  this.tween = null;
  this.between = null;
  this.speed = 40; // lower is faster tweening
  this.direction = null;
  this.speech;

  // inventory variables
  this.slots = [ 
    {x:286, y:482, height: 46, width: 44, name: null, item: null, occupied: false},
    {x:346, y:482, height: 46, width: 44, name: null, item: null, occupied: false},
    {x:406, y:482, height: 46, width: 44, name: null, item: null, occupied: false},
    {x:466, y:482, height: 46, width: 44, name: null, item: null, occupied: false},
    {x:526, y:482, height: 46, width: 44, name: null, item: null, occupied: false},
    {x:286, y:545, height: 46, width: 44, name: null, item: null, occupied: false},
    {x:346, y:545, height: 46, width: 44, name: null, item: null, occupied: false},
    {x:406, y:545, height: 46, width: 44, name: null, item: null, occupied: false}, 
    {x:466, y:545, height: 46, width: 44, name: null, item: null, occupied: false}, 
    {x:526, y:545, height: 46, width: 44, name: null, item: null, occupied: false} 
  ];
  this.itemAtlas = {
    garnet        : 0,
    amythyst      : 1,
    aquamarine    : 2,
    diamond       : 3,
    emerald       : 4,
    opal          : 5,
    ruby          : 6,
    peridot       : 7,
    sapphire      : 8,
    prismarine    : 9,
    topaz         : 10,
    coal          : 11,
    sunstone      : 12,
    moonstone     : 13,
    rainbowstone  : 14,
    lodestone     : 15,
    rose          : 16,
    tulip         : 17,
    orchid        : 18,
    magic_rose    : 19,
    horse         : 20,
    silver_coin   : 21,
    gold_coin     : 22,
    ring          : 23,
    chalice       : 24,
    pinecone      : 25,
    acorn         : 26,
    walnut        : 27,
    fireberry1    : 28,
    fireberry2    : 29,
    fireberry3    : 30,
    fireberry4    : 31,
    fireberry5    : 32,
    fireberry6    : 33,
    fish          : 34,
    fishbone      : 35,
    meat          : 36,
    bone          : 37,
    apple         : 38,
    apple_core    : 39,
    blueberry     : 40,
    mushroom      : 41,
    note          : 42,
    marble        : 43,
    saw           : 44,
    figure        : 45,
    feather       : 46,
    item48        : 47,
    shell         : 48,
    clover        : 49,
    star          : 50,
    fountainorb   : 51,
    tear          : 52,
    mirror        : 53,
    dish          : 54,
    flute         : 55,
    hourglass     : 56,
    iron_key      : 57,
    green_key     : 58,
    blue_key      : 59,
    red_potion    : 60,
    red_flask     : 61,
    blue_potion   : 62,
    blue_flask    : 63,
    yellow_potion : 64,
    yellow_flask  : 65,
    green_flask   : 66,
    orange_flask  : 67,
    purple_flask  : 68,
    rainbow_flask : 69,
    water_potion  : 70,
    water_flask   : 71,
    water_potion  : 72,
    water_flask   : 73,
    water_potion  : 74,
    water_flask   : 75,
    water_potion  : 76,
    water_flask   : 77,
    potion        : 78,
    flask         : 79,
    scroll        : 80
  }; // TODO load atlas from item-atlas.json
  this.inventory;
  this.slotsGroup;
  this.itemGroup;

  // room variables
  this.room;
  this.rooms;
  this.currentRoom;
  this.door;
  this.doors;
  this.doorGroup;
  this.music;
  this.text;
  this.currentMusic;
  this.openDoor = null; // checks if last click was on a door > reset on move complete

};

BasicGame.Game.prototype = {

  create: function () {

    this.rooms = this.cache.getJSON('rooms');
    this.sprites = this.cache.getJSON('sprites');
    this.stage.backgroundColor = '#2d2d2d';
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.createQuests();
    
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
    this.createPlayer();

    this.createStartRoom();

    //console.log(this.spritesGroup.children[0].height);
  },

  update: function () {

    this.game.debug.text('Open door: ' + this.openDoor, 16, 475);
    this.game.debug.text('Player position: ' + this.player.x +', '+ this.player.y, 16, 500);
    this.game.debug.text('Pointer position: ' + this.game.input.position.x + ', ' + this.game.input.position.y, 16, 525);
    
    //this.game.debug.soundInfo(this.music, 286, 475);
    this.game.debug.text('Text z index: ' + this.text.z, 276, 450);
    this.game.debug.text('Player z index: ' + this.player.z, 276, 475);
    this.game.debug.text('GUI z index: ' + this.gui.z, 276, 500);
    this.game.debug.text('room z index: ' + this.room.z, 276, 525);
    this.game.debug.text('itemGroup z index: ' + this.itemGroup.z, 276, 550);
    this.game.debug.text('spritesGroup z index: ' + this.spritesGroup.z, 276, 575);
    this.game.debug.text('slotsGroup z index: ' + this.slotsGroup.z, 276, 600);

    if (this.openDoor) {

      this.physics.arcade.overlap(this.player, this.doorGroup, this.peekInDoor, null, this);
    } 
  },

  render: function () {
    
    this.changeSpriteIndex();
    this.changePlayerAnimation();
  },

  quitGame: function (pointer) {

    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');
  },

  createQuests: function () {

    this.quests = {
      willow: {
        active: false,
        complete: false,
        tear: false,
        treehealed: false,
        events : {
          active: { say: "even the willow tree is dying" },
          tear: { say: "now i can heal the willow tree" },
          treehealed: { say: "wow!" }
        }
      },

      brynn: {
        active: false,
        events: {
          active: { say: "where the hell is brynn?" }
        }
      }
    };

    // eventTriggers links events to quests
    // if a room is an event, it's triggered upon entering
    this.eventTriggers = {
      tear: { name: "willow", step: "treehealed" },
      room03: { name: "willow", step: "active" },
      room06: { name: "brynn", step: "active" }
    };

    //this.questAlert = new Phaser.Signal();
    //this.questAlert.add(this.updateQuest, this);
    //this.questAlert.dispatch("willow");
  },

  updateQuest: function (quest) {
    console.log('update quest');
    // update quest status
    if (!this.quests[quest.name][quest.step]) {
      this.quests[quest.name][quest.step] = true;

      var event = this.quests[quest.name].events[quest.step];
      
      if (event.say) {
        this.say(event.say);
      }
    }
  },

  evalEvent: function (event) {

    console.log(event + ' has triggered');

    if (this.eventTriggers[event]) {
      console.log('there is a quest linked to this event');
      this.updateQuest(this.eventTriggers[event]);
    }
  },

  evalQuestEvent: function () {

  },

  // DEPRECATED - use evalEvent
  getRoomQuests: function () {

    if (this.rooms[this.currentRoom].quests) {
      //console.log('this room has quest signals');
      var quests = this.rooms[this.currentRoom].quests;
      
      for ( var i = 0 ; i < quests.length ; i++ ) {
        console.log(quests[i]);
        this.updateQuest(quests[i]);
      }
    }
  },

  createSprites: function () {
    
    var sprites = this.rooms[this.currentRoom].sprites;
    
    for (var i = 0 ; i < sprites.length ; i++ ) {
      var sprite = this.spritesGroup.create( sprites[i].x, sprites[i].y, sprites[i].name );
      sprite.scale.setTo(3); // all source assets scaled by 3

      if (this.sprites[sprites[i].name].animated) {

        var animations = this.sprites[sprites[i].name].animations;
        //console.log(animations);

        for (anim in animations) {
          //console.log(animations[anim]);

          sprite.animations.add(
            animations[anim].name,
            animations[anim].frames,
            animations[anim].speed,
            animations[anim].loop,
            false);

          animations[anim].start ? sprite.animations.play(animations[anim].name):sprite.alpha = 0;  
        }  
      }//if animated

      if (this.sprites[sprites[i].name].action) {
        var action = this.sprites[sprites[i].name].action;

        if (action.click) {
          sprite.inputEnabled = true;
          sprite.events.onInputDown.add(function (data) {
            
            //console.log('sprite touched');
            //console.log(action.click);
            if (action.click.animation) {
              
              sprite.alpha = 1;
              var anim = sprite.animations.play(action.click.animation, null, false, true);
              anim.onComplete.add(function (data) {
                //console.log('animation complete');
                this.evalEvent(action.click.animation);
              }, this);
            }// if has animation on click

            if (action.click.text) {
              //say something
              this.say(action.click.text);
            }// if has text on click
            
          }, this);
        }// if has click action
      }//if has action
    }
  },

  createRoom: function () {

    this.room = this.game.add.image( 23, 24 );
    this.room.scale.setTo(0.5);
    this.room.inputEnabled = true;
  },

  createText: function () {
    
    this.text = this.game.add.text( 25, 426, 'testing the text', {fill: '#bbbbbb'} );
  },

  createStartRoom: function () {

    this.currentRoom = 'room02';
    this.room.loadTexture(this.currentRoom);
    this.createDoors();
    this.createItems();
    this.createSprites();
    this.importGrid();
    this.checkMusic();
    this.changeRoomText(this.rooms[this.currentRoom].name);
  },

  createGui: function () {

    this.gui = this.game.add.image( 0, 0, 'gui');
    this.gui.scale.setTo(0.5);
  },

  createInventory: function () {

    this.slotsGroup = this.game.add.group(); // group for slot objects
    this.inventory = this.game.add.group(); // group for items held in slots

    for (var i = 0; i < this.slots.length ; i++) {
      var x = this.slots[i].x,
          y = this.slots[i].y,
          height = this.slots[i].height,
          width = this.slots[i].width;

      /* for inventory debug
      var slotBackground = this.game.make.graphics();
        slotBackground.beginFill(0xffffff, 0.5);
        slotBackground.drawRect(x, y, width, height);
        slotBackground.endFill();
        this.slotsGroup.add(slotBackground);
      */

      var slot = this.slotsGroup.create( x, y );
        slot.width = width;
        slot.height = height;
        slot.name = null;
        slot.item = null;
        slot.occupied = false;
    }
  },

  createItems: function () {
    /*
      iter each item in room.items
      check item sprite sheet frame from itemAtlas
      make each item draggable
      save inventory items in separate inventory object
    */
    
    this.items = this.rooms[this.currentRoom].items;

    for (var i = 0 ; i < this.items.length ;i++) {
      //console.log(items[i]);
      var item = this.game.make.image(this.items[i].x, this.items[i].y, 'items');
      item.name = this.items[i].name;
      frame = this.itemAtlas[item.name];
      item.frame = frame;
      //item.bringToTop();
      item.inputEnabled = true;
      item.input.enableDrag(true, true);

      // check if item was in inventory, if so, remove from slot
      item.events.onDragStart.add(function (data) {
        //console.log(data);
        this.changeRoomText(item.name + ' picked up');
        this.checkItemOrigin(data);
      }, this);

      // then check drop location
      item.events.onDragStop.add(function (data) {
        //console.log(data);
        this.changeRoomText(item.name + ' placed');
        this.checkItemDest(data);
      }, this);

      this.itemGroup.add(item);
    }
  },

  createFairy: function () {

    this.fairy = this.game.add.sprite(700, 100, 'fairy', 'sit-1');
    this.fairy.animations.add('fly', ['fly-1', 'fly-2', 'fly-3'], 5, true, false);
    this.fairy.animations.add('sit', ['sit-1', 'sit-2'], 5, true, false);
  },

  createPlayer: function () {

    this.player = this.game.add.sprite(318, 338, 'player', 'stand-right');
    this.player.name = 'player';

    this.player.animations.add('walk-right', [
      'right-1','right-2','right-3','right-4',
      'right-5','right-6','right-7'
    ], 8, true, false);
    
    this.player.animations.add('walk-left', [
      'left-1','left-2','left-3','left-4',
      'left-5','left-6','left-7'
    ], 8, true, false);
    
    this.player.animations.add('walk-up', [
      'up-1','up-2','up-3','up-4',
      'up-5','up-6'
    ], 10, true, false);
    
    this.player.animations.add('walk-down', [
      'down-1','down-2','down-3','down-4',
      'down-5','down-6'
    ], 9, true, false);

    this.player.scale.setTo(1);
    this.player.anchor = {x:0.5, y:0.9};
    this.physics.arcade.enableBody(this.player);
    //this.player.body.setSize(100, 30);

    this.spritesGroup.add(this.player);
  },

  createGrid: function () {

    this.grid = new PF.Grid(this.tileX, this.tileY);
    this.finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });

    if (this.debug) {
      this.map.addTilesetImage('pathing');
    }
  },

  createInputs: function () {
    
    //this.game.input.onTap.add(this.move, this);
    this.room.events.onInputDown.add(function (pointer) {
      this.speech ? this.speech.destroy(): null;
      this.closeDoor();
      this.stopMoving();
      this.move(this.game.input.position);
    }, this);
  },

  createMap: function () {

    this.map = this.game.add.tilemap();
    this.map.tileWidth = this.tileSize;
    this.map.tileHeight = this.tileSize;

    this.layer = this.map.create('layer', this.tileX, this.tileY, this.tileSize, this.tileSize);
  },

  createDoors: function () {

    this.doors = this.rooms[this.currentRoom].doors;
    for (door in this.doors) {

      var x = this.doors[door].x,
          y = this.doors[door].y,
          height = this.doors[door].height,
          width = this.doors[door].width,
          entry = this.doors[door].entry;

      var newDoor = this.doorGroup.create( x, y );
        newDoor.height = height;
        newDoor.width = width;
        newDoor.name = this.doors[door].name;
        newDoor.inputEnabled = true;
        newDoor.input.useHandCursor = true;
        this.physics.arcade.enable(newDoor);

        newDoor.events.onInputDown.add(this.moveToDoor, this);

      if (this.debug) {
        var doorBg = this.game.make.graphics();
        doorBg.beginFill(0xff0000, 0.3);
        doorBg.drawRect(x, y, width, height);
        doorBg.endFill();

        this.doorDebug.add(doorBg);  
      }
    } 
  },

  changeSpriteIndex: function () {
    // move sprites behind/in front of player
    for (var i = 0 ; i < this.spritesGroup.length ; i++) {
      var sprite = this.spritesGroup.children[i];
      //console.log(sprite);
      if (sprite.name == 'player') {
        //pass  
        //console.log('sprite is player');

      } else if (this.player.bottom < sprite.bottom) {
        // sprite is in front of player
        //console.log('sprite is in front of player');
        sprite.bringToTop();


      } else {
        // sprite is behind player
        //console.log('sprite is behind player');
        sprite.sendToBack();
      }  
    }
  },

  changePlayerAnimation: function () {

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

    } else {
      //stop
      if (this.direction == 'left' || this.direction == 'up') {
        this.player.animations.stop();
        this.player.frameName = 'stand-left';
      } else {
        this.player.animations.stop();
        this.player.frameName = 'stand-right';
      }
    }      
  },

  say: function (string) {
    
    this.speech = this.game.add.text( (this.player.x), (this.player.top-40), string, {fill: '#eeeeee'});
    
    if (this.speech.right > 920) {
      this.speech.x -= this.speech.right - 920;
    }

    if (this.speech.top < 40) {
      this.speech.y = 40;
    }

    var length = string.split(' ').length; 
    var timer = this.time.create();
    timer.add(length*800, function () {
      this.speech.destroy();
    },this);
    timer.start();
  },

  moveToDoor: function (door) {
    var myDoor = this.rooms[this.currentRoom].doors[door.name];

    //console.log('move to door:');

    this.stopMoving();
    this.openDoor = myDoor.name;
    this.move(myDoor.entry);
  },

  peekInDoor: function (player, door) {

    if (door.name == this.openDoor) {
      this.openDoor = false;
      this.door = door.name;
    
      this.exitRoom(); 
    }
  },

  exitRoom: function () {
    //console.log('exiting room');

    var myDoor = this.rooms[this.currentRoom].doors[this.door];
    
    this.enableInput(false);

    // offtweening
    if (myDoor.offPoint) {
      
      this.tweenOut();
      
    } else if (myDoor.animation) {
      //console.log('door has animation');
      //check for exit animations
      //start exiting animation

      //change room
      this.loadRoom(door);
    }
  },

  enterRoomFrom: function (room) {
    //console.log('entering room');
    // entering this <door> into this <currRoom>
    var myDoor = this.rooms[this.currentRoom].doors[room.texture];

    // check for enter animation
    if (myDoor.animation) {
      // play animation
    }

    //move player into position for ontweening
    var startPoint = {};
    for (val in myDoor.offPoint) {
      startPoint[val] = myDoor.offPoint[val];
    }
    
    this.player.position = startPoint;
    this.tweenIn(myDoor);
  },

  tweenIn: function (door) {
    
    var entryPoint = door.entry;
    //console.log('tweening in to:' + entryPoint.x +' '+ entryPoint.y);
    
    this.tween = this.game.add.tween(this.player)
    this.tween.to(entryPoint, 440); //todo adjust tween speed
    this.tween.onComplete.addOnce(function () {
      
      //console.log('tween in finished');
      this.openRoom();
    }, this);

    this.tween.start();
  },

  tweenOut: function () {
    
    var myDoor = this.rooms[this.currentRoom].doors[this.door];
    var offPoint = myDoor.offPoint;

    //console.log('tweening out to:' + myDoor.offPoint.x +' '+ myDoor.offPoint.y);

    this.between = this.game.add.tween(this.player)
    this.between.to(offPoint, 440); //todo adjust betweening speed
    
    this.between.onComplete.addOnce(function () {
      //check for exit animations

      //console.log('tween out finished');
      this.loadRoom(myDoor);

    }, this); 

    if (this.tween.isRunning) {
      //console.log('chaining tween');
      this.tween.chain(this.between); 
    } else {
      //console.log('running between alone');
      this.between.start();
    }
  },

  loadRoom: function (door) {
    
    //console.log('changing room');
    var nextRoom = this.rooms[door.name];
    var currRoom = this.rooms[this.currentRoom];
    
    // door hit > disable room
    //this.enableInput(false);

    this.closeRoom();

    // ready next room
    //this.player.position = nextRoom.from[this.currentRoom];
    this.room.loadTexture(nextRoom.texture);
    this.currentRoom = nextRoom.texture;
    this.changeRoomText(nextRoom.name);
    this.checkMusic();

    this.importGrid();
    this.createDoors();
    this.createItems();
    this.createSprites();

    // return player sprite to spriteGroup
    this.world.remove(this.player);
    this.spritesGroup.add(this.player);

    this.enterRoomFrom(currRoom);
  },

  closeRoom: function () {

    this.saveItems(); // save room state

    // save player sprite
    this.spritesGroup.remove(this.player);
    this.world.addAt(this.player, 1);
    //this.spritesGroup.removeAll(true);

    this.doorGroup.removeAll(true);
    this.doorDebug.removeAll(true);
    this.itemGroup.removeAll(true);
    this.spritesGroup.removeAll(true);
  },

  openRoom: function () {

    //this.getRoomQuests();
    this.evalEvent(this.currentRoom);
    this.enableInput(true);
  },

  checkItemOrigin: function (item) {
    
    // if item is from inventory : clear its slot
    var slots = this.slotsGroup.children;  
    for (var i = 0 ; i < slots.length ; i++) {
      
      if (this.inBounds(item, slots[i])) {
        //console.log('removing item from: ' + slots[i].x + ' ' + slots[i].y);
        this.inventory.remove(slots[i].item);
        this.itemGroup.add(item);
        this.clearSlot(slots[i]);
      }
    };
  },

  checkItemDest: function (item) {
    var placed = false;
    //check for interactive sprites

    //check if room hit
    if (this.inBounds(item, this.room) && !placed) {
      //console.log('room hit');
      placed = true;
    }
    //check if inventory hit
    else if (this.inBounds(item, this.slotsGroup) && !placed) {
      this.slotsGroup.forEach(function (slot) {
        if (this.inBounds(item, slot)) {
          this.moveToInventory(item, slot);
          placed = true;
        } 
      }, this);
    }
    //otherwise: toss item onto the ground
    if (!placed) {
      item.x = this.player.x;
      item.y = this.player.y - 25;
    }
  },

  clearSlot: function (slot) {

    slot.name = null;
    //slot.item = null;
    slot.occupied = false;
  },

  moveToInventory: function (item, slot) {

    // move item from itemGroup to inventory group
    // if slot occupied, move item to room floor, random pos
    // and move from inventory group to itemGroup

    if (slot.occupied) {  
      slot.item.position = {x: (Math.random()*300 + 50), y: 300};
      this.inventory.remove(slot.item);
      this.itemGroup.add(slot.item);
    }
    
    this.moveToCenter(item, slot);
    slot.name = item.name;
    slot.item = item;
    slot.occupied = true;

    this.itemGroup.remove(item);
    this.inventory.add(item);
  },

  moveToCenter: function (obj1, obj2) {

    // centers obj1 onto obj2

    obj1.x = obj2.x + obj2.width/2 - obj1.width/2;
    obj1.y = obj2.y + obj2.height/2 - obj1.height/2;
  },

  inBounds: function (obj1, obj2) {
  
    // sprite bounds comparison
    // checks if obj1 is in the bounds of obj2 

    var obj = obj1.getBounds();
    var bound = obj2.getBounds();

    if (bound.x < obj.centerX && (bound.x + bound.width) > obj.centerX &&
        bound.y < obj.centerY && (bound.y + bound.height) > obj.centerY) {
      return true;
    } else {
      return false;
    }
  },

  enableInput: function (bool) {
    
    this.input.enabled = bool;
  },

  checkMusic: function () {

    if (this.currentMusic != this.rooms[this.currentRoom].music) {
      
      this.music ? this.music.fadeOut(): null;
      this.currentMusic = this.rooms[this.currentRoom].music;

      if (this.currentMusic != null) {
        
        //console.log('playing music: '+this.currentMusic);
        this.music = this.game.sound.add(this.currentMusic, 1, true);
        this.music.onDecoded.add(function() {
          //this.music.play(); 
          this.music.fadeIn(); 
        }, this);
        
      }
    } 
  },

  changeRoomText: function (string) {
    
    this.text.text = string;
  },

  saveItems: function () {
    // iter each item in itemGroup, the local items
    // save new position of each item to room.items

    this.itemGroup.forEach(function(item) {
      for (var i = 0; i < this.rooms[this.currentRoom].items.length ; i++) {
        if (item.name == this.rooms[this.currentRoom].items[i].name) {
          //console.log('saving ' + item.name + ' location');
          this.rooms[this.currentRoom].items[i].x = item.x;
          this.rooms[this.currentRoom].items[i].y = item.y;
          break;  
        }
      }
    }, this);
  },

  stopMoving: function () {
      
    if (this.tween) {
      this.tween.stop(true);
      this.tweens.remove(this.tween);
    } 
  },

  importGrid: function () {
    
    var roomJson = this.currentRoom + '_json';
    var gridJson = this.cache.getJSON(roomJson);
    this.grid.nodes = gridJson;

    if (this.debug) {

      for (var i = 0; i < gridJson.length ; i++) {
        for ( var j = 0 ; j < gridJson[i].length ; j++ ) {
          if (!gridJson[i][j].walkable) {
            var tile = this.map.putTile(0, gridJson[i][j].x, gridJson[i][j].y, this.layer);
            tile.alpha = 0.5;
          }
        }
      }
    }
  },

  move: function (pointer) {

    this.findWay(pointer);
  },

  closeDoor: function () {
    //console.log('closing door');
    
    this.openDoor = null;
  },

  tweenComplete: function () {
    var timer = this.time.create();
    timer.add(500, this.closeDoor);
    timer.start();
  },

  findWay: function (pointer) {

    var startX = this.layer.getTileX(this.player.position.x);
    var startY = this.layer.getTileY(this.player.position.y);
    var endX = this.layer.getTileX(pointer.x);
    var endY = this.layer.getTileY(pointer.y);

    //console.log(startX +','+ startY + ' to ' + endX +','+ endY);
    //console.log(Math.floor(pointer.x), Math.floor(pointer.y));

    if (startX != endX || startY != endY) {

      var grid = this.grid.clone();
      this.path = this.finder.findPath(startX, startY, endX, endY, grid);
      var newPath = PF.Util.smoothenPath(this.grid, this.path);
      
      this.tweenPath(newPath);
      this.path = null;

    }
  },

  tweenPath: function (path) {
    
    this.tween = this.game.add.tween(this.player);
    this.tween.onComplete.addOnce(this.tweenComplete, this); 
    
    var prevX = this.player.position.x/this.tileSize;
    var prevY = this.player.position.y/this.tileSize;

    for ( var i = 0; i < path.length ; i++ ) {
      var x = path[i][0];
      var y = path[i][1];
      var dist = this.game.physics.arcade.distanceBetween({x: x, y: y}, {x: prevX, y: prevY});

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
};
