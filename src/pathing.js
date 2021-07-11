import PF from 'pathfinding'
import { dlog, log } from './utils'

export default class Pathing {
    constructor(game) {
        this.game = game
        this.tileSize = (320/120) * window.game.scaleFactor; // native width / tile width
        this.tileX = 120;
        this.tileY = 75;
        this.map;
        this.layer;
        this.grid;
        this.finder;

        this.createMap()
        this.createGrid()
    }

    /**
     * Create pathing grid
     */
    createGrid () {
        this.grid = new PF.Grid(this.tileX, this.tileY);
        this.finder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        });

        if (this.game.debugOn) {
            dlog('map debugging on')
            this.map.addTilesetImage('pathing');
        }
    }


    /**
     * Create pathfinding map
     */
    createMap () {
        this.map = this.game.add.tilemap();
        this.map.tileWidth = this.tileSize;
        this.map.tileHeight = this.tileSize;

        this.layer = this.map.create('layer', this.tileX, this.tileY, this.tileSize, this.tileSize);
    }


    /**
     * Change pathing grid
     * 
     * @param {String} roomName room name for new grid
     */
    importGrid(roomName) {

        let roomJson = roomName + '_json';
        let gridJson = this.game.cache.getJSON(roomJson);
        this.grid.nodes = gridJson;

        if (this.game.debugOn) {
            // Clear old debug tiles
            for (let x = 0; x < this.tileX; x++) {
                for (let y = 0; y < this.tileY; y++) {
                this.map.removeTile(x, y, this.layer);
                }
            }

            // Make debug tiles
            for (let i = 0; i < gridJson.length ; i++) {
                for ( let j = 0 ; j < gridJson[i].length ; j++ ) {
                    if (!gridJson[i][j].walkable) {
                        let tile = this.map.putTile(0, gridJson[i][j].x, gridJson[i][j].y, this.layer);
                        tile.alpha = 0.5;
                    }
                }
            }
        }
    }


    /**
     * Tries to find a route in the pathfinding grid from a starting point
     * 
     * @param {Position} startPos starting position
     * @param {Position} endPos ending position
     * @returns grid path for tweening sprite
     */
    findWay (startPos, endPos) {
        let startX = this.layer.getTileX(startPos.x);
        let startY = this.layer.getTileY(startPos.y);
        let endX = this.layer.getTileX(endPos.x);
        let endY = this.layer.getTileY(endPos.y);

        dlog(`moving from tile { ${startX},${startY} } to { ${endX}, ${endY} }`);

        if (endX > this.tileX || endX < 0 || endY > this.tileY || endY < 0) {
            log(`cannot move to tile { ${endX}, ${endY} }`)
            return
        }

        if (startX != endX || startY != endY) {

            let grid = this.grid.clone();
            let path = this.finder.findPath(startX, startY, endX, endY, grid);

            // Check if walkable path found
            if (path.length == 0) {
                dlog(`no walkable path found`)
                return;
            }

            return PF.Util.smoothenPath(this.grid, path);
        }
    }
} 