import 'phaser';

import itemAtlas from './items'

export default class Item extends Phaser.Image {
    name: string;

    constructor(
        name: string,
        game: Phaser.Game,
        x: number,
        y: number
        ) {
        super(game, x, y, 'items', itemAtlas[name]);

        this.name = name;
    }
}