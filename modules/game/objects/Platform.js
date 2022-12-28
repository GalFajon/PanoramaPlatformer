import { GameObject } from './GameObject.js';

export class Platform {
    constructor(node) {
        this.node = node;
        this.bbox = node.scale;
    }

    update(state) {

    }
}