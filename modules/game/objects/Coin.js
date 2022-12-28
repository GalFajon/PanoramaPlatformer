import { GameObject } from './GameObject.js';
import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';

export class Coin extends GameObject {
    constructor(node,bbox) {
        super(node);

        this.bbox = bbox;
    }

    update(game,dt) {
        const rotation = quat.clone(this.node.rotation);
        quat.rotateY(rotation, rotation, 1*dt);
        this.node.rotation = rotation;
    }
}