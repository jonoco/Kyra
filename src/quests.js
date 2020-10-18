import Phaser from 'phaser';


export default class Quests {
  constructor() {
    this.quests = quests
    this.triggers = triggers
  }

  // Update quest status and return event chain
  updateQuest (quest) {
    var conditionsMet = true
    var stepComplete = this.quests[quest.name][quest.step]
    var active = ( quest.step == 'active' || this.quests[quest.name]['active'] )

    for (var condition in quest.conditions) {

      if (this.quests[quest.name][condition] != quest.conditions[condition]) {
        conditionsMet = false
      }
    }

    // only update if activating quest or quest activated
    if ( active && !stepComplete && conditionsMet ) {
      if (__DEBUG__) console.log('all conditions met for quest ' + quest.name)
      this.quests[quest.name][quest.step] = true

      const events = this.quests[quest.name].events[quest.step]
      return events
    }
  }
}


/*
  * current available event commands:
  * say, wait, turn, togAnim, modAttr, modMeta, playAnim, addItem,
  *  removeItem, move, signal, altRoom, killSprite, killBlock, sayAnim
  *
  * say: [string, sprite, color] - create speech text for any current sprite by cache key
  *   also results in playing 'talk' animation of sprite, if exists
  * modAttr: [sprite, attr, value] - modify attribute of any current sprite or image object
  * modMeta: [sprite, attr, value] - change sprite meta data
  * playAnim: [sprite, animation, kill] - play animation of current sprite objects
  * togAnim: [sprite, animation, start] - toggle animation state of any sprite meta
  * addItem: [item, x, y] - add new item to current room
  * removeItem: [item] - removes one instance of item from current room
  * signal: [string] - directly call evalEvent to trigger another quest event
  * altRoom: [true] - change current room's texture to alternate
  * sayAnim: [sprite, animation, kill, say, color] - play animation with text
  * moveSprite [sprite, path] - tween sprites
  * modRoomMeta [room, attr, door, value]
  *
  * see exeEvent for handling
  */
const quests = {
  willow: {
    active: false,
    complete: false,
    gotTear: false,
    treeHealed: false,
    events : {
      active: [
        { say: "Even the willow tree is dying" },
        { wait: 100 },
        { say: "What's going on around here?!" }
      ],
      gotTear: [
        { say: "I bet I could catch a tear drop" },
        { wait: 1300 },
        { say: "I'll take that bet!" },
        { move: { x: 612, y: 264 } },
        { playAnim: { sprite: "catch", animation: "on", kill: true } },
        { addItem: {item: "tear", x: 570, y: 290} },
        { say: "Now i can heal the willow tree!" }
      ],
      treeHealed: [
        { removeItem: "tear" },
        { move: { x: 384, y: 344 } },
        { say: "I think this tear drop should fit" },
        { playAnim: { sprite: "willow", animation: "on", hide: false } },
        { altRoom: "room03" },
        { wait: 300 },
        { modAttr: { sprite: "player", attr: "alpha", value: 0 } },
        { sayAnim: { sprite: "brandon wow", animation: "on", kill: true, say: "wow!" } },
        { wait: 1500 },
        { modAttr: { sprite: "player", attr: "alpha", value: 1 } },
      ]
    }
  },
  brynn: {
    active: false,
    amulet: false,
    events: {
      active: [
        { wait: 4000 },
        { modAttr: { sprite: "brynn enter", attr: "alpha", value: 0 } },
        { sayAnim: { sprite: "brynn", animation: "talk", say: "Welcome, Brandon", color: "brynn" } },
        { wait: 300 },
        { playAnim: { sprite: "brynn", animation: "idle" } },
        { modAttr: { sprite: "altar", attr: "inputEnabled", value: true } }
      ],
      amulet: [
        { playAnim: { sprite: "amulet", animation: "on" } },
        { modAttr: { sprite: "altar", attr: "alha", value: 1 } },
        { say: "I can feel the power!!" }
      ]
    }
  },
  bridge: {
    active: true,
    cave: false,
    saw: false,
    giveSaw: false,
    fixed: false,
    complete: false,
    events: {
      cave: [
        { modAttr: { sprite: "herman", attr: "alpha", value: 1 } },
        { playAnim: { sprite: "herman", animation: "stand up" } },
        { sayAnim: { sprite: "herman", animation: "stand talk 1", say: "It's not my fault", color: "herman" } },
        { playAnim: { sprite: "herman", animation: "hunch down" } }
      ],
      giveSaw: [
        { removeItem: "saw" },
        { move: { x: 770, y: 280 }},
        { playAnim: { sprite: "herman", animation: "stand up" } },
        { sayAnim: { sprite: "herman", animation: "stand talk 3", say: "That's a pretty old saw", color: "herman" } },
        { playAnim: { sprite: "herman", animation: "stand idle" } },
        { say: "Oh, this is just a stiff old sock" },
        { say: "But it could probably cut down a tree now" },
        { wait: 1200 },
        { sayAnim: { sprite: "herman", animation: "stand talk 3", say: "Uh, yeah ...", color: "herman" } },
        { sayAnim: { sprite: "herman", animation: "stand talk 1", say: "Well, I'll go cut down some trees then", color: "herman" } },
        { moveSprite: { sprite: "herman", path: [[730/8,220/8], [950/8, 220/8]], animation: "walk" } },
        { turn: "right" },
        { wait: 900 },
        { say: "I hope he doesn't cut his leg off" },
        { togAnim: { sprite: "herman sawing", animation: "saw", start: true } }
      ],
      saw: [
        { say: "Grandfather's saw" },
        { killSprite: "saw_holder" },
        { modMeta: { sprite: "saw_holder_empty", attr: "invisible", value: false } },
        { modAttr: { sprite: "saw_holder", attr: "alpha", value: 0 } },
        { modAttr: { sprite: "saw_holder_empty", attr: "alpha", value: 1 } },
        { addItem: {item: "saw", x: 750, y: 340} }
      ],
      fixed: [
        { say: "I wonder if the bridge is fixed..." },
        { altRoom: "room19" },
        { modMeta: { sprite: "cut tree", attr: "invisible", value: false } },
        { modMeta: { sprite: "herman sawing", attr: "invisible", value: true } },
        { modAttr: { sprite: "herman sawing", attr: "inputEnabled", value: false } }
      ],
      complete: [
        { say: "The bridge is repaired!" },
        { move: { x: 760, y: 300 }},
        { say: "But where did Herman go? ..." },
        { wait: 1000 },
        { quit: true }
      ]
    }
  }
}


// eventTriggers links events to quests
// if a room is an event, it's triggered upon entering
// all <conditions> must be true for <step> to occur
// { name: "quest", step: "step", condition: "step" }
const triggers = {
  pool: [{ name: "willow", step: "gotTear", conditions: { active: true } }],
  room03: [{ name: "willow", step: "active", conditions: { active: false } }],
  "willow-tear": [{ name: "willow", step: "treeHealed", conditions: { gotTear: true } }],
  room06: [{ name: "brynn", step: "active", conditions: { active: false } }],
  altar: [{ name: "brynn", step: "amulet" }],
  room19: [
    { name: "bridge", step: "cave", conditions: { active: true }},
    { name: "bridge", step: "complete", conditions: { fixed: true }}],
  "saw_holder": [{ name: "bridge", step: "saw" }],
  "herman-saw": [{ name: "bridge", step: "giveSaw" }],
  room02: [{ name: "bridge", step: "fixed", conditions: { giveSaw: true } }]
}