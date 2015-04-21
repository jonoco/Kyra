#Kyra

###Kyra is a Kyrandia Javascript remake using the Phaser framework

Further project description coming soon...

###Version changes

####v0.1.3-alpha
- sprites and sprite animations are in
- quest system being implemented
- sprite reactions to input are in
	- clicking on sprites may triggers events, e.g., brandon talking about the object, quest events, animations

####v0.1.2
- entering/exiting tweening system is in 
	- player is tweened on and off screen during room changes
	- each door will contain it's entrance/exit blocking and animation cues
- doors are better at detecting when player is interacting with them (betterer yet?)
- click inputs are more defined and better controlled; no global input filtering, each interactive body will manage it’s own input
-	room entering, exiting is smoother

####v0.1.1
- player animations are in
- inventory system working
- all area 1 rooms are in
- some bug fixes

####v0.1.0
- pathfinding is in; 
	- this is possible by the great pathfinding library [PathFinding.js](https://github.com/qiao/PathFinding.js)
	- creating pathing for each room is done using the new [Kyra Mapper](https://github.com/jonoco/Kyra-Mapper) utility; this allows anyone to *somewhat* easily overlay an image with walkable and non-walkable areas
- door detection has improved; 
	- doors are no longer trigged by simply walking into them; the last click must be onto a door for the door to be triggered; on a desktop, the door mouseover will be indicated by a hand icon
- game has been refactored to the Phaser bootstrap setup