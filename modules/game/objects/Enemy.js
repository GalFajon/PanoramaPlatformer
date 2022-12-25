import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { GameObject } from './GameObject.js';

export class Enemy extends GameObject {
    constructor(node) {
        super(node);

        this.pitch = 0;
        this.yaw = 0;
        this.velocity = [0, 0, 0];

        this.acceleration = 5;
        this.maxSpeed = 3;

        this.detectionRange = 10;
        this.followVertically = false;
        this.direction = [0,0,0];
        this.health = 3;

        this.states = {
            CURRENT_STATE: "IDLING",
            IDLING: "IDLING",
            CHASING_PLAYER: "CHASING_PLAYER"
        }

        if (this.node.extras) {
            if (this.node.extras.detectionRange) this.detectionRange = this.node.extras.detectionRange;
            if (this.node.extras.followVertically) this.followVertically = this.node.extras.followVertically;
            if (this.node.extras.acceleration) this.acceleration = this.node.extras.acceleration;
            if (this.node.extras.maxSpeed) this.maxSpeed = this.node.extras.maxSpeed;
            if (this.node.extras.health) this.health = this.node.extras.health;
        }

    }

    setState(state) {
        this.states.CURRENT_STATE = state;
    }

    update(game, dt) {         
        const acc = vec3.create();
        
        if (vec3.distance(game.player.node.translation,this.node.translation) < this.detectionRange) {
            this.direction = vec3.normalize(this.direction,vec3.sub(this.direction,this.node.translation,game.player.node.translation));
            if (!this.followVertically) this.direction[1] = 0;

            vec3.sub(acc, acc, this.direction);
            vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);
        
            const speed = vec3.length(this.velocity);
            if (speed > this.maxSpeed) vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);
            
            this.node.translation = vec3.scaleAndAdd(this.node.translation, this.node.translation, this.velocity, dt);    
        }


        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        this.node.rotation = rotation;
    }
}