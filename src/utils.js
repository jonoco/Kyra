export const centerGameObjects = function (objects) {
  objects.forEach(function (object) {
    object.anchor.setTo(0.5);
  });
}

export const log = msg => {
  console.log(msg)
}

export const dlog = msg => {
  if (__DEBUG__) {
    log(msg)
  }
}