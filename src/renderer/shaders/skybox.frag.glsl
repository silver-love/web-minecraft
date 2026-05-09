#version 300 es
precision highp float;
in vec3 vWorldPos;
out vec4 fragColor;
uniform float uTimeOfDay;
uniform vec3 uSunDirection;
void main() {
    vec3 dir = normalize(vWorldPos);
    float sunAngle = dot(dir, uSunDirection);

    vec3 dayTop = vec3(0.3, 0.5, 0.85);
    vec3 dayBottom = vec3(0.6, 0.75, 0.95);
    vec3 nightTop = vec3(0.01, 0.01, 0.05);
    vec3 nightBottom = vec3(0.02, 0.02, 0.08);

    float dayFactor = smoothstep(-0.1, 0.2, uSunDirection.y);
    vec3 topColor = mix(nightTop, dayTop, dayFactor);
    vec3 bottomColor = mix(nightBottom, dayBottom, dayFactor);
    vec3 skyColor = mix(bottomColor, topColor, max(dir.y, 0.0));

    float sunDisk = smoothstep(0.998, 0.999, sunAngle);
    vec3 sunColor = vec3(1.0, 0.95, 0.8);
    skyColor = mix(skyColor, sunColor, sunDisk);

    float sunsetFactor = smoothstep(-0.05, 0.1, uSunDirection.y) * smoothstep(0.3, 0.1, uSunDirection.y);
    vec3 sunsetColor = vec3(0.9, 0.4, 0.1);
    skyColor = mix(skyColor, sunsetColor, sunsetFactor * 0.5 * max(1.0 - dir.y * 2.0, 0.0));

    fragColor = vec4(skyColor, 1.0);
}
