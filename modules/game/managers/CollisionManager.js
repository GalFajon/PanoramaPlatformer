export class CollisionManager {
    constructor() {}

    init (player,platforms,enemies,coins) {
        this.player = player;
        this.platforms = platforms;
        this.enemies = enemies;
        this.coins = coins;
    }

    static checkCollision(a,b) {
        return (
            a.node.translation[0] - a.bbox[0] <= b.node.translation[0] + b.bbox[0] &&
            a.node.translation[0] + a.bbox[0] >= b.node.translation[0] - b.bbox[0] &&
            a.node.translation[1] - a.bbox[2] <= b.node.translation[1] + b.bbox[2] &&
            a.node.translation[1] + a.bbox[2] >= b.node.translation[1] - b.bbox[2] &&
            a.node.translation[2] - a.bbox[1] <= b.node.translation[2] + b.bbox[1] &&
            a.node.translation[2] + a.bbox[1] >= b.node.translation[2] - b.bbox[1]
        );
    }

    update() {
        let ppcol = false;

        for (let platform of this.platforms) {
            if (CollisionManager.checkCollision(this.player,platform) && platform.node.translation[1] < (this.player.node.translation[1] - this.player.bbox[2])) ppcol = true;
        }

        if (this.player.states.CURRENT_STATE != this.player.states.JUMPING) {
            if (ppcol) this.player.setState(this.player.states.STANDING);
            else this.player.setState(this.player.states.FALLING);
        }
    }
}