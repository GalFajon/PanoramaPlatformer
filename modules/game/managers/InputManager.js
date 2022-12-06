export class InputManager {
    constructor() {
        this.keys = {};
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

    init() {
        document.addEventListener('keydown', this.keydownHandler.bind(this));
        document.addEventListener('keyup', this.keyupHandler.bind(this));
    }
}