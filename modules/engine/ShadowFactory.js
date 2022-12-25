import { mat4, vec3 } from '../../lib/gl-matrix-module.js';

export class ShadowFactory {
    constructor(gl) {
        this.gl = gl;
        this.texture = null;
        this.matrix = null;
        this.proj = null;
        this.world = null;

        this.position = [0,15,1];
        this.target = [0,0,0];

        this.createTexture();
        this.updateMatrix();
    }

    updateMatrix() {
        this.world = mat4.lookAt(mat4.create(), this.position, this.target, [0, 1, 0]);
        //this.proj = mat4.perspective([], 0.6, 1, 0.5, 30);
        this.proj = mat4.ortho(
            mat4.create(),
            -20,   // left
             20,   // right
             -20,  // bottom
             20,  // top
             0.5,                      // near
             60
        );                      // far

        this.textureMat = mat4.identity([]);
        this.textureMat = mat4.translate(this.textureMat,this.textureMat,[0.5,0.5,0.5]);
        this.textureMat = mat4.scale(this.textureMat,this.textureMat,[0.5,0.5,0.5]);
        this.textureMat = mat4.mul(this.textureMat,this.textureMat,this.proj);
        this.textureMat = mat4.mul(this.textureMat,this.textureMat, this.world);

        this.matrix = mat4.mul([],this.proj,this.world);
    }

    createTexture() {
        const gl = this.gl;

        this.texture = gl.createTexture();
        this.textureSize = 1024;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.DEPTH_COMPONENT32F, // internal format
            this.textureSize,   // width
            this.textureSize,   // height
            0,                  // border
            gl.DEPTH_COMPONENT, // format
            gl.FLOAT,           // type
            null);              // data

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.enable(gl.DEPTH_TEST);
        this.frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,       // target
            gl.DEPTH_ATTACHMENT,  // attachment point
            gl.TEXTURE_2D,        // texture target
            this.texture,         // texture
            0);        
    }

    static getProjectionVertexShader() {
        return `#version 300 es
        layout (location = 0) in vec4 a_position;
        layout (location = 3) in vec2 a_texcoord;
        layout (location = 1) in vec3 aNormal;

        uniform mat4 uModelViewProjection;
        uniform mat4 uNodePosition;
        uniform mat4 u_textureMatrix;
         
        out vec2 v_texcoord;
        out vec4 v_projectedTexcoord;
        out vec2 clipSpace;
        out vec3 vNormal;

        void main() {         
          gl_Position = uModelViewProjection * a_position;
          v_texcoord = a_texcoord;
          v_projectedTexcoord = u_textureMatrix * uNodePosition * a_position;
          vNormal = aNormal;
        }
        `;
    }

    static getProjectionFragmentShader() {
        return `#version 300 es
        precision highp float;
         
        in vec2 v_texcoord;
        in vec4 v_projectedTexcoord;
        in vec3 vNormal;

        uniform sampler2D uBaseColorTexture;
        uniform vec4 uBaseColorFactor;
        uniform sampler2D u_projectedTexture;
        uniform vec3 uLightDir;

        out vec4 outColor;
        
        void main() {
            vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
            float currentDepth = projectedTexcoord.z - 0.02;
           
            bool inRange = 
                projectedTexcoord.x >= 0.0 &&
                projectedTexcoord.x <= 1.0 &&
                projectedTexcoord.y >= 0.0 &&
                projectedTexcoord.y <= 1.0;
           
            float projectedDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
            float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.5 : 1.0;  
           
            vec4 texColor = texture(uBaseColorTexture, v_texcoord) * uBaseColorFactor;
            outColor = vec4(texColor.rgb * shadowLight, texColor.a);

            vec3 normal = normalize(vNormal);
            float light = dot(normal, uLightDir);
            outColor.rgb *= light*1.3; //+ (inRange ? 0.0 : 1.0 * 0.1);
          }`;

        /*
                void main() {
            

          vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
         
          bool inRange = 
              projectedTexcoord.x >= -1.0 &&
              projectedTexcoord.x <= 1.0 &&
              projectedTexcoord.y >= -1.0 &&
              projectedTexcoord.y <= 1.0;
        
          vec4 projectedTexColor = vec4(texture(u_projectedTexture, projectedTexcoord.xy).rrr, 255);

          vec4 texColor = texture(uBaseColorTexture, v_texcoord);
         
          vec3 normal = normalize(vNormal);
          float light = dot(normal, uLightDir);

          float projectedAmount = inRange ? 1.0 : 0.0;
          outColor = mix(texColor * uBaseColorFactor, projectedTexColor, projectedAmount);
          //outColor.rgb *= light*1.3;
        }
        */
    }
}