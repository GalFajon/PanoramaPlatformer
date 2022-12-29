import { Application } from './modules/engine/Application.js';

import { GLTFLoader } from './modules/engine/GLTFLoader.js';
import { Renderer } from './modules/engine/Renderer.js';

import { ShadowFactory } from './modules/engine/ShadowFactory.js';
import { SkyboxFactory } from './modules/engine/SkyboxFactory.js';

import { GameController } from './modules/game/GameController.js';
import { LevelManager } from './modules/game/managers/LevelManager.js';

export class Game extends Application {
    constructor(canvas, glOptions) {
        super(canvas,glOptions);
    }

    async start() {        
        this.shadowFactory = new ShadowFactory(this.gl);
        this.skyboxFactory = new SkyboxFactory(this.gl, '/background');
        this.renderer = new Renderer(this.gl, this.shadowFactory, this.skyboxFactory);

        this.levelManager = new LevelManager(this.renderer, this);
        this.gameController = new GameController(this.levelManager, this.shadowFactory);

        await this.levelManager.load('level1')

        this.gameController.init(this.levelManager.scene);
        this.resize();
    }

    render() {
        if (this.renderer) {
            this.renderer.render(this.levelManager.scene, this.levelManager.camera);
        }
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspectRatio = w / h;

        if (this.levelManager.camera) {
            this.levelManager.camera.camera.aspect = aspectRatio;
            this.levelManager.camera.camera.updateProjectionMatrix();
        }
    }

    update() { 
        if (this.gameController.shouldUpdate) this.gameController.update();
    }

}