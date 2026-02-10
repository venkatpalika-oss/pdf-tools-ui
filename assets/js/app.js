document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */

  const API_BASE = "https://pdf-tools-api-ikhx.onrender.com";

  console.log("🚀 Compress tool JS loaded");
  console.log("🌐 API BASE:", API_BASE);

  /* ================= ELEMENTS ================= */

  const uploadBoxes = document.querySelectorAll(".upload-box");

  /* ================= HELPERS ================= */

  function setStatus(box, text, state = "") {
    const title = box.querySelector(".upload-title");
    title.textContent = text;

    box.classList.remove("has-file", "error", "success", "loading");
    if (state) box.classList.add(state);
  }

  async function compressPDF(file, box) {
    try {
      console.log("📤 Sending file to backend:", file.name);

      setStatus(box, "Compressing… ⏳", "loading");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/compress`, {
        method: "POST",
        body: formData
      });

      console.log("📡 Backend response status:", res.status);

      const text = await res.text();
      console.log("📦 Raw backend response:", text);

      if (!res.ok) {
        throw new Error(text || `Server error ${res.status}`);
      }

      const data = JSON.parse(text);

      if (!data.outputUrl) {
        throw new Error("No outputUrl returned from backend");
      }

      setStatus(box, "Compression complete ✅", "success");

      window.open(data.outputUrl, "_blank");

    } catch (err) {
      console.error("❌ Compress failed:", err);
      setStatus(box, "Compression failed ❌", "error");
      alert("Compress failed:\n" + err.message);
    }
  }

  /* ================= MAIN ================= */

  uploadBoxes.forEach(box => {
    const input = box.querySelector(".file-input");

    box.addEventListener("click", () => {
      input.click();
    });

    input.addEventListener("change", () => {
      if (!input.files.length) return;

      const file = input.files[0];

      if (file.type !== "application/pdf") {
        setStatus(box, "Only PDF files allowed ❌", "error");
        return;
      }

      setStatus(box, file.name, "has-file");
      compressPDF(file, box);
    });

    box.addEventListener("dragover", e => {
      e.preventDefault();
      box.classList.add("dragging");
    });

    box.addEventListener("dragleave", () => {
      box.classList.remove("dragging");
    });

    box.addEventListener("drop", e => {
      e.preventDefault();
      box.classList.remove("dragging");

      if (!e.dataTransfer.files.length) return;

      const file = e.dataTransfer.files[0];

      if (file.type !== "application/pdf") {
        setStatus(box, "Only PDF files allowed ❌", "error");
        return;
      }

      input.files = e.dataTransfer.files;
      setStatus(box, file.name, "has-file");
      compressPDF(file, box);
    });
  });

});
