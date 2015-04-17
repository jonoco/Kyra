#Todo

###To be implemented
- **ADDED:** area 1 rooms json data, up to the river cave
- **ADDED:** grids for area 1 rooms
- random item placement generator
- **ADDED:** animated player movements
- **ADDED:** player movement direction detection
- scene system
- **ADDED:** improved door system; detecting when a tap is meant for a door, and not entering the door otherwise
- **ADDED:** refactor everything; everything is currently sitting in the global scope
- **ADDED:** add boundary system; to prevent player from moving onto/thru solid objects, e.g., trees, walls
	- this is to prevent the need for a more complex pathfinding system, which will need more exploration
- add animation handling system; certain scenes contain animated areas/objects, e.g., sparkling gems, moving water
- *cough cough* rip animation scenes from source, as well as player animation *cough*
- add text system; item and scenes create text on interaction, entrance
- add scene event system; first time in certain locations prompt an animated scene, e.g., things moving around and talking
	- complex: step through an animated precedure, or simple: play a video overlayed on the room then disappear
- add quest system; simply marks and tracks when certain events occur
- add scene entrance/ exit sequences; when changing rooms, player should continue to move off screen, then move in from off screen when entering the next room
- move itemAtlas to json file
- add magic system
- add locational sprite events; clicking on certain sprites or dragging items onto them causes an event

###Bugs
- **FIXED:** tapping on player causes him to disappear
- **FIXED:** inventory no longer reacts to items
- player starting in wrong location after room change
- interrupting player during move can cause him to jump to previous move point