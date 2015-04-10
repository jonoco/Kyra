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
 		group,
 		door,
 		speed = 220,
 		inventory,
 		itemAtlas;

var go = { 
	moving: false,
	from: {},
	to: {} 
};

inventory = {};

__rooms = {
	room01: {
		texture: 'room01',
		music: null,
		items: [],
		group: null,
		blocks: [],
		doors: [ 
			{ name: 'room02', x: 400, y: 330, height: 10, width: 200} 
		],
		path: 'assets/screens/room01.png',
		from: {
			room02: {x: 388, y: 288} 
		}
	},
	room02: {
		texture: 'room02',
		music: null,
		items: [],
		group: null,
		blocks: [],
		doors: [ 
			{ name: 'room01', x: 600, y: 200, height: 20, width: 50 },
			{ name: 'room03', x: 20, y: 220, height: 100, width: 10 }
		],
		path: 'assets/screens/room02.png',
		from: {
			room01: { x: 560, y: 278 },
			room03: { x: 70, y: 270 } 
		}
	},
	room03: {
		texture: 'room03',
		music: null,
		items: [],
		group: null,
		blocks: [],
		doors: [ 
			{ name: 'room02', x: 760, y: 220, height: 120, width: 20 } 
		],
		path: 'assets/screens/room03.png',
		from: {
			room02: {x: 660, y: 258} 
		}
	}
}; // TODO load rooms from rooms.json

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
	pearl         : 13,
	moonstone     : 14,
	rainbowstone  : 15,
	lodestone     : 16,
	rose          : 17,
	tulip         : 18,
	orchid        : 19,
	magic_rose    : 20,
	horse         : 21,
	silver_coin   : 22,
	gold_coin     : 23,
	ring          : 24,
	chalice       : 25,
	pinecone      : 26,
	acorn         : 27,
	walnut        : 28,
	fireberry1    : 29,
	fireberry2    : 30,
	fireberry3    : 31,
	fireberry4    : 32,
	fireberry5    : 33,
	fireberry6    : 34,
	fish          : 35,
	fishbone      : 36,
	meat          : 37,
	bone          : 38,
	apple         : 39,
	apple_core    : 40,
	blueberry     : 41,
	mushroom      : 42,
	note          : 43,
	marble        : 44,
	saw           : 45,
	figure        : 46,
	feather       : 47,
	item48        : 48,
	shell         : 49,
	clover        : 50,
	star          : 51,
	fountainorb   : 52,
	tear          : 53,
	mirror        : 54,
	dish          : 55,
	flute         : 56,
	hourglass     : 57,
	iron_key      : 58,
	green_key     : 59,
	blue_key      : 60,
	red_potion    : 61,
	red_flask     : 62,
	blue_potion   : 63,
	blue_flask    : 64,
	yellow_potion : 65,
	yellow_flask  : 66,
	green_flask   : 67,
	orange_flask  : 68,
	purple_flask  : 69,
	rainbow_flask : 70,
	water_potion  : 71,
	water_flask   : 72,
	water_potion  : 73,
	water_flask   : 74,
	water_potion  : 75,
	water_flask   : 76,
	water_potion  : 77,
	water_flask   : 78,
	potion        : 79,
	flask         : 80,
	scroll        : 81
}; // TODO load atlas from item-atlas.json

function preload () {

	//load rooms.json
	game.load.json('rooms', 'rooms.json');
	game.load.image('gui', 'assets/img/gui.png');
	game.load.image('player', 'assets/img/brandon.png');
	game.load.spritesheet('items', 'assets/img/item_sheet.png', 32, 32);
	//game.load.audio('explosion', 'assets/audio/explosion.mp3');
	game.load.onFileComplete.add(function(progress, key) {
		console.log(progress + '%');
		console.log(key + ' loaded');
		if (key == 'rooms') {
			rooms = game.cache.getJSON('rooms');
			loadRoomImages();
		}
	}, game)
}

function loadRoomImages() {
	for (room in rooms) {
		game.load.image(rooms[room].texture, rooms[room].path);
	}
}

function create () {

	game.input.onDown.add(click, this);
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
	
	game.physics.arcade.enable([ player, room ]);
	player.body.setSize(110, 40, 0, 50);

}

function makeItems() {
	/*
		iter each item in room.items
		check item sprite sheet frame from itemAtlas
		make each item draggable
		save inventory items in separate inventory object
		?make all inventory items a separate group?
	*/
	var item = game.add.sprite(300, 300, 'items')
	item.frame = 0;
}

function makeDoors() {
	group = game.add.group();
	var doors = rooms[currentRoom].doors;
	for (var i = 0 ; i < doors.length ; i++) {
		door = game.make.sprite(doors[i].x, doors[i].y);
		game.physics.arcade.enable(door);
		door.body.immovable = true;
		door.body.setSize(doors[i].width, doors[i].height);
		door.name = doors[i].name;

		group.add(door);
	}
}

function update () {
	
	if( go.moving ) { 
		move()
		checkDestination() 
	};
	game.physics.arcade.collide(player, group, collisionHandler, null, this);
}

function collisionHandler (player, obj) {
	console.log('obj hit: ' + obj.name);
	if (obj.name) {
		changeRoom(obj.name);
	}
}

function render () {
	var debug = true;
	if (debug){
		game.debug.body(player);
		for (var i = 0 ; i < group.children.length ; i++) {
			game.debug.body(group.children[i]); 
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
	player.position = rooms[nextRoom].from[currentRoom];
	group.destroy();
	room.loadTexture(rooms[nextRoom].texture);
	currentRoom = rooms[nextRoom].texture;
	makeDoors();
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

