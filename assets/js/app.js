document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */

  // 🔴 IMPORTANT: Render backend (PRODUCTION)
  const API_BASE = "https://pdf-tools-api-ikhx.onrender.com";

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
      setStatus(box, "Compressing… ⏳", "loading");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/compress`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();

      if (!data.outputUrl) {
        throw new Error("No output file returned");
      }

      // Success
      setStatus(box, "Compression complete ✅", "success");

      // Auto-download
      window.open(data.outputUrl, "_blank");

    } catch (err) {
      console.error("Compress error:", err);
      setStatus(box, "Compression failed ❌", "error");
    }
  }

  /* ================= MAIN ================= */

  uploadBoxes.forEach(box => {
    const input = box.querySelector(".file-input");

    // Click to upload
    box.addEventListener("click", () => {
      input.click();
    });

    // File selected
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

    // Drag over
    box.addEventListener("dragover", e => {
      e.preventDefault();
      box.classList.add("dragging");
    });

    // Drag leave
    box.addEventListener("dragleave", () => {
      box.classList.remove("dragging");
    });

    // Drop file
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
