var game = new Phaser.Game(800, 500, Phaser.AUTO, '',
 { preload: preload, create: create, update: update, render: render});

var signal = new Phaser.Signal(); // signal room changes
var scale = 800/1920;
var player,
 		room,
 		currentRoom = 'room01',
 		timeout,
 		group,
 		door;

var go = { 
	moving: false,
	from: {},
	to: {} 
};

rooms = {
	room01: {
		texture: 'room01',
		music: null,
		items: [],
		group: null,
		blocks: [],
		doors: [ { name: 'room02', x: 400, y: 330, height: 10, width: 200} ],
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
		doors: [ { name: 'room01', x: 600, y: 200, height: 20, width: 50 } ],
		path: 'assets/screens/room02.png',
		from: {
			room01: {x: 560, y: 278} 
		}
	}
}; // TODO load rooms from rooms.json

function preload () {
	loadRoomImages();
	
	game.load.image('gui', 'assets/img/gui.png');
	game.load.image('player', 'assets/img/brandon.png');
	game.load.audio('explosion', 'assets/audio/explosion.mp3');
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

	game.physics.arcade.enable([ player, room ]);
	player.body.setSize(110, 40, 0, 50);

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
	// body...
	if( go.moving ) { 
		move()
		checkDestination() 
	};
	game.physics.arcade.collide(player, group, collisionHandler, null, this);
}

function collisionHandler (obj1, obj2) {
	console.log('obj hit: ' + obj2.name);
	if (obj2.name) {
		changeRoom(obj2.name);
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
	game.physics.arcade.moveToXY(player, go.to.x, go.to.y, 100);
}

function stopMoving () {
	player.body.velocity.set(0, 0);
	go.moving = false;
}

