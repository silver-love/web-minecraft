function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function createProceduralTextureAtlas(gl: WebGL2RenderingContext): WebGLTexture {
  const SIZE = 256;
  const TILE = 16;

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, SIZE, SIZE);

  const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
  const data = imageData.data;

  function px(x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
    const idx = (y * SIZE + x) * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
  }

  function fillTile(ox: number, oy: number, r: number, g: number, b: number): void {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(ox + x, oy + y, r, g, b);
      }
    }
  }

  function noiseTile(ox: number, oy: number, r: number, g: number, b: number, rng: () => number, amount: number): void {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = Math.floor(rng() * amount * 2 - amount);
        px(ox + x, oy + y, r + n, g + n, b + n);
      }
    }
  }

  const drawFns: ((ox: number, oy: number, rng: () => number) => void)[] = [];

  drawFns.push((ox, oy, rng) => {
    noiseTile(ox, oy, 128, 128, 128, rng, 20);
  });

  drawFns.push((ox, oy, rng) => {
    noiseTile(ox, oy, 139, 105, 20, rng, 20);
  });

  drawFns.push((ox, oy, rng) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = Math.floor(rng() * 30 - 15);
        px(ox + x, oy + y, 76 + n, 175 + n, 80 + n);
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = Math.floor(rng() * 20 - 10);
        if (y < 4) {
          px(ox + x, oy + y, 93 + n, 155 + n, 61 + n);
        } else {
          px(ox + x, oy + y, 139 + n, 105 + n, 20 + n);
        }
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    fillTile(ox, oy, 128, 128, 128);
    for (let p = 0; p < 10; p++) {
      const rx = Math.floor(rng() * 12);
      const ry = Math.floor(rng() * 12);
      const rw = Math.floor(rng() * 4) + 2;
      const rh = Math.floor(rng() * 4) + 2;
      const shade = Math.floor(rng() * 80) + 80;
      for (let y = ry; y < Math.min(ry + rh, TILE); y++) {
        for (let x = rx; x < Math.min(rx + rw, TILE); x++) {
          px(ox + x, oy + y, shade, shade, shade);
        }
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = Math.floor(rng() * 20 - 10);
        const line = y % 4 === 0 ? -30 : 0;
        px(ox + x, oy + y, 193 + n + line, 154 + n + line, 107 + n + line);
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    noiseTile(ox, oy, 232, 214, 142, rng, 15);
  });

  drawFns.push((ox, oy, rng) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = Math.floor(rng() * 30);
        px(ox + x, oy + y, 48 + n, 102 + n, 190 + n);
      }
    }
  });

  drawFns.push((ox, oy, _rng) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        if (x === 0 || x === TILE - 1 || y === 0 || y === TILE - 1) {
          px(ox + x, oy + y, 140, 180, 220);
        } else {
          px(ox + x, oy + y, 200, 232, 255);
        }
      }
    }
    for (let y = 2; y < 5; y++) {
      for (let x = 2; x < 5; x++) {
        px(ox + x, oy + y, 255, 255, 255);
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    fillTile(ox, oy, 107, 66, 38);
    const cx = 7.5;
    const cy = 7.5;
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const ring = Math.floor(dist) % 3;
        const n = Math.floor(rng() * 10 - 5);
        if (ring === 0) {
          px(ox + x, oy + y, 140 + n, 100 + n, 60 + n);
        } else if (ring === 1) {
          px(ox + x, oy + y, 107 + n, 66 + n, 38 + n);
        } else {
          px(ox + x, oy + y, 90 + n, 55 + n, 30 + n);
        }
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = Math.floor(rng() * 15 - 7);
        const line = x % 4 === 0 ? -25 : 0;
        px(ox + x, oy + y, 107 + n + line, 66 + n + line, 38 + n + line);
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = Math.floor(rng() * 40 - 20);
        px(ox + x, oy + y, 46 + n, 125 + n, 50 + n);
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    noiseTile(ox, oy, 128, 128, 128, rng, 20);
    for (let s = 0; s < 3; s++) {
      const sx = Math.floor(rng() * 12) + 2;
      const sy = Math.floor(rng() * 12) + 2;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          px(ox + sx + dx, oy + sy + dy, 51, 51, 51);
        }
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    noiseTile(ox, oy, 128, 128, 128, rng, 20);
    for (let s = 0; s < 3; s++) {
      const sx = Math.floor(rng() * 12) + 2;
      const sy = Math.floor(rng() * 12) + 2;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          px(ox + sx + dx, oy + sy + dy, 212, 184, 151);
        }
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    noiseTile(ox, oy, 128, 128, 128, rng, 20);
    for (let s = 0; s < 3; s++) {
      const sx = Math.floor(rng() * 12) + 2;
      const sy = Math.floor(rng() * 12) + 2;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          px(ox + sx + dx, oy + sy + dy, 252, 219, 77);
        }
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    noiseTile(ox, oy, 128, 128, 128, rng, 20);
    for (let s = 0; s < 3; s++) {
      const sx = Math.floor(rng() * 12) + 2;
      const sy = Math.floor(rng() * 12) + 2;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          px(ox + sx + dx, oy + sy + dy, 93, 236, 240);
        }
      }
    }
  });

  drawFns.push((ox, oy, rng) => {
    noiseTile(ox, oy, 51, 51, 51, rng, 20);
  });

  drawFns.push((ox, oy, rng) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = Math.floor(rng() * 60 - 30);
        px(ox + x, oy + y, 136 + n, 136 + n, 136 + n);
      }
    }
  });

  drawFns.push((ox, oy, _rng) => {
    for (let y = 6; y < 16; y++) {
      px(ox + 7, oy + y, 107, 66, 38);
      px(ox + 8, oy + y, 107, 66, 38);
    }
    for (let y = 3; y < 6; y++) {
      for (let x = 6; x < 10; x++) {
        px(ox + x, oy + y, 255, 160, 0);
      }
    }
    px(ox + 7, oy + 4, 255, 255, 0);
    px(ox + 8, oy + 4, 255, 255, 0);
  });

  for (let i = 0; i < drawFns.length; i++) {
    const col = i % 16;
    const row = Math.floor(i / 16);
    const ox = col * 16;
    const oy = row * 16;
    const rng = seededRandom(i * 1000 + 42);
    drawFns[i](ox, oy, rng);
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
}
