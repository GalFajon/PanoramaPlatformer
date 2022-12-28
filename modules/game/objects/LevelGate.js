import { GameObject } from './GameObject.js';
import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';

export class LevelGate extends GameObject {
    constructor(node) {
        super(node);
        this.bbox = node.scale;
        this.level = node.extras.level;
    }

    update(game,dt) {
        const rotation = quat.clone(this.node.rotation);
        quat.rotateZ(rotation, rotation, 1*dt);
        this.node.rotation = rotation;
    }
}