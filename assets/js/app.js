/* =========================================================
   PDF Tools – Frontend App Logic
   File: assets/js/app.js
   Environment: GitHub Pages → Render API
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */

  // 🔥 IMPORTANT: Render backend base URL (CORRECT ONE)
  const API_BASE = "https://pdf-tools-api-ikhx.onrender.com";

  /* ================= UPLOAD BOX LOGIC ================= */

  const uploadBoxes = document.querySelectorAll(".upload-box");

  uploadBoxes.forEach(box => {
    const input = box.querySelector(".file-input");
    const title = box.querySelector(".upload-title");

    if (!input || !title) return;

    // Click to upload
    box.addEventListener("click", () => {
      input.click();
    });

    // File selected via dialog
    input.addEventListener("change", () => {
      if (input.files.length > 0) {
        title.textContent = input.files[0].name;
        box.classList.add("has-file");

        // Auto-start compress after selection
        compressPDF(input.files[0], title);
      }
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

      if (e.dataTransfer.files.length > 0) {
        input.files = e.dataTransfer.files;
        title.textContent = e.dataTransfer.files[0].name;
        box.classList.add("has-file");

        // Auto-start compress after drop
        compressPDF(e.dataTransfer.files[0], title);
      }
    });
  });

  /* ================= COMPRESS PDF ================= */

  async function compressPDF(file, titleEl) {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    // UI feedback
    titleEl.textContent = "Compressing PDF… ⏳";

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/api/compress`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Compression failed");
      }

      const data = await response.json();

      if (!data.downloadUrl) {
        throw new Error("No download URL returned");
      }

      // Build full download URL
      const downloadLink = `${API_BASE}${data.downloadUrl}`;

      // Update UI
      titleEl.innerHTML = `
        <a href="${downloadLink}" target="_blank" style="color:#0b5ed7;">
          Download Compressed PDF ⬇️
        </a>
      `;

    } catch (err) {
      console.error("Compress error:", err);
      titleEl.textContent = "Compression failed ❌";
      alert("Sorry, PDF compression failed. Please try again.");
    }
  }

});
