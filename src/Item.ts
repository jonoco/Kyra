import 'phaser';

import itemAtlas from './items'


export default class Item extends Phaser.Image {
    name: string;

    constructor(
        game: Phaser.Game,
        name: string,
        x: number,
        y: number
        ) {
        super(game, x, y, 'items', itemAtlas[name]);

        this.name = name;
    }


    static parseItems(game: Phaser.Game, itemsData: ItemData[]) {
        let items: Item[] = [];

        for (let itemData of itemsData) {
            let {name, x, y} = itemData;
            items.push(new this(game, name, x, y));
        }

        return items;
    }
}