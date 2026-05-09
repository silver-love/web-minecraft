#version 300 es
precision highp float;
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aUV;
layout(location = 2) in vec2 aLight;
uniform mat4 uProjection;
uniform mat4 uView;
uniform float uTime;
out vec2 vUV;
out vec2 vLight;
out float vFogDistance;
out vec3 vWorldPos;
void main() {
    vec3 pos = aPosition;
    if (pos.y > 0.0 && pos.y < 384.0) {
        pos.y += sin(pos.x * 0.5 + uTime * 2.0) * 0.1 + cos(pos.z * 0.5 + uTime * 1.5) * 0.1;
    }
    vec4 viewPos = uView * vec4(pos, 1.0);
    gl_Position = uProjection * viewPos;
    vUV = aUV + vec2(sin(uTime + pos.x * 0.3) * 0.02, cos(uTime + pos.z * 0.3) * 0.02);
    vLight = aLight;
    vFogDistance = length(viewPos.xyz);
    vWorldPos = pos;
}
