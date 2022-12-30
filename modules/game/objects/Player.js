import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { GameObject } from './GameObject.js';

export class Player extends GameObject {
    constructor(node, bbox) {
        super(node);
        
        this.bbox = bbox;

        this.directions = {
            forward: [0, 0, -1],
            backward: [0, 0, 1],
            right: [1, 0, 0],
            left: [-1, 0, 0],
            
            down: [0,-1,0],
            up: [0,1,0],
        }

        this.rotations = {
            backward: 0,
            forward: 3.2,
            right: 1.5,
            left: -1.5,
            backwardLeft: -0.75,
            backwardRight: 0.75,
            forwardLeft: 3.2+0.75,
            forwardRight: 3.2-0.75,
        }

        this.targetYaw = 0;
        this.pitch = 0;
        this.yaw = 0;

        this.currentDir = [0,0,0];

        this.velocity = [0, 0, 0];

        this.acceleration = 10;
        this.maxSpeed = 10;
        this.curSpeed = 0;
        this.decay = 1;

        this.gravity = 5;

        this.jumpTime = 1;
        this.jumpTimer = this.jumpTime;
        this.jumpSpeed = 3;

        this.timeSinceLastHurt = 0;
        this.hurt = false;

        this.health = 4;

        this.onFloor = false;

        this.onWall = false;
        this.wallDir = [0,0,0];
        
        this.states = {
            CURRENT_STATE: "FALLING",
            FALLING: "FALLING",
            STANDING: "STANDING",
            JUMPING: "JUMPING"            
        }

        this.animatedParts = {}
        this.animations = {
            current: 'IDLE',
            idle: 'IDLE',
            run: 'RUN',
            jump: 'JUMP'
        };
        this.animationFrame = 0;

        for (let child of this.node.children) {
            if (child.name.startsWith("LeftArm")) this.animatedParts.leftArm = child;
            if (child.name.startsWith("LeftLeg")) this.animatedParts.leftLeg = child;
            if (child.name.startsWith("RightArm")) this.animatedParts.rightArm = child;
            if (child.name.startsWith("RightLeg")) this.animatedParts.rightLeg = child;
        }
    }

    setState(state) {
        this.states.CURRENT_STATE = state;
    }
    animate(dt) {
        this.animationFrame += dt;
        if (this.animationFrame > 1) this.animationFrame = 0;

        if (this.animations.current == this.animations.run) {
            let s = 0.4 + (this.curSpeed/this.maxSpeed * 0.5);
            this.animatedParts.leftLeg.rotation = quat.rotateX([], quat.create(), Math.sin((this.animationFrame*2-1)*Math.PI) * s);
            this.animatedParts.rightLeg.rotation = quat.rotateX([], quat.create(), Math.sin(-(this.animationFrame*2-1)*Math.PI) * s);

            if (this.curSpeed < 6) {
                this.animatedParts.leftArm.rotation = quat.rotateX([], quat.create(), Math.sin((this.animationFrame*2-1)*Math.PI) * 0.5);
                this.animatedParts.rightArm.rotation = quat.rotateX([], quat.create(), Math.sin(-(this.animationFrame*2-1)*Math.PI) * 0.5);
            }
            else {
                this.animatedParts.leftArm.rotation = quat.rotateX([], quat.create(), 1.5);
                this.animatedParts.rightArm.rotation = quat.rotateX([], quat.create(), 1.5);
            }
        }
        else if (this.animations.current == this.animations.idle) {
            this.animatedParts.leftLeg.rotation = quat.rotateX([], quat.create(), 0);
            this.animatedParts.rightLeg.rotation = quat.rotateX([], quat.create(), 0);
            this.animatedParts.leftArm.rotation = quat.rotateY([], quat.create(), Math.sin((this.animationFrame*2-1)*Math.PI) * 0.5);
            this.animatedParts.rightArm.rotation = quat.rotateY([], quat.create(), Math.sin((this.animationFrame*2-1)*Math.PI) * 0.5);
        }
        else if (this.animations.current == this.animations.jump) {
            this.animatedParts.leftLeg.rotation = quat.rotateX([], quat.create(), 0.3);
            this.animatedParts.rightLeg.rotation = quat.rotateX([], quat.create(), -0.3);
            this.animatedParts.leftArm.rotation = quat.rotateZ([], quat.create(), -0.8);
            this.animatedParts.rightArm.rotation = quat.rotateZ([], quat.create(), 0.8);
        }
        else if (this.animations.current == this.animations.hurt) {
            this.animatedParts.leftLeg.rotation = quat.rotateX([], quat.create(), -0.4);
            this.animatedParts.rightLeg.rotation = quat.rotateX([], quat.create(), -0.4);
            this.animatedParts.leftArm.rotation = quat.rotateX([], quat.create(), -1.9);
            this.animatedParts.rightArm.rotation = quat.rotateX([], quat.create(), -1.9);
        }

    }

    update(game, dt) {     
        this.animate(dt);

        this.timeSinceLastHurt += dt;
        
        if (this.jumpTimer > 0 && this.states.CURRENT_STATE == this.states.JUMPING) this.jumpTimer -= dt;
        else if(this.states.CURRENT_STATE == this.states.JUMPING) {
            this.jumpTimer = 0;
            this.setState(this.states.FALLING);
        }

        const acc = vec3.create();

        
        if (this.states.CURRENT_STATE != this.states.JUMPING) {
            if (this.onFloor) this.setState(this.states.STANDING);
            else this.setState(this.states.FALLING);
        }
        
        this.currentDir = [0,0,0];

        if (game.state.inputs['KeyW']) {
            vec3.add(this.currentDir, this.currentDir, this.directions.forward);
            this.yaw = this.rotations.forward;
        }
        if (game.state.inputs['KeyS']) {
            vec3.add(this.currentDir, this.currentDir, this.directions.backward);
            this.yaw = this.rotations.backward;
        }
        if (game.state.inputs['KeyD']) {
            vec3.add(this.currentDir, this.currentDir, this.directions.right);
            this.yaw = this.rotations.right;
        }
        
        if (game.state.inputs['KeyA']) {
            vec3.add(this.currentDir, this.currentDir, this.directions.left);
            this.yaw = this.rotations.left;
        }

        if (game.state.inputs['KeyA'] && game.state.inputs['KeyW']) this.yaw = this.rotations.forwardLeft;
        if (game.state.inputs['KeyA'] && game.state.inputs['KeyS']) this.yaw = this.rotations.backwardLeft;
        if (game.state.inputs['KeyD'] && game.state.inputs['KeyW']) this.yaw = this.rotations.forwardRight;
        if (game.state.inputs['KeyD'] && game.state.inputs['KeyS']) this.yaw = this.rotations.backwardRight;
        if (game.state.inputs['Space']) { 
            if (this.states.CURRENT_STATE == this.states.STANDING) {
                this.setState("JUMPING"); 
                this.jumpTimer = this.jumpTime; 
            }
        }

        if (this.onWall && (this.currentDir[2] == this.wallDir[2] && this.wallDir[2] != 0 || this.currentDir[0] == this.wallDir[0] && this.wallDir[0] != 0)) {
            this.velocity = [0,0,0];
            this.currentDir = [0,0,0];
        }

        vec3.add(acc, acc, this.currentDir);
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

        if (!game.state.inputs['KeyW'] && !game.state.inputs['KeyS'] && !game.state.inputs['KeyD'] && !game.state.inputs['KeyA'] && !this.hurt) {
            vec3.scale(this.velocity, this.velocity, 0);
        }

        if (this.states.CURRENT_STATE == this.states.HURT) this.velocity = vec3.negate([],this.velocity);
        
        if(this.states.CURRENT_STATE == this.states.JUMPING || this.states.CURRENT_STATE == this.states.FALLING) this.animations.current = this.animations.jump;
        else if(this.states.CURRENT_STATE == this.states.STANDING) {
            if (!game.state.inputs['KeyW'] && !game.state.inputs['KeyS'] && !game.state.inputs['KeyD'] && !game.state.inputs['KeyA']) this.animations.current = this.animations.idle;
            else this.animations.current = this.animations.run;
        }

        if (this.hurt) {
            this.velocity = vec3.negate([],this.velocity);
        }

        if (this.timeSinceLastHurt < 0.3) {
            this.animations.current = this.animations.hurt;            
        }

        this.curSpeed = vec3.length(this.velocity);
        if (this.curSpeed > this.maxSpeed) vec3.scale(this.velocity, this.velocity, this.maxSpeed / this.curSpeed);
        
        this.node.translation = vec3.scaleAndAdd(this.node.translation, this.node.translation, this.velocity, dt);
        this.node.translation = vec3.add(this.node.translation, this.node.translation, gravity);
        
        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        this.node.rotation = rotation;
    }
}