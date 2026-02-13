document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */

  const API_BASE = "https://pdf-tools-api-c4f5.onrender.com";

  console.log("🚀 PDF Tools JS Loaded");
  console.log("🌐 API BASE:", API_BASE);

  /* ================= ELEMENTS ================= */

  const uploadBoxes = document.querySelectorAll(".upload-box");

  if (!uploadBoxes.length) {
    console.log("ℹ️ No upload boxes found on this page.");
    return; // Prevent errors on pages without upload-box
  }

  /* ================= HELPERS ================= */

  function setStatus(box, text, state = "") {
    const title = box.querySelector(".upload-title");
    if (!title) return;

    title.textContent = text;

    box.classList.remove("has-file", "error", "success", "loading");
    if (state) box.classList.add(state);
  }

  async function compressPDF(file, box) {
    try {
      console.log("📤 Sending file:", file.name);

      setStatus(box, "Compressing… ⏳", "loading");

      const formData = new FormData();
      formData.append("file", file);

      // Optional compression level support
      const levelSelect = document.getElementById("levelSelect");
      if (levelSelect) {
        formData.append("level", levelSelect.value);
      }

      const res = await fetch(`${API_BASE}/api/compress`, {
        method: "POST",
        body: formData
      });

      console.log("📡 Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error ${res.status}`);
      }

      const data = await res.json();

      if (!data.downloadUrl) {
        throw new Error("Invalid server response");
      }

      setStatus(box, "Compression complete ✅", "success");

      // Open download in new tab
      window.open(data.downloadUrl, "_blank");

    } catch (err) {
      console.error("❌ Compression failed:", err);
      setStatus(box, "Compression failed ❌", "error");
      alert("Compression failed:\n" + err.message);
    }
  }

  /* ================= MAIN ================= */

  uploadBoxes.forEach(box => {

    const input = box.querySelector(".file-input");

    if (!input) return; // Safety check

    /* CLICK */
    box.addEventListener("click", () => {
      input.click();
    });

    /* FILE SELECT */
    input.addEventListener("change", () => {

      if (!input.files || !input.files.length) return;

      const file = input.files[0];

      if (file.type !== "application/pdf") {
        setStatus(box, "Only PDF files allowed ❌", "error");
        return;
      }

      setStatus(box, file.name, "has-file");
      compressPDF(file, box);
    });

    /* DRAG OVER */
    box.addEventListener("dragover", e => {
      e.preventDefault();
      box.classList.add("dragging");
    });

    /* DRAG LEAVE */
    box.addEventListener("dragleave", () => {
      box.classList.remove("dragging");
    });

    /* DROP */
    box.addEventListener("drop", e => {
      e.preventDefault();
      box.classList.remove("dragging");

      if (!e.dataTransfer.files || !e.dataTransfer.files.length) return;

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
