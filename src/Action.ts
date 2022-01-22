export enum ActionType {
    addItem,
    altRoom,
    killBlock,
    killSprite,
    modAttr,
    modMeta,
    modRoomMeta,
    move,
    moveSprite,
    playAnim,
    putSprite,
    quit,
    removeItem,
    say,
    sayAnim,
    signal,
    togAnim,
    turn,
    wait,
}

export const parseAction = (type: string, value: object | string | number): Action => {
    switch(ActionType[type]) {
        case ActionType.addItem:    return AddItemAction.of(type, value);
        case ActionType.altRoom:    return AltRoomAction.of(type, value);
        case ActionType.killBlock:  return KillBlockAction.of(type, value);
        case ActionType.killSprite: return KillSpriteAction.of(type, value);
        case ActionType.modAttr:    return ModAttrAction.of(type, value);
        case ActionType.modMeta:    return ModMetaAction.of(type, value);
        case ActionType.modRoomMeta:return ModRoomMetaAction.of(type, value);
        case ActionType.move:       return MoveAction.of(type, value);
        case ActionType.moveSprite: return MoveSpriteAction.of(type, value);
        case ActionType.playAnim:   return PlayAnimAction.of(type, value);
        case ActionType.putSprite:  return PutSpriteAction.of(type, value);
        case ActionType.quit:       return QuitAction.of(type, value);
        case ActionType.removeItem: return RemoveItemAction.of(type, value);
        case ActionType.say:        return SayAction.of(type, value);
        case ActionType.sayAnim:    return SayAnimAction.of(type, value);
        case ActionType.signal:     return SignalAction.of(type, value);
        case ActionType.togAnim:    return TogAnimAction.of(type, value);
        case ActionType.turn:       return TurnAction.of(type, value);
        case ActionType.wait:       return WaitAction.of(type, value);
        default: 
            throw new Error(`Error: could not parse action of type ${type} with value ${value}`)
    }
}

export const parseActions = (rawActions: any[]): Action[] => {
    let actions: Action[] = []
    
    for (let rawAction of rawActions) {
        console.log(rawAction)
        
        actions.push(parseAction(rawAction.type, rawAction.value))
    }

    return actions
}

export class Action {
    type: ActionType;

    constructor(type: string, value = null) {
        this.type = ActionType[type];
    }

    getType() {
        return ActionType[this.type]
    }

    static of(type: string, value: object | string | number) {
        return new this(type, value)
    }
}

export class AddItemAction extends Action {
    item: string;
    x: number;
    y: number;

    constructor(
        type: string, 
        { item, x, y }: 
        { item: string, x: number, y: number }
    ) {
        super(type);
        this.item = item;
        this.x = x;
        this.y = y;
    }
}

export class AltRoomAction extends Action {
    roomName: string

    constructor(type: string, roomName: string) {
        super(type)
        this.roomName = roomName
    }
}

export class KillBlockAction extends Action {
    block: string;
    
    constructor(type: string, { block }: { block: string }) {
        super(type);
        this.block = block;
    }
}

export class KillSpriteAction extends Action {
    sprite: string;
    
    constructor(type: string, { sprite }: { sprite: string }) {
        super(type);
        this.sprite = sprite;
    }
}

export class ModAttrAction extends Action {
    sprite: string;
    attr: string;
    value: any;
    
    constructor(
        type: string, 
        { sprite, attr, value }: 
        { sprite: string, attr: string, value: any }
    ) {
        super(type);
        this.sprite = sprite;
        this.attr = attr;
        this.value = value;
    }
}

export class ModMetaAction extends Action {
    sprite: string;
    attr: string;
    value: any;
    
    constructor(
        type: string, 
        { sprite, attr, value }: 
        { sprite: string, attr: string, value: any }
    ) {
        super(type);
        this.sprite = sprite;
        this.attr = attr;
        this.value = value;
    }
}

export class ModRoomMetaAction extends Action {
    room: string;
    attr: string;
    value: any;
    door: string;
    
    constructor(
        type: string, 
        { room, attr, value, door }: 
        { room: string, attr: string, value: any, door: string }
    ) {
        super(type);
        this.room = room;
        this.attr = attr;
        this.value = value;
        this.door = door;
    }
}

export class MoveAction extends Action {
    x: number;
    y: number;
    
    constructor(
        type: string, 
        { x, y }: 
        { x: number, y: number }
    ) {
        super(type);
        this.x = x;
        this.y = y;
    }    
}

export class MoveSpriteAction extends Action {
    sprite: string;
    path: Array<Array<number>>
    animName: string
    
    constructor(
        type: string, 
        { sprite, path, animName }: 
        { sprite: string, path: Array<Array<number>>, animName: string }
    ) {
        super(type);
        this.sprite = sprite;
        this.path = path;
        this.animName = animName;
    }    
}

export class PlayAnimAction extends Action {
    sprite: string;
    animName: string;
    kill: boolean;
    hide: boolean;

    constructor(
        type: string, 
        { sprite, animName, kill = false, hide = false }: 
        { sprite: string, animName: string, kill: boolean, hide: boolean }
    ) {
        super(type);
        this.sprite = sprite;
        this.animName = animName;
        this.kill = kill;
        this.hide = hide;
    }
}

/** Spawn new sprite instance at a location */
export class PutSpriteAction extends Action {
    sprite: string;
    x: number;
    y: number;
    layer: Layer;

    constructor(
        type: string, 
        { sprite, x, y, layer }: 
        { sprite: string, x: number, y: number, layer: Layer }
    ) {
        super(type);
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.layer = layer;
    }
}

export class QuitAction extends Action {

}

export class RemoveItemAction extends Action {
    item: string;

    constructor(
        type: string, 
        { item }:
        { item: string }
    ) {
        super(type);
        this.item = item;
    }
}

export class SayAction extends Action {
    text: string;
    sprite: string;
    color: string;

    constructor(
        type: string, 
        { text, sprite = 'player', color = 'player' }:
        { text: string, sprite: string, color: string }
    ) {
        super(type);
        this.text = text;
        this.sprite = sprite;
        this.color = color;
    }
}

export class SayAnimAction extends Action {
    sprite: string;
    animName: string;
    kill: boolean;
    hide: boolean;
    text: string;
    color: string;

    constructor(
        type: string, 
        { sprite, animName, kill, hide, text, color, }:
        { sprite: string, animName: string, kill: boolean, 
            hide: boolean, text: string, color: string }
    ) {
        super(type);
        this.sprite = sprite 
        this.animName = animName 
        this.kill = kill 
        this.hide = hide
        this.text = text
        this.color = color
    }
}

export class SignalAction extends Action {
    signal: string;

    constructor(type: string, signal: string ) {
        super(type);
        this.signal = signal;
    }
}

export class TogAnimAction extends Action {
    sprite: string;
    animName: string;
    start: boolean;

    constructor(
        type: string, 
        { sprite, animName, start }:
        { sprite: string, animName: string, start: boolean }
    ) {
        super(type);
        this.sprite = sprite 
        this.animName = animName 
        this.start = start
    }
}

export class TurnAction extends Action {
    direction: 'left' | 'right'

    constructor(
        type: string, 
        { direction }:
        { direction: 'left' | 'right' }
    ) {
        super(type);
        this.direction = direction
    }
}

export class WaitAction extends Action {
    duration: number;

    constructor(type: string, duration: number) {
        super(type);
        this.duration = duration;
    }
}

