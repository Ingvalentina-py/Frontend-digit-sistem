const API = "https://backend-digit-sistem.vercel.app/api";

const sampleCanvas = document.getElementById("sampleCanvas");
const sampleCtx = sampleCanvas.getContext("2d");

const drawCanvas = document.getElementById("drawCanvas");
const drawCtx = drawCanvas.getContext("2d");

const tinyCanvas = document.getElementById("tinyCanvas");
const tinyCtx = tinyCanvas.getContext("2d");

function draw8x8OnCanvas(grid8x8, ctx, size = 160) {
  const cell = size / 8;
  ctx.clearRect(0, 0, size, size);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const v = grid8x8[r][c]; // típicamente 0..16 aprox
      // normalizamos a 0..255
      const intensity = Math.max(0, Math.min(255, Math.round((v / 16) * 255)));
      ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
}

// ---- 1) Cargar sample del dataset
document.getElementById("btnLoadSample").onclick = async () => {
  const index = document.getElementById("sampleIndex").value;
  const split = document.getElementById("sampleSplit").value;

  const res = await fetch(`${API}/sample?index=${index}&split=${split}`);
  const data = await res.json();

  document.getElementById("sampleLabel").textContent = data.label;
  draw8x8OnCanvas(data.grid8x8, sampleCtx, 160);
};

// ---- 2) Canvas de dibujo
let drawing = false;

function setupDrawing() {
  drawCtx.fillStyle = "black";
  drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

  drawCtx.lineWidth = 18;
  drawCtx.lineCap = "round";
  drawCtx.strokeStyle = "white";

  drawCanvas.addEventListener("mousedown", () => (drawing = true));
  drawCanvas.addEventListener("mouseup", () => (drawing = false));
  drawCanvas.addEventListener("mouseleave", () => (drawing = false));

  drawCanvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
    drawCtx.lineTo(x + 0.1, y + 0.1);
    drawCtx.stroke();
  });
}

function clearDraw() {
  drawCtx.fillStyle = "black";
  drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
  document.getElementById("predOut").textContent = "-";
}
document.getElementById("btnClear").onclick = clearDraw;

// Convertir dibujo 240x240 -> 8x8 promedio por bloque
function drawingTo8x8() {
  const img = drawCtx.getImageData(
    0,
    0,
    drawCanvas.width,
    drawCanvas.height,
  ).data;

  const W = drawCanvas.width;
  const H = drawCanvas.height;
  const blockW = W / 8;
  const blockH = H / 8;

  const grid = [];
  const pixels64 = [];

  for (let r = 0; r < 8; r++) {
    const row = [];
    for (let c = 0; c < 8; c++) {
      let sum = 0;
      let count = 0;

      const x0 = Math.floor(c * blockW);
      const y0 = Math.floor(r * blockH);
      const x1 = Math.floor((c + 1) * blockW);
      const y1 = Math.floor((r + 1) * blockH);

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * W + x) * 4;
          // pixel blanco=255, negro=0 (tomamos canal R)
          const val = img[idx];
          sum += val;
          count++;
        }
      }

      const avg = sum / count; // 0..255
      // dataset suele estar en 0..16. Escalamos:
      const scaled = (avg / 255) * 16;

      row.push(scaled);
      pixels64.push(scaled);
    }
    grid.push(row);
  }

  return { grid, pixels64 };
}

// ---- 2) Predecir
document.getElementById("btnPredict").onclick = async () => {
  const model = document.getElementById("modelSelect").value;
  const { grid, pixels64 } = drawingTo8x8();

  // mostrar vista 8x8
  draw8x8OnCanvas(grid, tinyCtx, 160);

  const res = await fetch(`${API}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, pixels: pixels64 }),
  });

  const data = await res.json();
  document.getElementById("predOut").textContent = data.prediction;
};

// ---- 3) Métricas
document.getElementById("btnMetrics").onclick = async () => {
  const res = await fetch(`${API}/metrics`);
  const data = await res.json();
  document.getElementById("metricsOut").textContent = JSON.stringify(
    data,
    null,
    2,
  );
};

setupDrawing();
clearDraw();
