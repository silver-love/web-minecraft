#version 300 es

precision highp float;

in vec2 vUV;
in vec2 vLight;
in float vFogDistance;

uniform sampler2D uTexture;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

out vec4 fragColor;

void main() {
    vec4 texColor = texture(uTexture, vUV);
    float lightLevel = max(vLight.x, vLight.y);
    vec3 litColor = texColor.rgb * lightLevel;
    float fogFactor = smoothstep(uFogNear, uFogFar, vFogDistance);
    vec3 finalColor = mix(litColor, uFogColor, fogFactor);
    fragColor = vec4(finalColor, texColor.a);
}
