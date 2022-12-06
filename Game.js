import { Application } from './modules/engine/Application.js';

import { GLTFLoader } from './modules/engine/GLTFLoader.js';
import { Renderer } from './modules/engine/Renderer.js';

import { GameController } from './modules/game/GameController.js';

export class Game extends Application {

    async start() {        
        this.loader = new GLTFLoader();
        await this.loader.load('./scenes/gltf/test/level0.gltf');

        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.camera = await this.loader.loadNode('Camera');

        this.gameController = new GameController(this.scene);

        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF');
        }

        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference');
        }

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();

    }

    render() {
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspectRatio = w / h;

        if (this.camera) {
            this.camera.camera.aspect = aspectRatio;
            this.camera.camera.updateProjectionMatrix();
        }
    }

    update() { this.gameController.update(); }

}