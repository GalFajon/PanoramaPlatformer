import { GLTFLoader } from '../../engine/GLTFLoader.js';

export class LevelManager {
    constructor(renderer) {
        this.loader = new GLTFLoader();

        this.renderer = renderer;
        this.scene = null;
        this.camera = null;
    }

    async retry() {
        
    }

    async load(level, callback) {
        await this.loader.load(level);

        this.scene = await this.getScene();
        this.camera = await this.getCamera();

        this.renderer.prepareScene(this.scene);
        if (callback) {
            callback();
        }
    }

    async getScene() {
        let scene = await this.loader.loadScene(this.loader.defaultScene);
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