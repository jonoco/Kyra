var game = new Phaser.Game(800, 500, Phaser.AUTO, '',
 { preload: preload, create: create, update: update});

var scale = 800/1920;
var player = null,
 		room = null,
 		timeout = null,
 		result = 'click';

var go = { 
	moving: false,
	from: {},
	to: {} 
};

function preload () {
	game.load.image('gui', 'assets/img/gui.png');
	game.load.image('room01', 'assets/screens/room01.png');
	game.load.image('player', 'assets/img/brandon.png');
}

function create () {
	game.physics.startSystem(Phaser.Physics.ARCADE);
	game.add.sprite(0, 0, 'gui').scale.setTo(scale);
	
	room = game.add.sprite(19, 20, 'room01')
	room.scale.setTo(scale);
	
	player = game.add.sprite(300, 180, 'player')
	player.scale.setTo(scale);
	player.anchor.set(0.5);

	game.physics.arcade.enable([ player, room ]);
	game.input.onDown.add(click, this);
}

function update () {
	// body...
	if( go.moving ) { checkDestination() };
}

function checkDestination() {
	if (player.x > (go.to.x - 2) &&
		  player.x < (go.to.x + 2) &&
		  player.y > (go.to.y - 2) &&
		  player.y < (go.to.y + 2)
		){
		player.body.velocity.set(0, 0);
		go.moving = false;
	}
}

function click(pointer) {
	// differentiate bodies clicked here
	// dispatch calls based on body
	var playerHit = player.body.hitTest(pointer.x, pointer.y);
	var roomHit = room.body.hitTest(pointer.x, pointer.y);
	console.log('room hit: ' + roomHit);
	console.log('player hit: ' + playerHit);
}

function move (pointer) {
	go.from.x = player.x;
	go.from.y = player.y;
	go.to.x   = pointer.x;
	go.to.y   = pointer.y;
	go.moving = true;

	game.physics.arcade.moveToPointer(player, 100);
}

