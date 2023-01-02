import { mat4, vec3 } from '../../lib/gl-matrix-module.js';

export class UIFactory {
    constructor(gl) {
        this.gl = gl;
        this.heartUrl = '/assets/images/heart.jpg';
        this.digitUrl = '/assets/images/digits'

        this.heartTexture = this.createTexture(this.heartUrl);
        this.digitTextures = [];

        for (let i=0; i < 10; i++) this.digitTextures.push(this.createTexture(`${this.digitUrl}/${i}.jpg`));

        this.health = 3;
        this.counter = 0;

        this.matrix = [];
    }

    static getVertexShader() {
        return `#version 300 es
 
        layout (location = 0) in vec4 a_position;
        layout (location = 3) in vec2 a_texcoord;
         
        uniform mat4 u_matrix;
         
        out vec2 v_texcoord;
         
        void main() {
           gl_Position = u_matrix * a_position;
           v_texcoord = a_texcoord;
        }
        `;
    }

    static getFragmentShader() {
        return `#version 300 es
        precision highp float;
         
        in vec2 v_texcoord;
         
        uniform sampler2D tex;
         
        out vec4 outColor;
         
        void main() {
           outColor = texture(tex, v_texcoord);
        }
        `;
    }

    createTexture(url) {
        let gl = this.gl;
        let tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
       
        let textureInfo = { width: 1, height: 1, texture: tex };

        let img = new Image();
        img.src = url;
        img.addEventListener('load', function() {
          textureInfo.width = img.width;
          textureInfo.height = img.height;
       
          gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        });

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        return textureInfo;
      }


    drawImage(tex, texWidth, texHeight, dstX, dstY, uniforms) {     
        let gl = this.gl;
        let vao = gl.createVertexArray();  
        gl.bindVertexArray(vao);
        
        this.matrix = mat4.ortho([], 0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
        this.matrix = mat4.translate(this.matrix, this.matrix, [dstX, dstY, 0]);
        this.matrix = mat4.scale(this.matrix, this.matrix, [texWidth, texHeight,1]);    
        
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        let positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1 ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        let texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

        let texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 2, gl.FLOAT, true, 0, 0);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, tex);

        gl.uniform1i(uniforms.tex, 3);
        gl.uniformMatrix4fv(uniforms.u_matrix, false, this.matrix);   

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

    drawHealth(uniforms) {
        for (let i=0; i < this.health; i++) {
            this.drawImage(this.heartTexture.texture,this.gl.canvas.width / 30, this.gl.canvas.height / 15, (i*(this.gl.canvas.width / 30+10)) + 10, 10, uniforms);
        }
    }

    drawCounter(uniforms) {
        let digits = [];

        if (this.counter < 10) {
            digits.push('0');
            digits.push(this.counter.toString());
        }
        else digits = this.counter.toString().split('');
        
        console.log(digits);

        for (let i=0; i < digits.length; i++) {
            this.drawImage(this.digitTextures[digits[i]].texture,this.gl.canvas.width / 30, this.gl.canvas.height / 15, this.gl.canvas.width*0.9 + i*this.gl.canvas.width/30, 10, uniforms);
        }
    }
}