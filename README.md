# Kyra

### Kyra is a Kyrandia Javascript remake using the Phaser framework

[Kyrandia](http://en.wikipedia.org/wiki/The_Legend_of_Kyrandia) is a point-and-click adventure game made by Westwood Studios in 1992.

This project is an attempt to recreate the game to the extent of the original Kyrandia demo game, which ends just after crossing the rickety bridge. This requires nearly all game mechanics to be functioning, while reducing the burden of cleaning/redrawing 85% of the games original art assets.

This project also uses the original Roland MT-32 soundtrack, rather than the commonly heard Adlib version.

[Hosted here on github page](http://jonoco.github.io/Kyra/)

### Version changes

#### v0.2.0
- second project milestone reached
	- completing the bridge quest acts as game end point
-	heal the willow quest added
- repair the bridge quest finished
- more event types added
- more assets added
- updated animation handling
- end game point added
	- after repairing the bridge and entering the cave again, the game will kick the player back out to the menu

#### v0.1.5
- item handling system updated
- quest event system updated
	- quest conditionals added to allow more dynamic control over events
	- more event types added
- more assets added
- music changed to Roland MT-32 score
- item dragging event handling added

#### v0.1.4
-	door animations in and functioning
	- door animations handled by labeling one of the room's sprites as enter or exit animation
- quest event system added
	- uses quest events to trigger quest related events, e.g. animations, sprite creation, text
	- more quest event types added
- more assets added
- some code refactored and rewritten for clarity
- some bug fixes

#### v0.1.3
- sprites and sprite animations are in
- quest system being implemented
	- quest event triggering now capable of intercepting a variety of events to trigger quest conditions
- sprite reactions to input are in
	- clicking on sprites may triggers events, e.g., brandon talking about the object, quest events, animations
- event queuing now possible
	- events comprising of multiple distinct events (talking, animations, tweening) can be queued together to run
- original Kyrandia font added, made by [kanoalgiz](http://fontstruct.com/fontstructors/1099009/kanoalgiz)
- rough door animation handling is in
	- certain doors do not transition room by on/off tweening, and rather use a sprite animation in place, e.g., brandon's house branch animation

#### v0.1.2
- entering/exiting tweening system is in 
	- player is tweened on and off screen during room changes
	- each door will contain it's entrance/exit blocking and animation cues
- doors are better at detecting when player is interacting with them (betterer yet?)
- click inputs are more defined and better controlled; no global input filtering, each interactive body will manage it’s own input
-	room entering, exiting is smoother

#### v0.1.1
- player animations are in
- inventory system working
- all area 1 rooms are in
- some bug fixes

#### v0.1.0
-	first playable, event driven build
- pathfinding is in; 
	- this is possible by the great pathfinding library [PathFinding.js](https://github.com/qiao/PathFinding.js)
	- creating pathing for each room is done using the new [Kyra Mapper](https://github.com/jonoco/Kyra-Mapper) utility; this allows anyone to *somewhat* easily overlay an image with walkable and non-walkable areas
- door detection has improved; 
	- doors are no longer trigged by simply walking into them; the last click must be onto a door for the door to be triggered; on a desktop, the door mouseover will be indicated by a hand icon
- game has been refactored to the Phaser bootstrap setup