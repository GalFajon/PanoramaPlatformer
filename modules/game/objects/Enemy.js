import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { GameObject } from './GameObject.js';

export class Enemy extends GameObject {
    constructor(node,bbox) {
        super(node);
        
        this.bbox = bbox;

        this.animatedParts = {
            wings: node.children[0]
        };

        this.pitch = 0;
        this.yaw = 0;
        this.velocity = [0, 0, 0];

        this.acceleration = 5;
        this.maxSpeed = 3;

        this.detectionRange = 20;
        this.followVertically = false;
        this.direction = [0,0,0];
        this.health = 3;

        this.animationFrame = 0;
        this.flapScale = 1;
        this.timeSinceLastHurt = 0.8;

        this.onWall = false;

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

    animate(dt) {
        this.animationFrame += dt;
        if (this.animationFrame > 1) this.animationFrame = 0;

        this.animatedParts.wings.rotation = quat.rotateX([], quat.create(), Math.sin((this.animationFrame*2-1)*Math.PI) * this.flapScale);
    }

    update(game, dt) {         
        this.timeSinceLastHurt += dt;
        const acc = vec3.create();
        
        if (vec3.distance(game.player.node.translation,this.node.translation) < this.detectionRange) {
            this.flapScale = 1;

            this.direction = vec3.normalize(this.direction,vec3.sub(this.direction,this.node.translation,game.player.node.translation));

            if (!this.followVertically) this.direction[1] = 0;

            vec3.sub(acc, acc, this.direction);
            vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);
        
            const speed = vec3.length(this.velocity);
            if (speed > this.maxSpeed) vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);

            if (this.colliding) this.velocity = vec3.negate([],this.velocity);
            this.node.translation = vec3.scaleAndAdd(this.node.translation, this.node.translation, this.velocity, dt);
        }
        else this.flapScale = 0.5;

        this.node.localMatrix = mat4.targetTo(this.node.localMatrix, this.node.translation, [ game.player.node.translation[0], this.node.translation[1], game.player.node.translation[2] ] , [0,1,0]);

        this.animate(dt);
    }
}