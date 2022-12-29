import { mat4, vec3 } from '../../lib/gl-matrix-module.js';

import { WebGL } from './WebGL.js';

import { shaders } from './shaders.js';

import { ShadowFactory } from './ShadowFactory.js';
// This class prepares all assets for use with WebGL
// and takes care of rendering.

export class Renderer {

    constructor(gl, shadowFactory, skyboxFactory) {
        this.gl = gl;

        this.shadowFactory = shadowFactory;
        this.skyboxFactory = skyboxFactory;

        this.glObjects = new Map();
        this.programs = WebGL.buildPrograms(gl, shaders);

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.defaultTexture = WebGL.createTexture(gl, {
            width: 1,
            height: 1,
            data: new Uint8Array([255, 255, 255, 255]),
        });

        this.defaultSampler = WebGL.createSampler(gl, {
            min: gl.NEAREST,
            mag: gl.NEAREST,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
        });

    }

    prepareBufferView(bufferView) {
        if (this.glObjects.has(bufferView)) {
            return this.glObjects.get(bufferView);
        }
        const buffer = new DataView(
            bufferView.buffer,
            bufferView.byteOffset,
            bufferView.byteLength);
        const glBuffer = WebGL.createBuffer(this.gl, {
            target : bufferView.target,
            data   : buffer
        });

        this.glObjects.set(bufferView, glBuffer);
        return glBuffer;
    }

    prepareSampler(sampler) {
        if (this.glObjects.has(sampler)) {
            return this.glObjects.get(sampler);
        }

        const glSampler = WebGL.createSampler(this.gl, sampler);
        this.glObjects.set(sampler, glSampler);
        return glSampler;
    }

    prepareImage(image) {
        if (this.glObjects.has(image)) {
            return this.glObjects.get(image);
        }

        const glTexture = WebGL.createTexture(this.gl, { image });
        this.glObjects.set(image, glTexture);
        return glTexture;
    }

    prepareTexture(texture) {
        const gl = this.gl;

        this.prepareSampler(texture.sampler);
        const glTexture = this.prepareImage(texture.image);

        const mipmapModes = [
            gl.NEAREST_MIPMAP_NEAREST,
            gl.NEAREST_MIPMAP_LINEAR,
            gl.LINEAR_MIPMAP_NEAREST,
            gl.LINEAR_MIPMAP_LINEAR,
        ];

        if (!texture.hasMipmaps && mipmapModes.includes(texture.sampler.min)) {
            gl.bindTexture(gl.TEXTURE_2D, glTexture);
            gl.generateMipmap(gl.TEXTURE_2D);
            texture.hasMipmaps = true;
        }
    }

    prepareMaterial(material) {
        if (material.baseColorTexture) {
            this.prepareTexture(material.baseColorTexture);
        }
        if (material.metallicRoughnessTexture) {
            this.prepareTexture(material.metallicRoughnessTexture);
        }
        if (material.normalTexture) {
            this.prepareTexture(material.normalTexture);
        }
        if (material.occlusionTexture) {
            this.prepareTexture(material.occlusionTexture);
        }
        if (material.emissiveTexture) {
            this.prepareTexture(material.emissiveTexture);
        }
    }

    preparePrimitive(primitive) {
        if (this.glObjects.has(primitive)) {
            return this.glObjects.get(primitive);
        }

        this.prepareMaterial(primitive.material);

        const gl = this.gl;
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        if (primitive.indices) {
            const bufferView = primitive.indices.bufferView;
            bufferView.target = gl.ELEMENT_ARRAY_BUFFER;
            const buffer = this.prepareBufferView(bufferView);
            gl.bindBuffer(bufferView.target, buffer);
        }

        // this is an application-scoped convention, matching the shader
        const attributeNameToIndexMap = {
            POSITION   : 0,
            NORMAL     : 1,
            TANGENT    : 2,
            TEXCOORD_0 : 3,
            TEXCOORD_1 : 4,
            COLOR_0    : 5,
        };

        for (const name in primitive.attributes) {
            const accessor = primitive.attributes[name];
            const bufferView = accessor.bufferView;
            const attributeIndex = attributeNameToIndexMap[name];
            if (attributeIndex !== undefined) {
                bufferView.target = gl.ARRAY_BUFFER;
                const buffer = this.prepareBufferView(bufferView);
                gl.bindBuffer(bufferView.target, buffer);

                gl.enableVertexAttribArray(attributeIndex);
                gl.vertexAttribPointer(
                    attributeIndex,
                    accessor.numComponents,
                    accessor.componentType,
                    accessor.normalized,
                    bufferView.byteStride,
                    accessor.byteOffset);
            }
        }

        this.glObjects.set(primitive, vao);
        return vao;
    }

    prepareMesh(mesh) {
        for (const primitive of mesh.primitives) {
            this.preparePrimitive(primitive);
        }
    }

    prepareNode(node) {
        if (node.mesh) {
            this.prepareMesh(node.mesh);
        }
        for (const child of node.children) {
            this.prepareNode(child);
        }
    }

    prepareScene(scene) {
        for (const node of scene.nodes) {
            this.prepareNode(node);
        }
    }

    getViewProjectionMatrix(camera) {
        const vpMatrix = camera.globalMatrix;
        mat4.invert(vpMatrix, vpMatrix);
        mat4.mul(vpMatrix, camera.camera.projectionMatrix, vpMatrix);
        return vpMatrix;
    }

    render(scene, camera) {
        this.renderDepthMap(scene,camera);
        this.renderSkybox(scene,camera);
        this.renderWithShadows(scene,camera);
    }

    renderWithBasicLighting(scene,camera) {
        const gl = this.gl;

        const mvpMatrix = this.getViewProjectionMatrix(camera);
        const { program, uniforms } = this.programs.simple;

        gl.useProgram(program);

        gl.bindFramebuffer(gl.FRAMEBUFFER,null);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform4fv(uniforms.uLightPos,[0,30,0]);

        for (const node of scene.nodes) {
            this.renderNode(node, mvpMatrix, program, uniforms);
        }
    }

    renderDepthMap(scene,camera) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.simple;

        gl.useProgram(program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFactory.frameBuffer);
        gl.viewport(0, 0, this.shadowFactory.textureSize, this.shadowFactory.textureSize);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (const node of scene.nodes) {
            this.renderNode(node, this.shadowFactory.matrix, program, uniforms, camera);
        }

    }

    renderSkybox(scene,camera) {
        const gl = this.gl;
        const mvpMatrix = mat4.clone(camera.camera.projectionMatrix);
        console.log(mvpMatrix);
        mat4.rotate(mvpMatrix, mvpMatrix, (camera.translation[0] * 0.05), [0,1,0]);
        mat4.rotate(mvpMatrix, mvpMatrix, (camera.translation[1] * 0.05), [1,0,0]);
        mat4.invert(mvpMatrix,mvpMatrix);

        const { program, uniforms } = this.programs.skybox;

        gl.useProgram(program);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(uniforms.uViewDirectionProjectionInverse, false, mvpMatrix);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.skyboxFactory.texture);
        gl.uniform1i(uniforms.u_skybox, 2);

        gl.bindVertexArray(this.skyboxFactory.geometry);
        gl.depthFunc(gl.LEQUAL);
        gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);        
    }

    renderWithShadows(scene,camera) {
        const gl = this.gl;
        const mvpMatrix = this.getViewProjectionMatrix(camera);
        const { program, uniforms } = this.programs.projection;

        gl.useProgram(program);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.shadowFactory.texture);

        gl.uniformMatrix4fv(uniforms.u_textureMatrix, false, this.shadowFactory.textureMat);
        gl.uniform1i(uniforms.u_projectedTexture, 1);
        gl.uniform4fv(uniforms.uLightDir,[0,1,0.7,0]);

        gl.uniform4fv(uniforms.u_fogColor,[0.5,0.5,0.5,1.0]);
        gl.uniform1f(uniforms.u_fogNear,0.6);
        gl.uniform1f(uniforms.u_fogFar,0);
        console.log(camera.rotation);

        for (const node of scene.nodes) {
            this.renderNode(node, mvpMatrix, program, uniforms, camera);
        }
    }

    renderNode(node, mvpMatrix, program, uniforms, camera) {
        if (node.name.startsWith('CollisionBox') || node.name.startsWith("Platform")) return;
        const gl = this.gl;

        mvpMatrix = mat4.clone(mvpMatrix);
        mat4.mul(mvpMatrix, mvpMatrix, node.localMatrix);

        if (node.mesh) {
            gl.uniformMatrix4fv(uniforms.uModelViewProjection, false, mvpMatrix);
            gl.uniformMatrix4fv(uniforms.uNodePosition, false, node.globalMatrix);
            gl.uniformMatrix4fv(uniforms.uCameraPosition, false, camera.globalMatrix);

            for (const primitive of node.mesh.primitives) {
                this.renderPrimitive(primitive, program, uniforms);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, mvpMatrix, program, uniforms, camera);
        }
    }

    renderPrimitive(primitive, program, uniforms) {
        const gl = this.gl;

        const vao = this.glObjects.get(primitive);
        gl.bindVertexArray(vao);

        const material = primitive.material;
        gl.uniform4fv(uniforms.uBaseColorFactor, material.baseColorFactor);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseColorTexture, 0);

        const texture = material.baseColorTexture;
        const glTexture = texture
                        ? this.glObjects.get(texture.image)
                        : this.defaultTexture;
        const glSampler = texture
                        ? this.glObjects.get(texture.sampler)
                        : this.defaultSampler;
        
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        if (primitive.indices) {
            const mode = primitive.mode;
            const count = primitive.indices.count;
            const type = primitive.indices.componentType;
            gl.drawElements(mode, count, type, 0);
        } else {
            const mode = primitive.mode;
            const count = primitive.attributes.POSITION.count;
            gl.drawArrays(mode, 0, count);
        }
    }

}
