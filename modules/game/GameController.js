import {Platform} from '../game/objects/Platform.js';
import {Player} from '../game/objects/Player.js';
import {Enemy} from '../game/objects/Enemy.js';
import {Coin} from '../game/objects/Coin.js';

import {InputManager} from '../game/managers/InputManager.js';
import {CollisionManager} from './managers/CollisionManager.js';
import { vec3 } from '../../lib/gl-matrix-module.js';

export class GameController {
    constructor(scene) {
        this.player = undefined;
        this.camera = undefined;

        this.platforms = [];
        this.enemies = [];
        this.coins = [];

        this.state = {};

        this.inputManager = new InputManager();
        this.collisionManager = new CollisionManager();

        this.startTime = 0;
        this.init(scene);
    }

    init(scene) {
        for (let i=0; i < scene.nodes.length; i++) {
            if (scene.nodes[i].name == "Player") this.player = new Player(scene.nodes[i]);        
            if (scene.nodes[i].name == "Camera") this.camera = scene.nodes[i];
            if (scene.nodes[i].name.startsWith("Platform")) this.platforms.push(new Platform(scene.nodes[i]));
            if (scene.nodes[i].name.startsWith("Enemy")) this.enemies.push(new Enemy(scene.nodes[i]));
            if (scene.nodes[i].name.startsWith("Coin")) this.coins.push(new Coin(scene.nodes[i]))
        }

        this.inputManager.init();
        this.collisionManager.init(this.player,this.platforms,this.enemies,this.coins);

        this.state.inputs = this.inputManager.keys;
    }

    update() {
        this.time = performance.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        this.collisionManager.update();

        let ppos = vec3.clone(this.player.node.translation);
        this.player.update(this.state,dt);
        let apos = vec3.clone(this.player.node.translation)

        vec3.sub(ppos,apos,ppos)
        this.camera.translation = vec3.add(this.camera.translation,this.camera.translation,ppos);
    }
}