declare let __DEBUG__: boolean;
declare let __DEV__: boolean;

type Layer = 'foreground' | 'midground' | 'background';

interface Point {
  x: number
  y: number
}

interface EntityData {
  name: string
  startPos: Point
  endPos: Point
  duration: number
  layer: Layer
  delay: Phaser.Tween
}

interface RoomData {
  blocks: BlockData[]
  doors: DoorData[]
  entities: EntityData[]
  grid: string
  items: ItemData[]
  music: string
  name: string
  path: string
  sprites: RoomSpriteData[]
  text: string
}

interface RoomSpriteData {
  name: string
  x: number
  y: number
  layer?: Layer
}

interface SpriteData {
  name: string
  png?: string
  json?: string
  action?: SpriteActionData
  animated: boolean
  animations?: any
  invisible?: boolean
  reverse?: boolean
  startFrame?: string
}

interface SpriteActionData {
  click: { text: string }
}

interface DoorAnimData {
  enter: string 
  exit: string
}

interface DoorData {
  name: string
  x: number
  y: number
  height: number
  width: number
  entry: Point
  offPoint: Point
  animation?: DoorAnimData
}

interface ItemData {
  name: string 
  x: number 
  y: number
}

interface BlockData {
  name: string
  x: number
  y: number
  height: number
  width: number
}
