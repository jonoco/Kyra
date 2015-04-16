#Docs

###Kyra system documentation

####1. Rooms
##### Rooms refer to the different game locations. All room data is stored in **rooms.json.** Every room contains its own background, doors, items, events, scenes, music, etc.
- room changing is handled by checking overlap between the player sprite and the room's door sprites
- door events are only evaluated if openDoor is true, while openDoor is true when the last click was on a door

####2. Scenes
##### Scenes are the animated sequences occuring upon certain events, e.g. entering certain rooms for the first time, clicking on certain sprites
- scenes are not yet implemented

####3. Events
##### Events refer to the behaviors that occur when clicking on, or draggin items onto, certain objects, e.g., clicking the branch next to brandon home, dragging a rose onto Brynn
- events are not yet implemented

####4. Magic
##### Magic are special player events which may trigger scenes in certain rooms
- **magic is not planned to be implemented**

####5. Grid
##### The grid holds all pathing information. It is the interface between the player and the walkable locations array.
- the grid is processed via the Pathfinding.js
- each room's grid is created by the Kyra Mapper utility

####6. Inventory
##### The inventory refers to the inventory group and slotsGroup
- the inventory group holds a reference to each item sprite stored in the inventory
- the slotsGroup represents the interactive region of the inventory
- when items are dragged onto the inventory, the item is checked against the slotsGroup to find which slot of the inventory they hit
- the item is then transferred from the room's itemGroup, and the inventory's inventory group
- if an item already exists at the slot hit, it is placed on the ground, and the new item takes its slot; both items have their groups swapped
