export class SkyboxFactory {
    constructor(gl, url) {
        this.gl = gl;

        this.geometry = null;
        this.texture = null;

        this.textureSize = 512;
        this.url = url;

        this.updateGeometry();
    }

    static getVertexShader() {
        return `#version 300 es
        layout (location = 0) in vec4 a_position;

        out vec4 v_position;

        void main() {
          v_position = a_position;
          gl_Position = a_position;
          gl_Position.z = 1.0;
        }
        `;
    }

    static getFragmentShader() {
        return `#version 300 es
        precision highp float;
        
        uniform samplerCube u_skybox;
        uniform mat4 uViewDirectionProjectionInverse;
        
        in vec4 v_position;        
        out vec4 outColor;
        
        void main() {
          vec4 t = uViewDirectionProjectionInverse * v_position;
          outColor = texture(u_skybox, normalize(t.xyz / t.w));
        }
        
        `;
    }

    updateGeometry() {
        let gl = this.gl;
        let vao = gl.createVertexArray();

        gl.bindVertexArray(vao);

        let positionBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);      
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);      
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this.geometry = vao;
    }

    updateTexture(url) {
        let gl = this.gl;
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      
        const faceInfos = [
          { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: `${this.url}/pos-x.jpg` },
          { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: `${this.url}/neg-x.jpg` },
          { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: `${this.url}/pos-y.jpg` },
          { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: `${this.url}/neg-y.jpg` },
          { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: `${this.url}/pos-z.jpg` },
          { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: `${this.url}/neg-z.jpg` }
        ];

        faceInfos.forEach((faceInfo) => {
          const {target, url} = faceInfo;      
          gl.texImage2D(target, 0, gl.RGBA, this.textureSize, this.textureSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      
          const image = new Image();
          image.src = url;
          image.addEventListener('load', function() {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
          });
        });

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        
        this.texture = texture;
    }
}