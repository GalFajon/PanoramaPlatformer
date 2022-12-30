import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';

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
            a.node.translation[0] - a.bbox[0] <= b.node.translation[0] + b.bbox[0] &&
            a.node.translation[0] + a.bbox[0] >= b.node.translation[0] - b.bbox[0] &&
            a.node.translation[1] - a.bbox[1] <= b.node.translation[1] + b.bbox[1] &&
            a.node.translation[1] + a.bbox[1] >= b.node.translation[1] - b.bbox[1] &&
            a.node.translation[2] - a.bbox[2] <= b.node.translation[2] + b.bbox[2] &&
            a.node.translation[2] + a.bbox[2] >= b.node.translation[2] - b.bbox[2]
        );
    }

    update() {
        let playerOnFloor = false;

        let playerTouchedWall = false;
        let wallDir = [0,0,0];
        
        let enemiesToCheck = [...this.enemies];

        for (let platform of this.platforms) {
            if (CollisionManager.checkCollision(this.player,platform)) {
                if (platform.node.translation[1] + platform.bbox[1] < (this.player.node.translation[1] - this.player.bbox[2])) playerOnFloor = true;
                else {
                    playerTouchedWall = true;

                    if (this.player.node.translation[2] < platform.node.translation[2] + platform.bbox[2] && this.player.node.translation[2] > platform.node.translation[2] - platform.bbox[2]) {
                        if (platform.node.translation[0] > this.player.node.translation[0]) wallDir[0] = 1; 
                        else wallDir[0] = -1;
                    }

                    if (this.player.node.translation[0] < platform.node.translation[0] + platform.bbox[0] && this.player.node.translation[0] > platform.node.translation[0] - platform.bbox[0]) {
                        if (platform.node.translation[2] > this.player.node.translation[2]) wallDir[2] = 1;
                        else wallDir[2] = -1;
                    }
                }
            }

            for (let enemy of enemiesToCheck) {
                let onWall = false;
                if (CollisionManager.checkCollision(enemy,platform)) {
                    onWall = true;
                    enemiesToCheck.splice(enemiesToCheck.indexOf(enemy), 1);
                }
                enemy.colliding = onWall;
            }
        }

        this.player.onFloor = playerOnFloor;
        this.player.onWall = playerTouchedWall;
        this.player.wallDir = wallDir;

        for (let coin of this.coins) {
            if (CollisionManager.checkCollision(this.player,coin)) {
                this.game.scene.removeNode(coin.node);
                this.coins.splice(this.coins.indexOf(coin),1);
                this.game.state.collected += 1;
            }
        }

        this.player.hurt = false;
        for (let enemy of this.enemies) {
            if (CollisionManager.checkCollision(this.player,enemy)) {
                enemy.colliding = true;
                
                if ((enemy.node.translation[1]) < (this.player.node.translation[1] - this.player.bbox[1])) {
                    this.player.jumpTimer = this.player.jumpTime * 0.4; 
                    this.player.setState(this.player.states.JUMPING);

                    if (enemy.timeSinceLastHurt > 0.5) {
                        enemy.health--;
                        enemy.timeSinceLastHurt = 0;

                        if (enemy.health == 0) {
                            this.game.scene.removeNode(enemy.node);
                            this.enemies.splice(this.enemies.indexOf(enemy),1);
                        }
                    }
                }
                else {
                    if (this.player.timeSinceLastHurt > 1) {
                        this.player.hurt = true;
                        this.player.health--;
                        
                        this.player.timeSinceLastHurt = 0;
                        if (this.player.health == 0) {
                            this.game.shouldUpdate = false;
                            this.game.levelManager.load(this.game.levelManager.currentLevel, function() {
                                this.game.init(this.game.levelManager.scene);
                                this.game.shouldUpdate = true;
                            }.bind(this));
                        }
                    }
                }
            }
        }

        for (let levelGate of this.levelGates) {
            if (CollisionManager.checkCollision(this.player,levelGate)) {
                this.game.shouldUpdate = false;
                this.game.levelManager.load(levelGate.level, function() {
                    this.game.init(this.game.levelManager.scene);
                    this.game.shouldUpdate = true;
                }.bind(this));
            }
        }
    }
}