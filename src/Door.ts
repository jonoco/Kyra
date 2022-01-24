import KSprite from "./KSprite";


export default class Door extends KSprite {
  open: boolean = false;
  entry: Point;
  offPoint: Point;
  animation?: DoorAnimData;

  constructor(game: Phaser.Game, x: number, y: number, name: string, debugColor: number) {
    super(game, x, y, null, debugColor);
    
    this.name = name;
  }


  static of(
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
    let door = new this(
      game, 
      x * window.app.scaleFactor, 
      y * window.app.scaleFactor, 
      name,
      0x5555ff)

    door.height = height * window.app.scaleFactor;
    door.width = width * window.app.scaleFactor;
    door.entry = {x: entry.x, y: entry.y};
    door.offPoint = {x: offPoint.x, y: offPoint.y};
    door.animation = animation;

    door.inputEnabled = true;

    door.events.onInputOver.add(() => {
      game.canvas.style.cursor = "pointer";
    }, game);
    door.events.onInputOut.add(() => {
      game.canvas.style.cursor = "default";
    }, game);

    return door
  }

  static parseDoors(game: Phaser.Game, doorsData: DoorData[]) {
    let doors: Door[] = [];

    for (let doorData of doorsData) {
      let { name, x, y, height, width, 
        entry, offPoint, animation } = doorData;
      doors.push(Door.of(game, x, y, height, width, name, entry, offPoint, animation));
    }

    return doors;
  }
}