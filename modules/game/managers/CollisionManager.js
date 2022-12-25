export class CollisionManager {
    constructor(game) {
        this.game = game;
        this.shouldUpdate = true;
    }

    init (player,platforms,enemies,coins,levelGates) {
        this.player = player;
        this.platforms = platforms;
        this.enemies = enemies;
        this.coins = coins;
        this.levelGates = levelGates;
    }

    static checkCollision(a,b) {
        return (
            a.node.translation[0] - a.node.scale[0] <= b.node.translation[0] + b.node.scale[0] &&
            a.node.translation[0] + a.node.scale[0] >= b.node.translation[0] - b.node.scale[0] &&
            a.node.translation[1] - a.node.scale[1] <= b.node.translation[1] + b.node.scale[1] &&
            a.node.translation[1] + a.node.scale[1] >= b.node.translation[1] - b.node.scale[1] &&
            a.node.translation[2] - a.node.scale[2] <= b.node.translation[2] + b.node.scale[2] &&
            a.node.translation[2] + a.node.scale[2] >= b.node.translation[2] - b.node.scale[2]
        );
    }

    update() {
        let ppcol = false;

        for (let platform of this.platforms) {
            if (CollisionManager.checkCollision(this.player,platform) && platform.node.translation[1] < (this.player.node.translation[1] - this.player.node.scale[2])) ppcol = true;
        }

        if (this.player.states.CURRENT_STATE != this.player.states.JUMPING) {
            if (ppcol) this.player.setState(this.player.states.STANDING);
            else this.player.setState(this.player.states.FALLING);
        }
        
        for (let coin of this.coins) {
            if (CollisionManager.checkCollision(this.player,coin)) {
                this.game.scene.removeNode(coin.node);
                this.coins.splice(this.coins.indexOf(coin),1);
                this.game.state.collected += 1;
            }
        }

        for (let enemy of this.enemies) {
            if (CollisionManager.checkCollision(this.player,enemy)) {
                if ((enemy.node.translation[1] + enemy.node.scale[1]*0.9) < (this.player.node.translation[1] - this.player.node.scale[1])) {
                    this.player.jumpTimer = this.player.jumpTime * 0.4; 
                    this.player.setState(this.player.states.JUMPING);
                    enemy.health--;

                    if (enemy.health == 0) {
                        this.game.scene.removeNode(enemy.node);
                        this.enemies.splice(this.enemies.indexOf(enemy),1);
                    }
                }
                else {
                    if (this.player.timeSinceLastHurt > 1) {
                        this.player.health--;
                        this.player.timeSinceLastHurt = 0;
                        if (this.player.health == 0) alert("game over");
                    }
                }
            }
        }

        for (let levelGate of this.levelGates) {
            if (CollisionManager.checkCollision(this.player,levelGate)) {
                this.game.shouldUpdate = false;
                this.game.levelManager.load(`./scenes/gltf/${levelGate.level}/${levelGate.level}.gltf`, function() {
                    this.game.init(this.game.levelManager.scene);
                    this.game.shouldUpdate = true;
                }.bind(this));
            }
        }
    }
}