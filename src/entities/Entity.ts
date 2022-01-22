import Sprite from '../Sprite'
import PoolDrop from './PoolDrop';


export default class Entity extends Sprite {
  static parseEntities(game: Phaser.Game, entitiesData: EntityData[]) {
    let entities: Entity[] = []

    for (let entityData of entitiesData) {
      let {name, startPos, endPos, duration, layer, delay} = entityData;

      switch (name) {
        case 'poolDrop':
          entities.push(new PoolDrop({game, ...entityData}));
          break;
        default:
          throw Error(`Could not parse entity: ${name}`);
      }
    }

    return entities;
  }
}