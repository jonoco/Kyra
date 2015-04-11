# Kyra

###Kyra is a Kyrandia Javascript remake using the Phaser framework

####Todo:
  - refactor everything; everything is currently sitting in the global scope
  - add boundary system; to prevent player from moving onto/thru solid objects, e.g., trees, walls
    - this is to prevent the need for a more complex pathfinding system, which will need more exploration   
  - add animation handling system; certain scenes contain animated areas/objects, e.g., sparkling gems, moving water
  - *cough cough* rip animation scenes from source, as well as player animation *cough*
  - add text system; item and scenes create text on interaction, entrance
  - add scene event system; first time in certain locations prompt an animated scene, e.g., things moving around and talking
    - complex: step through an animated precedure, or simple: play a video overlayed on the room then disappear
  - add quest system; simply marks and tracks when certain events occur
  - add scene entrance/ exit sequences; when changing rooms, player should continue to move off screen, then move in from off screen when entering the next room
