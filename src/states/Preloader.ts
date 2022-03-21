import 'phaser'
import { centerGameObjects } from '../utils'

export default class extends Phaser.State {
  ready: boolean;
  loaderBg: Phaser.Sprite;
  message: Phaser.Text;

  init () {
    this.ready = false
  }


  preload () {
    this.loaderBg = this.add.sprite(
      this.game.world.centerX,
      this.game.world.centerY,
      'preloaderBackground'
    )
    this.loaderBg.scale.setTo(window.app.scaleFactor)

    this.message = this.add.text()
    this.message.x = this.game.world.centerX
    this.message.y = 420
    this.message.font = 'kyrandia'
    this.message.fontSize = 30
    this.message.fill = '#eeeeee'
    this.message.stroke = '#000000'
    this.message.strokeThickness = 3
    this.message.text = "loading ..."

    centerGameObjects([this.loaderBg, this.message])

    // Load assets

    this.load.atlasJSONArray('fairy', 'assets/sprites/fairy.png', 'assets/sprites/fairy.json')

    this.load.image('titlepage', 'assets/img/title.png')
    this.load.image('gui', 'assets/img/gui.png')
    this.load.image('pathing', 'assets/tiles/pathing.png')
    this.load.image('room03-alt', 'assets/screens/willow_healed.png')
    this.load.image('room19-alt', 'assets/screens/room19-alt.png')
    this.load.image('end', 'assets/img/malcolm_blob.png')

    this.load.json('rooms', 'assets/json/rooms.json')
    this.load.json('music', 'assets/json/music.json')
    this.load.json('sprites', 'assets/json/sprites.json')
    this.load.json('events', 'assets/json/events.json')
    this.load.json('quests', 'assets/json/quests.json')

    this.load.spritesheet('items', 'assets/img/item_sheet.png', 32, 32)

    this.load.onFileComplete.add(function(progress, key) {

      this.message.text = 'loading ' + key

      if (key == 'rooms') {
        this.loadRoomData()
      } else if (key == 'music') {
        this.loadAudio()
      } else if (key == 'sprites') {
        this.loadSprites()
      }

      if (progress == 100) {
        console.log('preload complete')
        this.ready = true
      }

    }, this)
  }


  // Wait for asset loading to complete
  update () {
    if (this.ready) {
      this.state.start('Game')
    }
  }


  // Static and animated sprites
  loadSprites () {
    const sprites = this.cache.getJSON('sprites')['sprites']

    for (const spriteData of sprites) {
      // Sprite has json information
      if (spriteData.json) {
        this.load.atlasJSONArray(spriteData.name, spriteData.png, spriteData.json)
      // Simple sprite
      } else {
        this.load.image(spriteData.name, spriteData.png)
      }
    }
  }


  // Room positioning, pathing, animations, etc.
  loadRoomData () {
    let rooms: RoomData[] = this.cache.getJSON('rooms')['rooms']

    for (const room of rooms) {
      this.load.image(room.path, room.path)

      if (room.alt && room.alt.path) 
        this.load.image(room.alt.path, room.alt.path)

      if (room.grid)
        this.loadGrid(room)
    }
  }


  // Load audio assets
  loadAudio () {
    var music = this.cache.getJSON('music')

    for (const [track, value] of Object.entries(music)) {
      this.load.audio(music[track].name, music[track].path)
    }
  }


  // Pathfinding grids
  loadGrid (room) {
    this.load.json(room.grid, room.grid)

    if (room.alt && room.alt.grid) {
      this.load.json(room.alt.grid, room.alt.grid)
    }
  }
}
