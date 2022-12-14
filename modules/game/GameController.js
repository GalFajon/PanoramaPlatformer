import {Platform} from '../game/objects/Platform.js';
import {Player} from '../game/objects/Player.js';
import {Enemy} from '../game/objects/Enemy.js';
import {Coin} from '../game/objects/Coin.js';
import {LevelGate} from '../game/objects/LevelGate.js';

import {InputManager} from '../game/managers/InputManager.js';
import {CollisionManager} from './managers/CollisionManager.js';
import { vec3, quat } from '../../lib/gl-matrix-module.js';

export class GameController {
    constructor(levelManager, shadowFactory, uiFactory) {
        this.shadowFactory = shadowFactory;

        this.player = undefined;
        this.camera = undefined;
        
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.levelGates = [];

        this.shouldUpdate = true;

        this.state = { collected: 0 };

        this.inputManager = new InputManager();
        this.inputManager.init();

        this.levelManager = levelManager;
        this.collisionManager = new CollisionManager(this);
        this.uiFactory = uiFactory;

        this.startTime = 0;
    }

    init(scene) {
        this.scene = scene;
        this.state.collected = 0;
        
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.levelGates = [];

        for (let i=0; i < scene.nodes.length; i++) {        
            if (scene.nodes[i].name == "Player") this.player = new Player(scene.nodes[i], [ scene.extras.playerbbox[0], scene.extras.playerbbox[2], scene.extras.playerbbox[1] ] );        
            if (scene.nodes[i].name == "Camera") this.camera = scene.nodes[i];
            if (scene.nodes[i].name.startsWith("Platform")) this.platforms.push(new Platform(scene.nodes[i]));
            if (scene.nodes[i].name.startsWith("Enemy")) this.enemies.push(new Enemy(scene.nodes[i], [ scene.extras.enemybbox[0], scene.extras.enemybbox[2], scene.extras.enemybbox[1] ]));
            if (scene.nodes[i].name.startsWith("Coin")) this.coins.push(new Coin(scene.nodes[i], [ scene.extras.coinbbox[0], scene.extras.coinbbox[2], scene.extras.coinbbox[1] ]));
            if (scene.nodes[i].name.startsWith("LevelGate")) this.levelGates.push(new LevelGate(scene.nodes[i]));
        }

        this.camera.translation = vec3.add(this.camera.translation,this.player.node.translation, [0,12,22])
        this.camera.rotation = [-0.25, 0, 0, 0.97];

        this.camera.camera.fov = 0.7;
        this.camera.camera.far = 90;
        this.camera.camera.near = 1;

        this.camera.camera.updateProjectionMatrix();

        this.collisionManager.init(this.player,this.platforms,this.enemies,this.coins,this.levelGates);
        this.uiFactory.health = this.player.health - 1;

        this.state.inputs = this.inputManager.keys;
        this.shouldUpdate = true;
    }

    update() {
        if (this.shouldUpdate) {
            this.time = performance.now();
            const dt = (this.time - this.startTime) * 0.001;
            this.startTime = this.time;

            this.collisionManager.update();

            let ppos = vec3.clone(this.player.node.translation);
            this.player.update(this,dt);

            if (this.player.node.translation[1] < -5) {
                this.shouldUpdate = false;
                this.levelManager.load(this.levelManager.currentLevel, function() {
                    this.init(this.levelManager.scene);
                    this.shouldUpdate = true;
                }.bind(this));
            }

            let apos = vec3.clone(this.player.node.translation)

            vec3.sub(ppos,apos,ppos)
            this.camera.translation = vec3.add(this.camera.translation,this.camera.translation,ppos);
            this.shadowFactory.position = [ this.player.node.translation[0], this.player.node.translation[1] + 10, this.player.node.translation[2]+0.5 ];
            this.shadowFactory.target = [ this.player.node.translation[0], this.player.node.translation[1], this.player.node.translation[2] ];

            this.shadowFactory.updateMatrix();
            this.uiFactory.health = this.player.health - 1;
            this.uiFactory.counter = this.state.collected;

            for (let coin of this.coins) coin.update(this,dt);
            for (let enemy of this.enemies) enemy.update(this,dt);
        }
    }
}