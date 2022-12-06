export class GameObject {
    constructor(node) {
        this.node = node;

        /*
            bbox format: [ max_X, max_Y, max_Z ]

            POZOR: Y in Z sta zamenjana (to kar je v blenderju Z je v enginu Y)
        */
        if (this.node.extras.bbox) this.bbox = this.node.extras.bbox;
        else console.error("Bounding box not assigned. Add it as a custom property in Blender.");
    }
}