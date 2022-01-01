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

  return (bound.x < obj.centerX 
    && (bound.x + bound.width) > obj.centerX 
    && bound.y < obj.centerY 
    && (bound.y + bound.height) > obj.centerY) 
}


export const log = msg => {
  console.log(msg)
}


export const dlog = msg => {
  if (__DEBUG__) {
    log(msg)
  }
}


export const copy = obj => {
  return JSON.parse(JSON.stringify(obj))
}