import { Graphics } from "phaser-ce";
import { onDebug } from "./signals";
import { dlog } from "./utils";


export default class Door extends Phaser.Sprite {
  open: boolean = false;
  entry: Point;
  offPoint: Point;
  animation?: DoorAnimData;
  debugBlock: Phaser.Graphics;
  debugText: Phaser.Text;
  debugColor: number = 0x5555ff;

  constructor(game: Phaser.Game, x: number, y: number, name: string) {
    super(game, x, y, null);

    this.name = name;

    this.initDebug()
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
    let door = new this(game, x * window.app.scaleFactor, y * window.app.scaleFactor, name)

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


  initDebug() {
    this.debugBlock = this.game.make.graphics();
    this.debugBlock.beginFill(this.debugColor, 0.5);
    this.debugBlock.drawRect(0, 0, this.width, this.height);
    this.debugBlock.endFill();
    this.addChild(this.debugBlock);

    this.debugText = new Phaser.Text(this.game, 0, 0, this.name, { fontSize: 8, fontWeight: 'normal' })
    this.addChild(this.debugText)

    onDebug.add(this.debugSprite, this);
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


  debugSprite(debugOn: boolean) {
    this.debugBlock.visible = debugOn
    this.debugText.visible = debugOn
  }
}