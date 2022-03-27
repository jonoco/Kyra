import 'phaser'


export default class extends Phaser.State {
  fontsReady: boolean;
  kyrandiaFont: any;

  init() {
    this.stage.backgroundColor = '#EDEEC9'
    this.fontsReady = false
    this.fontsLoaded = this.fontsLoaded.bind(this)

    if (__DEBUG__) console.log("DEBUG ON");
    if (__DEV__) console.log("DEV ON");
  }

  preload() {
    this.kyrandiaFont = this.add.text()
    this.kyrandiaFont.font = 'kyrandia'

    let text = this.add.text(
      this.world.centerX,
      this.world.centerY,
      'loading fonts',
      { font: '16px Arial', fill: '#dddddd', align: 'center' }
    )
    text.anchor.setTo(0.5, 0.5)

    this.load.image('preloaderBackground', 'assets/img/title.png');
  }

  render() {
    this.state.start('Preloader')
  }

  fontsLoaded() {
    this.fontsReady = true
  }
}
