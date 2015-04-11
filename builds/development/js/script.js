var width = 800;
var height = 500;
var game = new Phaser.Game(width, height, Phaser.AUTO, '',
 { preload: preload, create: create, update: update, render: render});

var scale = 800/1920;
var player,
 		room,
 		rooms,
 		currentRoom = 'room01',
 		timeout,
 		doorGroup,
 		itemGroup,
 		slotsGroup,
 		item,
 		items,
 		door,
 		doors,
 		speed = 220,
 		inventory,
 		itemAtlas,
 		debug = true,
 		slot,
		slots,
		start,
		music,
		musicName,
		musicLoaded = [];

var go = { 
	moving: false,
	from: {},
	to: {} 
};

slots = [ 
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

itemAtlas = {
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

function preload () {

	game.load.json('rooms', 'rooms.json');
	game.load.image('gui', 'assets/img/gui.png');
	game.load.image('player', 'assets/img/brandon.png');
	game.load.spritesheet('items', 'assets/img/item_sheet.png', 32, 32);
	
	game.load.onFileComplete.add(function(progress, key) {
		//console.log(progress + '%');
		//console.log(key + ' loaded');
		if (key == 'rooms') {
			rooms = game.cache.getJSON('rooms');
			loadRoomData();
		}
	}, game);
}

function loadRoomData () {

	for (room in rooms) {
		game.load.image(rooms[room].texture, rooms[room].path);
		loadAudio(room, rooms);
	}
}

function loadAudio (room, rooms) {
	var roomMusic = rooms[room].music;
	var loading = game.load.checkKeyExists('audio', roomMusic);
	if (roomMusic !== null && !loading) {
		console.log('loading music: ' + roomMusic);
		game.load.audio(roomMusic, rooms[room].music_path);
		musicLoaded.push(roomMusic);
	}
}

function create () {

	game.input.onTap.add(click, this);
	game.physics.startSystem(Phaser.Physics.ARCADE);

	room = game.add.sprite(19, 20, rooms.room01.texture);
	room.scale.setTo(scale);
	
	player = game.add.sprite(288, 218, 'player');
	player.scale.setTo(scale);
	player.anchor.set(0.5);

	game.add.sprite(0, 0, 'gui').scale.setTo(scale);

	// interaction areas
	makeDoors();
	
	makeItems();

	makeInventory();
	
	game.physics.arcade.enable([ player, room ]);
	player.body.setSize(110, 40, 0, 50);
}

function checkMusic() {
	
	if (musicName != rooms[currentRoom].music) {
		game.sound.stopAll();
		musicName = rooms[currentRoom].music;
		if (musicName != null) {
			music = game.sound.play(musicName);	
		}
	} 
}

function saveItems () {
	// iter each item in itemGroup, the local items
	// save new position of each item to room.items

	itemGroup.forEach(function(item) {
		for (var i = 0; i < rooms[currentRoom].items.length ; i++) {
			if (item.name == rooms[currentRoom].items[i].name) {
				console.log('saving ' + item.name + ' location');
				rooms[currentRoom].items[i].x = item.x;
				rooms[currentRoom].items[i].y = item.y;
				break;	
			}
		}
	}, this);
}

function makeInventory () {
	slotsGroup = game.add.group(); // group for slot objects
	inventory = game.add.group(); // group for items held in slots

	for (var i = 0; i < slots.length ; i++) {
		slot = game.make.image(slots[i].x, slots[i].y);
		slot.width = 40;
		slot.height = 40;
		slotsGroup.add(slot);
		
		if (debug) {
			slot.loadTexture('items', 4);	
			slot.alpha = 0.2;
		}
	}
}

function makeItems () {
	/*
		iter each item in room.items
		check item sprite sheet frame from itemAtlas
		make each item draggable
		save inventory items in separate inventory object
		?make all inventory items a separate group?
	*/
	itemGroup = game.add.group();
	items = rooms[currentRoom].items;

	for (var i = 0 ; i < items.length ;i++) {
		//console.log(items[i]);
		item = game.make.image(items[i].x, items[i].y, 'items');
		item.name = items[i].name;
		frame = itemAtlas[item.name];
		item.frame = frame;
		item.inputEnabled = true;
		item.input.enableDrag(true, true);
		//item.input.enableSnap(30, 30, false, true, 240, 400);

		// drag stop
		// check if item was in inventory, if so, remove from slot
		// then check drop location
		item.events.onDragStop.add(function(item) {
			traceItem(item);
		});

		itemGroup.add(item);
	}
}

function traceItem (item) {
	start = item.input.dragStartPoint;
	
	// check if item is from inventory 
	// if so, remove it from its slot
	if (inventory.getIndex(item) > 0) {
		slotsGroup.forEach(function(slot) {
			var bound = slot.getBounds();
			var centerX = start.x + item.width/2;
			var centerY = start.y + item.height/2;
			
			// find which slot item came from > free the slot
			// move item from inventory grou to itemGroup
			if (centerX > bound.x &&
					centerX < (bound.x + bound.width) &&
					centerY > bound.y &&
					centerY < (bound.y + bound.height)) {
				console.log('moving item from: ' + slot.x + ' ' + slot.y);
				slot.name = null;
				slot.item = null;
				slot.occupied = false;

				inventory.remove(slot.item);
				itemGroup.add(item);
			}
		})// slotsGroup.forEach
	}// inventory check
	
	// check if item dropped into inventory > add it
	slotsGroup.forEach(function(slot) {
		if (inBounds(item, slot)) {
			moveToInventory(item, slot);
		}	
	}, this);
}

function moveToInventory (item, slot) {
	// move item from itemGroup to inventory group
	// if slot occupied, move item to room floor, random pos
	// and move from inventory group to itemGroup
	if (slot.occupied) {	
		slot.item.position = {x: (Math.random()*300 + 50), y: 300};
		inventory.remove(slot.item);
		itemGroup.add(slot.item);
	}
	
	moveToCenter(item, slot);
	slot.name = item.name;
	slot.item = item;
	slot.occupied = true;

	itemGroup.remove(item);
	inventory.add(item);
}

function inBounds (obj1, obj2) {
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
}

function moveToCenter (obj1, obj2) {
	obj1.x = obj2.x + obj2.width/2 - obj1.width/2;
	obj1.y = obj2.y + obj2.height/2 - obj1.height/2;
}

function makeDoors () {
	doorGroup = game.add.group();
	doors = rooms[currentRoom].doors;

	for (var i = 0 ; i < doors.length ; i++) {
		door = game.make.sprite(doors[i].x, doors[i].y);
		game.physics.arcade.enable(door);
		door.body.immovable = true;
		door.body.setSize(doors[i].width, doors[i].height);
		door.name = doors[i].name;

		doorGroup.add(door);
	}
}

function update () {
	
	if( go.moving ) { 
		// check for collision with blocks, if collided then
		// transfer velocity to non-blocked axis
		move()
		checkDestination() 
	};
	game.physics.arcade.collide(player, doorGroup, collisionHandler, null, this);
}

function collisionHandler (player, obj) {
	console.log('obj hit: ' + obj.name);
	if (obj.name) {
		changeRoom(obj.name);
	}
}

function render () {

	if (debug){
		game.debug.body(player);
		for (var i = 0 ; i < doorGroup.children.length ; i++) {
			game.debug.body(doorGroup.children[i]); 
		}
	}
}

function checkDestination() {
	if (player.x > (go.to.x - 2) &&
		  player.x < (go.to.x + 2) &&
		  player.y > (go.to.y - 2) &&
		  player.y < (go.to.y + 2)
		){
		stopMoving();
	}
}

function click (pointer) {
	// differentiate bodies clicked here
	// dispatch calls based on body
	console.log(Math.round(pointer.x), Math.round(pointer.y));

	var playerHit = player.body.hitTest(pointer.x, pointer.y);
	var roomHit = room.body.hitTest(pointer.x, pointer.y);
	
	//console.log('room hit: ' + roomHit);
	//console.log('player hit: ' + playerHit);

	if (playerHit) {
		//
	} else if (roomHit) {
		setDestination(pointer);
	}
}

function changeRoom (nextRoom) {
	// move player on from off screen
	// do not create doors, and prevent input until sequence finished
	stopMoving();

	// save room state
	saveItems();
	
	// destroy objects
	doorGroup.destroy();
	itemGroup.destroy();
	
	// setup next room
	player.position = rooms[nextRoom].from[currentRoom];
	room.loadTexture(rooms[nextRoom].texture);
	currentRoom = rooms[nextRoom].texture;
	checkMusic();

	// make objects
	makeDoors();
	makeItems();
}

function setDestination (pointer) {
	go.from.x = player.x;
	go.from.y = player.y;
	go.to.x   = pointer.x;
	go.to.y   = pointer.y - player.height/2.2;
	go.moving = true;
	move();
}

function move () {
	game.physics.arcade.moveToXY(player, go.to.x, go.to.y, speed);
}

function stopMoving () {
	player.body.velocity.set(0, 0);
	go.moving = false;
}

function debugOff () {
	debug = false;
}

function debugOn () {
	debug = true;
}

function checkInventory () {
	inventory.forEach(function(item) {
		console.log(item.name);
	});
}
