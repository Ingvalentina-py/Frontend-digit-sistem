const API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://backend-digit-sistem.vercel.app/";

const cipherInput = document.getElementById("cipherInput");
const predictedLabel = document.getElementById("predictedLabel");
const confidenceOut = document.getElementById("confidenceOut");
const decryptedOut = document.getElementById("decryptedOut");
const probabilitiesOut = document.getElementById("probabilitiesOut");
const detailsOut = document.getElementById("detailsOut");
const metricsOut = document.getElementById("metricsOut");

document.getElementById("btnClear").onclick = () => {
  cipherInput.value = "";
  predictedLabel.textContent = "-";
  confidenceOut.textContent = "-";
  decryptedOut.textContent = "-";
  probabilitiesOut.textContent = "-";
  detailsOut.textContent = "-";
};

document.getElementById("btnSample").onclick = async () => {
  const index = Math.floor(Math.random() * 10000);
  const res = await fetch(`${API}/sample?index=${index}`);
  const data = await res.json();
  cipherInput.value = data.text;
};

document.getElementById("btnAnalyze").onclick = async () => {
  const text = cipherInput.value.trim();

  if (!text) {
    alert("Debes ingresar un texto.");
    return;
  }

  predictedLabel.textContent = "Analizando...";
  confidenceOut.textContent = "-";
  decryptedOut.textContent = "-";
  probabilitiesOut.textContent = "-";
  detailsOut.textContent = "-";

  try {
    const res = await fetch(`${API}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Error al analizar");
    }

    predictedLabel.textContent = data.predicted_label || "-";
    confidenceOut.textContent =
      data.confidence !== null && data.confidence !== undefined
        ? `${(data.confidence * 100).toFixed(2)}%`
        : "-";

    decryptedOut.textContent = data.decrypted_text || "-";
    probabilitiesOut.textContent = JSON.stringify(data.probabilities, null, 2);
    detailsOut.textContent = JSON.stringify(data.decryption_details, null, 2);
  } catch (error) {
    predictedLabel.textContent = "Error";
    decryptedOut.textContent = error.message;
  }
};

document.getElementById("btnMetrics").onclick = async () => {
  try {
    const res = await fetch(`${API}/metrics`);
    const data = await res.json();
    metricsOut.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    metricsOut.textContent = error.message;
  }
};
