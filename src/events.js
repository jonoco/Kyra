export default {
  coal_hanger: [
    { say: "I remember when I was born in that coal basket"},
    { wait: 1000 },
    { say: "Haha, not really though" },
    { say: "I can't remember a thing" },
    { wait: 500 },
    { say: "Probably from inhaling coal dust as a baby" },
  ],
  kallak: [
    { say: "Lookin good old man" },
    { say: "Very stoney" },
    { say: "Like Rocky Balboa" } ],
  bed: [
    { say: "This bed was made from" },
    { say: "the finest horses in Kyrandia" },
    { say: "Like Rocky Balboa" }],
  window: [
    { say: "The forest really is dying" },
    { say: "Like Rocky Balboa" }],
  books: [
    { say: "How To Seduce A Harpy, by Ono Badidia" }],
  cauldron: [
    { addItem: {item: "apple", x: 110, y: 260} },
    { say: "My apple!" },
    { killBlock: 'cauldron' }],
  flowerbox: [
    { say: "These flowers smell wonderful" },
    { say: "Like Rocky Balboa" }],
  treehouseSymbol: [
    { say: "That's grandfather's mark as a magic user" },
    { say: "so those damn kids will stay away" }],
  brynn: [
    { signal: "brynn" }
  ],
  pool: [
    { signal: "pool" }
  ],
  sorrow_rock_glyph: [
    { putSprite: { sprite: "sorrow_rock_glyph", x: 50, y: 50 } },
    { modAttr: { sprite: "saw_holder_empty", attr: "alpha", value: 1 } },
    { moveSprite: { sprite: "sorrow_rock_glyph", path: [[50,5], [50, 50]] }},
    { modAttr: { sprite: "sorrow_rock_glyph", attr: "alpha", value: 0 } },
  ]
}