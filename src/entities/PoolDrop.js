import { copy } from '../utils' 

export default class PoolDrop extends Phaser.Sprite {
    animName = 'pool_splash'

    constructor ({ game, startPos, endPos, duration, delay }) {
        startPos = copy(startPos)
        endPos = copy(endPos)

        startPos.x *= window.game.scaleFactor
        startPos.y *= window.game.scaleFactor
        endPos.x *= window.game.scaleFactor
        endPos.y *= window.game.scaleFactor

        super(game, startPos.x, startPos.y, 'rain_drop')

        this.startPos = startPos
        this.endPos = endPos

        this.name = 'poolDrop'
        this.scale.setTo(window.game.scaleFactor);
        this.duration = duration

        this.anim = new Phaser.Sprite(game, startPos.x, startPos.y, 'pool_splash')
        this.anim.scale.setTo(window.game.scaleFactor)
       
        this.game.physics.arcade.enableBody(this);

        this.tween = this.game.add.tween(this);
        this.tween.onComplete.add(this.onMoveComplete, this);
        this.tween.to(endPos, this.duration)
        this.tween.delay(delay)

        setTimeout(() => this.start(), delay)
        // this.start()
    }

    start () {
        // move down
        this.tween.start()
    }

    onMoveComplete () {
        // play anim
        this.alpha = 0
        this.anim.alpha = 1
        this.anim.x = this.x - ((this.anim.getLocalBounds().width/2 - 1) * window.game.scaleFactor)
        this.anim.y = this.y
        this.anim.play('on')
    }

    onAnimComplete () {
        this.anim.alpha = 0
        this.reset()
    }

    reset () {
        this.x = this.startPos.x
        this.y = this.startPos.y
        this.alpha = 1

        this.start()
    }
}