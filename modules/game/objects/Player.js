import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { GameObject } from './GameObject.js';

export class Player extends GameObject {
    constructor(node) {
        super(node);

        this.directions = {
            forward: [0, 0, -1],
            right: [1, 0, 0],
            down: [0,-1,0],
            up: [0,1,0],
        }

        this.pitch = 0;
        this.yaw = 0;
        this.velocity = [0, 0, 0];

        this.acceleration = 5;
        this.maxSpeed = 5;
        this.decay = 1;

        this.gravity = 2;

        this.jumpTime = 0.5;
        this.jumpTimer = this.jumpTime;
        this.jumpSpeed = 3;

        this.states = {
            CURRENT_STATE: "FALLING",
            FALLING: "FALLING",
            STANDING: "STANDING",
            JUMPING: "JUMPING"            
        }

    }

    setState(state) {
        console.log("SETTING STATE:", state)
        this.states.CURRENT_STATE = state;
    }

    update(state, dt) { 
        console.log(this.states.CURRENT_STATE);
        
        if (this.jumpTimer > 0 && this.states.CURRENT_STATE == this.states.JUMPING) this.jumpTimer -= dt;
        else if(this.states.CURRENT_STATE == this.states.JUMPING) {
            this.jumpTimer = 0;
            this.setState(this.states.FALLING);
        }

        const acc = vec3.create();

        if (state.inputs['KeyW']) vec3.add(acc, acc, this.directions.forward);
        if (state.inputs['KeyS']) vec3.sub(acc, acc, this.directions.forward);
        if (state.inputs['KeyD']) vec3.add(acc, acc, this.directions.right);
        if (state.inputs['KeyA']) vec3.sub(acc, acc, this.directions.right);
        if (state.inputs['Space']) { 
            if (this.states.CURRENT_STATE == this.states.STANDING) {
                this.setState("JUMPING"); 
                this.jumpTimer = this.jumpTime; 
            }
        }
        
        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);
        
        const gravity = vec3.create();

        if (this.states.CURRENT_STATE == this.states.JUMPING) {
            vec3.add(gravity, gravity,this.directions.up);
            vec3.scale(gravity, gravity, dt * this.jumpSpeed);
        }
        if (this.states.CURRENT_STATE == this.states.FALLING) {
            vec3.add(gravity, gravity,this.directions.down);
            vec3.scale(gravity, gravity, dt * this.gravity);
        }

        if (!state.inputs['KeyW'] && !state.inputs['KeyS'] && !state.inputs['KeyD'] && !state.inputs['KeyA']) this.velocity = [0,0,0];

        const speed = vec3.length(this.velocity);
        if (speed > this.maxSpeed) vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);
        
        this.node.translation = vec3.scaleAndAdd(this.node.translation, this.node.translation, this.velocity, dt);
        this.node.translation = vec3.add(this.node.translation, this.node.translation, gravity);
        
        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        this.node.rotation = rotation;
    }
}