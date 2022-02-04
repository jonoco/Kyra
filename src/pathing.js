import 'phaser';

import PF from 'pathfinding'
import { dlog, log } from './utils'
import { enterRoom, onDebug } from './signals';
import { DebugLevel } from './Debug';


export default class Pathing {
    constructor(game) {
        this.game = game
        this.tileSize = (320/120) * window.app.scaleFactor; // native width / tile width
        this.tileX = 120;
        this.tileY = 75;
        this.map;
        this.layer;
        this.grid;
        this.finder;
        this.gridJson;
        this.debugLevel = DebugLevel.off;

        this.createMap()
        this.createGrid()
        
        onDebug.add(this.toggleDebugLevel, this);
        enterRoom.add(this.displayDebugTiles, this);
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
    }


    /**
     * Create pathfinding map
     */
    createMap () {
        this.map = this.game.add.tilemap();
        this.map.tileWidth = this.tileSize;
        this.map.tileHeight = this.tileSize;
        this.map.addTilesetImage('pathing');
        this.layer = this.map.create('layer', this.tileX, this.tileY, this.tileSize, this.tileSize);
    }


    /**
     * Change pathing grid
     * 
     * @param {String} gridName name for new grid
     */
    importGrid(gridName) {
        this.gridJson = this.game.cache.getJSON(gridName);
        this.grid.nodes = this.gridJson;
    }


    toggleDebugLevel(debugLevel) {
        this.debugLevel = debugLevel;
        this.displayDebugTiles()
    }

    /**
     * Toggle debug tiles
     */
    displayDebugTiles() {
        // Clear old debug tiles
        for (let x = 0; x < this.tileX; x++) {
            for (let y = 0; y < this.tileY; y++) {
            this.map.removeTile(x, y, this.layer);
            }
        }

        if (this.debugLevel == DebugLevel.screen) {
            // Make debug tiles
            for (let i = 0; i < this.gridJson.length ; i++) {
                for ( let j = 0 ; j < this.gridJson[i].length ; j++ ) {
                    if (!this.gridJson[i][j].walkable) {
                        let tile = this.map.putTile(0, this.gridJson[i][j].x, this.gridJson[i][j].y, this.layer);
                        tile.alpha = 0.5;``
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

        dlog(`moving from tile { ${startX}, ${startY} } to { ${endX}, ${endY} }`);

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