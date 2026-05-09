import { createShaderProgram } from './Shader';

const VERT_SOURCE = `#version 300 es
layout(location = 0) in vec2 aPosition;
uniform mat4 uProjection;
uniform mat4 uView;
out vec3 vDirection;
void main() {
    vDirection = mat3(uView) * vec3(aPosition, 1.0);
    gl_Position = vec4(aPosition, 0.999, 1.0);
}`;

const FRAG_SOURCE = `#version 300 es
precision highp float;
in vec3 vDirection;
uniform vec3 uSunPosition;
uniform vec3 uSkyColor;
uniform vec3 uHorizonColor;
uniform vec3 uSunColor;
out vec4 fragColor;
void main() {
    vec3 dir = normalize(vDirection);
    float y = dir.y;
    vec3 sky = mix(uHorizonColor, uSkyColor, max(y, 0.0));
    if (y < 0.0) {
        sky = mix(uHorizonColor, uHorizonColor * 0.5, min(-y * 4.0, 1.0));
    }
    float sunDot = max(dot(dir, normalize(uSunPosition)), 0.0);
    sky += uSunColor * pow(sunDot, 256.0) * 2.0;
    sky += uSunColor * pow(sunDot, 8.0) * 0.2;
    fragColor = vec4(sky, 1.0);
}`;

export class SkyRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private vbo: WebGLBuffer;
  private uProjection: WebGLUniformLocation | null;
  private uView: WebGLUniformLocation | null;
  private uSunPosition: WebGLUniformLocation | null;
  private uSkyColor: WebGLUniformLocation | null;
  private uHorizonColor: WebGLUniformLocation | null;
  private uSunColor: WebGLUniformLocation | null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = createShaderProgram(gl, VERT_SOURCE, FRAG_SOURCE);

    this.vao = gl.createVertexArray()!;
    this.vbo = gl.createBuffer()!;

    const vertices = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    const ibo = gl.createBuffer()!;

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    this.uProjection = gl.getUniformLocation(this.program, 'uProjection');
    this.uView = gl.getUniformLocation(this.program, 'uView');
    this.uSunPosition = gl.getUniformLocation(this.program, 'uSunPosition');
    this.uSkyColor = gl.getUniformLocation(this.program, 'uSkyColor');
    this.uHorizonColor = gl.getUniformLocation(this.program, 'uHorizonColor');
    this.uSunColor = gl.getUniformLocation(this.program, 'uSunColor');
  }

  render(projectionMatrix: Float32Array, viewMatrix: Float32Array, timeOfDay: number): void {
    const gl = this.gl;

    gl.disable(gl.DEPTH_TEST);

    gl.useProgram(this.program);

    gl.uniformMatrix4fv(this.uProjection, false, projectionMatrix);
    gl.uniformMatrix4fv(this.uView, false, viewMatrix);

    const sunAngle = timeOfDay * 2 * Math.PI;
    const sunPos: [number, number, number] = [Math.cos(sunAngle), Math.sin(sunAngle), 0.3];
    gl.uniform3f(this.uSunPosition, sunPos[0], sunPos[1], sunPos[2]);

    const daylight = Math.cos(sunAngle) * 0.5 + 0.5;

    const daySkyColor: [number, number, number] = [0.3, 0.5, 0.9];
    const dayHorizonColor: [number, number, number] = [0.7, 0.8, 1.0];
    const daySunColor: [number, number, number] = [1.0, 0.9, 0.7];

    const nightSkyColor: [number, number, number] = [0.01, 0.01, 0.05];
    const nightHorizonColor: [number, number, number] = [0.02, 0.02, 0.08];
    const nightSunColor: [number, number, number] = [0.1, 0.1, 0.3];

    const skyColor: [number, number, number] = [
      nightSkyColor[0] + (daySkyColor[0] - nightSkyColor[0]) * daylight,
      nightSkyColor[1] + (daySkyColor[1] - nightSkyColor[1]) * daylight,
      nightSkyColor[2] + (daySkyColor[2] - nightSkyColor[2]) * daylight,
    ];
    const horizonColor: [number, number, number] = [
      nightHorizonColor[0] + (dayHorizonColor[0] - nightHorizonColor[0]) * daylight,
      nightHorizonColor[1] + (dayHorizonColor[1] - nightHorizonColor[1]) * daylight,
      nightHorizonColor[2] + (dayHorizonColor[2] - nightHorizonColor[2]) * daylight,
    ];
    const sunColor: [number, number, number] = [
      nightSunColor[0] + (daySunColor[0] - nightSunColor[0]) * daylight,
      nightSunColor[1] + (daySunColor[1] - nightSunColor[1]) * daylight,
      nightSunColor[2] + (daySunColor[2] - nightSunColor[2]) * daylight,
    ];

    gl.uniform3f(this.uSkyColor, skyColor[0], skyColor[1], skyColor[2]);
    gl.uniform3f(this.uHorizonColor, horizonColor[0], horizonColor[1], horizonColor[2]);
    gl.uniform3f(this.uSunColor, sunColor[0], sunColor[1], sunColor[2]);

    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    gl.enable(gl.DEPTH_TEST);
  }
}
