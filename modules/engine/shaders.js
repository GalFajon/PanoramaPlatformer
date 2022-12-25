const vertex = `#version 300 es

layout (location = 0) in vec4 aPosition;
layout (location = 3) in vec2 aTexCoord;
layout (location = 1) in vec3 aNormal;

uniform mat4 uModelViewProjection;

out vec2 vTexCoord;
out vec3 vNormal;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = uModelViewProjection * aPosition;
    vNormal = aNormal;
}
`;

const fragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uBaseColorTexture;
uniform vec4 uBaseColorFactor;

uniform vec3 uLightDir;

in vec2 vTexCoord;
in vec3 vNormal;

out vec4 oColor;

void main() {
    vec3 normal = normalize(vNormal);
    float light = dot(normal, uLightDir) * 1.3;

    vec4 baseColor = texture(uBaseColorTexture, vTexCoord);
    oColor = uBaseColorFactor * baseColor;
    oColor.rgb *= light;
}
`;

export const shaders = {
    simple: { vertex: vertex, fragment: fragment },
};
