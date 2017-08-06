
BasicGame.MainMenu = function (game) {

	this.music = null;
	this.playButton = null;
	this.background = null;

};

BasicGame.MainMenu.prototype = {

	create: function () {

		//	We've already preloaded our assets, so let's kick right into the Main Menu itself.
		//	Here all we're doing is playing some music and adding a picture and button
		//	Naturally I expect you to do something significantly better :)

		this.background = this.add.sprite(0, 0, 'preloaderBackground');
		this.background.scale.setTo(3);

		this.message = this.add.text();
		this.message.x = 400;
    this.message.y = 420;
    this.message.font = 'kyrandia';
    this.message.fontSize = 30;
    this.message.fill = '#eeeeee';
    this.message.stroke = '#000000';
    this.message.strokeThickness = 3;
    this.message.text = "Tap to play";

		this.input.onTap.add(this.startGame, this);

	},

	update: function () {

		//	Do some nice funky main menu effect here

	},

	startGame: function (pointer) {

		//	And start the actual game
		this.state.start('Preloader');
	}
};
