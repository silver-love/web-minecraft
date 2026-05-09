#version 300 es
precision highp float;
in vec2 vUV;
in vec2 vLight;
in float vFogDistance;
in vec3 vWorldPos;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uTime;
void main() {
    vec4 texColor = texture(uTexture, vUV);
    float lightLevel = max(vLight.x, vLight.y);
    vec3 color = texColor.rgb * lightLevel;
    color = mix(color, vec3(0.1, 0.3, 0.5), 0.3);
    float fogFactor = 1.0 - smoothstep(uFogNear, uFogFar, vFogDistance);
    color = mix(uFogColor, color, fogFactor);
    fragColor = vec4(color, 0.7);
}
