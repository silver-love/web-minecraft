#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in vec2 light;

uniform mat4 uProjection;
uniform mat4 uView;

out vec2 vUV;
out vec2 vLight;
out float vFogDistance;

void main() {
    vec4 viewPos = uView * vec4(position, 1.0);
    gl_Position = uProjection * viewPos;
    vUV = uv;
    vLight = light;
    vFogDistance = length(viewPos.xyz);
}
