import Sprite from "./Sprite";


export default class Door extends Sprite {
  entry: Point;
  offPoint: Point;
  animation?: DoorAnimData;

  constructor(
    game: Phaser.Game, 
    x: number, 
    y: number,
    height: number,
    width: number,
    name: string,
    entry: Point,
    offPoint: Point,
    animation?: DoorAnimData
    ) {
    super(game, x * window.game.scaleFactor, y * window.game.scaleFactor);

    this.height = height * window.game.scaleFactor;
    this.width = width * window.game.scaleFactor;
    this.name = name;
    this.entry = {x: entry.x * window.game.scaleFactor, y: entry.y * window.game.scaleFactor};
    this.offPoint = {x: offPoint.x * window.game.scaleFactor, y: offPoint.y * window.game.scaleFactor};
    this.animation = animation;

    this.inputEnabled = true;

    this.events.onInputOver.add(() => {
      game.canvas.style.cursor = "pointer";
    }, this);
    this.events.onInputOut.add(() => {
      game.canvas.style.cursor = "default";
    }, this);
  }


  static parseDoors(game: Phaser.Game, doorsData: DoorData[]) {
    let doors: Door[] = [];

    for (let doorData of doorsData) {
      let { name, x, y, height, width, 
        entry, offPoint, animation } = doorData;
      doors.push(new this(game, x, y, height, width, name, entry, offPoint, animation));
    }

    return doors;
  }
}