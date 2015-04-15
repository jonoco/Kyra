
BasicGame.Game = function (game) {

  //  When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

  this.game;      //  a reference to the currently running game (Phaser.Game)
  this.add;       //  used to add sprites, text, groups, etc (Phaser.GameObjectFactory)
  this.camera;    //  a reference to the game camera (Phaser.Camera)
  this.cache;     //  the game cache (Phaser.Cache)
  this.input;     //  the global input manager. You can access this.input.keyboard, this.input.mouse, as well from it. (Phaser.Input)
  this.load;      //  for preloading assets (Phaser.Loader)
  this.math;      //  lots of useful common math operations (Phaser.Math)
  this.sound;     //  the sound manager - add a sound, play one, set-up markers, etc (Phaser.SoundManager)
  this.stage;     //  the game stage (Phaser.Stage)
  this.time;      //  the clock (Phaser.Time)
  this.tweens;    //  the tween manager (Phaser.TweenManager)
  this.state;     //  the state manager (Phaser.StateManager)
  this.world;     //  the game world (Phaser.World)
  this.particles; //  the particle manager (Phaser.Particles)
  this.physics;   //  the physics manager (Phaser.Physics)
  this.rnd;       //  the repeatable random number generator (Phaser.RandomDataGenerator)

  //  You can use any of these from any function within this State.
  //  But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.

  // tilemap variables
  this.tileSize = 8;
  this.tileX = 120;
  this.tileY = 75;
  this.map = null;
  this.marker = null;
  this.cursors = null;
  this.currentTile = 0;
  this.layer = null;
  this.remove = false;
  this.modTiles = true;
  this.updateMarkerIndex;

  // grid variables
  this.grid;
  this.finder;
  this.path;

  // sprite variabels
  this.player = null;
  this.tween = null;
  this.speed = 30; // lower is faster tweening

  // inventory variables
  this.slots = [ 
    {x:238, y:402, name: null, item: null, occupied: false},
    {x:288, y:402, name: null, item: null, occupied: false},
    {x:338, y:402, name: null, item: null, occupied: false},
    {x:388, y:402, name: null, item: null, occupied: false},
    {x:438, y:402, name: null, item: null, occupied: false},
    {x:238, y:454, name: null, item: null, occupied: false},
    {x:288, y:454, name: null, item: null, occupied: false},
    {x:338, y:454, name: null, item: null, occupied: false}, 
    {x:388, y:454, name: null, item: null, occupied: false}, 
    {x:438, y:454, name: null, item: null, occupied: false} 
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
  this.doorGroup;
  this.music;
  this.currentMusic;
  this.openDoor = false; // checks if last click was on a door > reset on move complete

};

BasicGame.Game.prototype = {

  create: function () {

    this.rooms = this.game.cache.getJSON('rooms');
    this.stage.backgroundColor = '#2d2d2d';
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.createGrid();

    this.room = this.game.add.image( 23, 24);
    this.room.scale.setTo(0.5);

    this.createStartRoom();

    this.createPlayer();
    this.game.add.image( 0, 0, 'gui').scale.setTo(0.5);

    this.createMap();
    this.createInputs();
    this.createDoors(); // for debugging
    this.createItems();
    this.createInventory();

  },

  update: function () {

    this.openDoor ? this.checkDoors(): null;

  },

  render: function () {

    this.game.debug.text('Open door: ' + this.openDoor, 16, 500);
    /*
    this.game.debug.body(this.player);
    for (var i = 0 ; i < this.doorGroup.children.length ; i++) {
      this.game.debug.body(this.doorGroup.children[i]); 
    }
    */
  
  },

  quitGame: function (pointer) {

    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');

  },

  createStartRoom: function () {

    this.currentRoom = 'room01';
    this.room.loadTexture(this.currentRoom);
    this.importGrid();
    this.checkMusic();

  },

  checkDoors: function () {
    
    for (var i = 0 ; i < this.doors.length ; i++) {
      if ( 
          this.player.x > this.doors[i].x &&
          this.player.x < (this.doors[i].x + this.doors[i].width) &&
          this.player.y > this.doors[i].y &&
          this.player.y < (this.doors[i].y + this.doors[i].height)) {

        this.changeRoom(this.doors[i].name);
      }
    } 
  },

  createInventory: function () {
    
    this.slotsGroup = this.game.add.group(); // group for slot objects
    this.inventory = this.game.add.group(); // group for items held in slots

    for (var i = 0; i < this.slots.length ; i++) {
      var slot = this.game.make.image(this.slots[i].x, this.slots[i].y);
      slot.width = 40;
      slot.height = 40;
      this.slotsGroup.add(slot);
    }
  },

  createItems: function () {
    /*
      iter each item in room.items
      check item sprite sheet frame from itemAtlas
      make each item draggable
      save inventory items in separate inventory object
      ?make all inventory items a separate group?
    */
    this.itemGroup = this.game.add.group();
    this.items = this.rooms[this.currentRoom].items;

    for (var i = 0 ; i < this.items.length ;i++) {
      //console.log(items[i]);
      var item = this.game.make.image(this.items[i].x, this.items[i].y, 'items');
      item.name = this.items[i].name;
      frame = this.itemAtlas[item.name];
      item.frame = frame;
      item.inputEnabled = true;
      item.input.enableDrag(true, true);
      //item.input.enableSnap(30, 30, false, true, 240, 400);

      // drag stop
      // check if item was in inventory, if so, remove from slot
      // then check drop location
      item.events.onDragStop.add(function(item) {
        //todo use physics.overlap to check if item hit inventory slot
        //this.traceItem(item);
      });

      this.itemGroup.add(item);
    }
  },

  createPlayer: function () {

    this.player = this.game.add.sprite(318, 338, 'player');
    this.player.scale.setTo(0.5);
    this.player.anchor = {x:0.45, y:0.9};
    this.physics.arcade.enableBody(this.player);
    this.player.body.setSize(100, 30);

  },

  createGrid: function () {

    this.grid = new PF.Grid(this.tileX, this.tileY);
    this.finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });
    
  },

  createInputs: function () {
    
    this.game.input.onTap.add(this.move, this);

  },

  createMap: function () {

    this.map = this.game.add.tilemap();
    this.map.tileWidth = this.tileSize;
    this.map.tileHeight = this.tileSize;

    this.layer = this.map.create('level1', this.tileX, this.tileY, this.tileSize, this.tileSize);
    //this.layer.resizeWorld();
    
  },

  createDoors: function () {

    this.doorGroup = this.game.add.group();
    this.doors = this.rooms[this.currentRoom].doors; 
    //
    for (var i = 0 ; i < this.doors.length ; i++) {
      var x = this.doors[i].x,
          y = this.doors[i].y,
          height = this.doors[i].height,
          width = this.doors[i].width;

      var door = this.doorGroup.create( x, y );
      door.height = height;
      door.width = width;
      door.inputEnabled = true;
      door.input.useHandCursor = true;
      door.events.onInputDown.add(function() {
        console.log('open the door');
        this.openDoor = true;
      }, this);
      
    }
  },

  traceItem: function (item) {
    var start = item.input.dragStartPoint;
    
    // check if item is from inventory 
    // if so, remove it from its slot
    if (this.inventory.getIndex(item) > 0) {
      this.slotsGroup.forEach(function (slot) {
        var bound = slot.getBounds();
        var centerX = start.x + item.width/2;
        var centerY = start.y + item.height/2;
        
        // find which slot item came from > free the slot
        // move item from inventory grou to itemGroup
        if (centerX > bound.x &&
            centerX < (bound.x + bound.width) &&
            centerY > bound.y &&
            centerY < (bound.y + bound.height)) {
          //console.log('moving item from: ' + slot.x + ' ' + slot.y);
          slot.name = null;
          slot.item = null;
          slot.occupied = false;

          this.inventory.remove(slot.item);
          this.itemGroup.add(item);
        }
      });// slotsGroup.forEach
    }// inventory check
    
    // check if item dropped into inventory > add it
    this.slotsGroup.forEach(function (slot) {
      if (this.inBounds(item, slot)) {
        this.moveToInventory(item, slot);
      } 
    }, this);
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
    /* 
     * sprite bounds comparison
     * checks if obj1 is in the bounds of obj2
     */
    //console.log(bound);

    var obj = obj1.getBounds();
    var bound = obj2.getBounds();

    if (bound.x < obj.centerX && (bound.x + bound.width) > obj.centerX &&
        bound.y < obj.centerY && (bound.y + bound.height) > obj.centerY) {
      return true;
    } else {
      return false;
    }
  },

  changeRoom: function (room) {
    var nextRoom = this.rooms[room];
    //console.log(nextRoom);

    // move player on from off screen
    // do not create doors, and prevent input until sequence finished
    
    this.stopMoving();

    // save room state
    this.saveItems();
    
    // destroy objects
    this.doorGroup.destroy();
    this.itemGroup.destroy();
    
    // setup next room
    this.player.position = nextRoom.from[this.currentRoom];
    this.room.loadTexture(nextRoom.texture);
    this.currentRoom = nextRoom.texture;
    this.importGrid();
    this.checkMusic();

    // make objects
    this.createDoors();
    this.createItems();
  },

  checkMusic: function () {
  
    if (this.currentMusic != this.rooms[this.currentRoom].music) {
      this.game.sound.stopAll();
      this.currentMusic = this.rooms[this.currentRoom].music;
      if (this.currentMusic != null) {
        this.music = this.game.sound.play(this.currentMusic); 
      }
    } 
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
    
    this.tween.stop(true);

  },

  importGrid: function () {
    
    var roomJson = this.currentRoom + '_json';
    var gridJson = this.game.cache.getJSON(roomJson);
    this.grid.nodes = gridJson;

  },

  move: function (pointer) {

    this.findWay(pointer);

  },

  findWay: function (pointer) {

    //console.log(Math.floor(pointer.x), Math.floor(pointer.y));
    //todo error on player click

    var startX = this.layer.getTileX(this.player.position.x);
    var startY = this.layer.getTileY(this.player.position.y);
    var endX = this.layer.getTileX(pointer.x);
    var endY = this.layer.getTileY(pointer.y);

    console.log(startX +','+ startY + ' to ' + endX +','+ endY);
    if (startX != endX || startY != endY) {

      var grid = this.grid.clone();
      this.path = this.finder.findPath(startX, startY, endX, endY, grid);
      var newPath = PF.Util.smoothenPath(this.grid, this.path);
      
      this.createTween(newPath);
      this.path = null;

    }
  },

  createTween: function (path) {
    
    this.tween = this.game.add.tween(this.player);
    this.tween.onComplete.addOnce(function () {
      this.openDoor = false;
    }, this); // resets door checking after each move
    
    var prevX = this.player.position.x/this.tileSize;
    var prevY = this.player.position.y/this.tileSize;

    for ( var i = 0; i < path.length ; i++ ) {
      var x = path[i][0];
      var y = path[i][1];
  
      var dist = this.game.physics.arcade.distanceBetween({x: x, y: y}, {x: prevX, y: prevY});
      //console.log(dist);

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
