import { GLTFLoader } from '../../engine/GLTFLoader.js';

export class LevelManager {
    constructor(renderer, game) {
        this.loader = new GLTFLoader();
        this.background = '';

        this.renderer = renderer;
        this.game = game;

        this.scene = null;
        this.camera = null;
        this.currentLevel = null;
    }

    async retry() {
        
    }

    async load(level, callback) {
        await this.loader.load(`./scenes/gltf/${level}/${level}.gltf`);

        this.currentLevel = level;
        
        this.scene = await this.getScene();
        this.camera = await this.getCamera();

        this.renderer.prepareScene(this.scene);
        this.game.resize();

        if (callback) {
            callback();
        }
    }

    async getScene() {
        let scene = await this.loader.loadScene(this.loader.defaultScene);
                    
        this.renderer.skyboxFactory.url = `./scenes/gltf/${this.currentLevel}/background`;
        this.renderer.skyboxFactory.updateTexture();

        if (!scene) throw new Error('Scene not present in glTF');
        return scene;
    }

    async getCamera() {
        let camera = await this.loader.loadNode('Camera');

        if (!camera) throw new Error('Camera not present in glTF');
        if (!camera.camera) throw new Error('Camera node does not contain a camera reference');

        return camera;
        
    }


}