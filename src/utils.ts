export enum LOG_LEVEL {
  INFO, WARN, ERROR, DEBUG
}


export const centerGameObjects = function (objects) {
  objects.forEach(function (object) {
    object.anchor.setTo(0.5);
  });
}


 /**
  * Centers obj1 onto obj2
  * 
  * @param {Sprite} obj1 first sprite 
  * @param {Sprite} obj2 second sprite
  */
export const moveToCenter = (obj1, obj2) => {
  obj1.x = obj2.x + obj2.width/2 - obj1.width/2;
  obj1.y = obj2.y + obj2.height/2 - obj1.height/2;
}


/**
 * Sprite bounds comparison; checks if obj1 is in the bounds of obj2
 * 
 * @param {Sprite} obj1 first sprite
 * @param {Sprite} obj2 second sprite
 * @returns true if the first sprite is in the bounds of the second
 */
export const inBounds = (obj1, obj2) => {
  let obj = obj1.getBounds();
  let bound = obj2.getBounds();

  log(`bounds check:
  ${obj1.name} bounds: ${obj1.width}: ${obj1.height}
  ${obj2.name} bounds: ${obj2.width}: ${obj2.height}`, 
  LOG_LEVEL.DEBUG)

  return (obj2.x < (obj1.x + obj1.width/2)
    && (obj2.x + obj2.width) > (obj1.x + obj1.width/2) 
    && obj2.y < (obj1.y + obj1.height/2) 
    && (obj2.y + obj2.height) > (obj1.y + obj1.height/2)) 
}


export const log = (msg: string, level: LOG_LEVEL = LOG_LEVEL.INFO) => {
  const timeStyle = `background: #222; color: #666;`;
  const infoStyle = `background: #222; color: #22dd11;`;
  const warnStyle = `background: #222; color: #eeee11;`;
  const errorStyle = `background: #222; color: #ee2211;`;
  const debugStyle = `background: #222; color: #66aaff;`

  const text = `%c${new Date().toLocaleTimeString()} - %c${msg}`;

  switch(level) {
    case LOG_LEVEL.DEBUG: console.debug(text, timeStyle, debugStyle); break;
    case LOG_LEVEL.INFO: console.info(text, timeStyle, infoStyle); break;
    case LOG_LEVEL.WARN: console.warn(text, timeStyle, warnStyle); break;
    case LOG_LEVEL.ERROR: console.error(text,timeStyle, errorStyle); break;
    default:
  }
}


export const dlog = (msg: string) => {
  if (__DEBUG__)
    log(msg, LOG_LEVEL.DEBUG)
}


export const copy = obj => {
  return JSON.parse(JSON.stringify(obj))
}