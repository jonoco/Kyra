export const centerGameObjects = function (objects) {
  objects.forEach(function (object) {
    object.anchor.setTo(0.5);
  });
}
