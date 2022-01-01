# Todo

### To be implemented
- [x] area 1 rooms json data, up to the river cave
- [x] grids for area 1 rooms
- [ ] random item placement generator
- [x] animated player movements
- [x] player movement direction detection
- [x] improved door system; detecting when a tap is meant for a door, and not entering the door otherwise
- [x] refactor everything; everything is currently sitting in the global scope
- [x] add boundary system; to prevent player from moving onto/thru solid objects, e.g., trees, walls
	- this is to prevent the need for a more complex pathfinding system, which will need more exploration
- [x] add sprite animation handling system; certain scenes contain animated areas/objects, e.g., sparkling gems, moving water
- [x] *cough cough* rip animation scenes from source, as well as player animation *cough*
- [x] add text system; item and scenes create text on interaction, entrance
- [ ] add scene event system; first time in certain locations prompt an animated scene, e.g., things moving around and talking
	- complex: step through an animated precedure, or simple: play a video overlayed on the room then disappear
- [x] add quest system; simply marks and tracks when certain events occur
- [x] add scene entrance/ exit sequences; when changing rooms, player should continue to move off screen, then move in from off screen when entering the next room
- [ ] move itemAtlas to json file
- [x] add locational sprite events; clicking on certain sprites or dragging items onto them causes an event
- [x] fade music on music transition
- [x] prevent items from being placed anywhere but inventory and walkable locations
- [ ] make items bounce when you put them somewhere they shouldn't go, *cause why not!*
- [x] add event queueing system
- [x] use original Kyrandia font
- [x] add door animations
- [x] host production build of the game
- [ ] add better condition checking to quest events
- [ ] add 'active' property to sprites to allow or prevent creating them
- [ ] switch assets to native resolution
	+ [x] update screens
	+ [x] update asset coordinates
	+ [x] update tween coordinates
	+ [ ] fix sprites
		- [ ] cliff
		- [ ] rocky outcrop (room17)
	+ [ ] update animations
		- [x] brynn
		- [ ] herman
		- [ ] brandon
		- [ ] bridge
		- [x] pond
	+ [ ] update sprite scaling
- [ ] move brandon's sprite meta to json; animations are being described in *createPlayer*
- [ ] remove outdated/deprecated assets

### Bugs
- [x] tapping on player causes him to disappear
- [x] inventory no longer reacts to items
- [x] player starting in wrong location after room change
- [x] interrupting player during move can cause him to jump to previous move point
- [x] door animations causing room preupdate error
	- Uncaught TypeError: Cannot read property 'preUpdate' of undefined
- [x] quests are not triggering
-	clicking door during door animation causing error
	- Uncaught TypeError: Cannot read property 'parent' of undefined
- [x] willow tree animation is not triggering next event
- [x] items coordinates scaled every time room is loaded
- [x] say and sayAnim events need to be reworked to improve speaking behavior
	- should be compatible with non-primary talking animations, e.g., brynn and her brynn-talk anims
- [x] fix brandon's walk sync
- [ ] crash entering bridge at modAttr
- [x] entities are not instantiating after leaving room
- [ ] willow quest is broken
	- after visiting willow, clicking on pool gives a "no walkable path found" error, and locks player movement

# drops
{ "name": "pool_drop_c", "x": 113, "y": 89 },
