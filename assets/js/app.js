document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */

  const API_BASE = "https://pdf-tools-api-c4f5.onrender.com";

  console.log("🚀 PDF Tools JS Loaded");
  console.log("🌐 API BASE:", API_BASE);

  /* ================= ELEMENTS ================= */

  const uploadBoxes = document.querySelectorAll(".upload-box");
  const tool = document.body.dataset.tool;

  if (!uploadBoxes.length) {
    console.log("ℹ️ No upload boxes found on this page.");
    return;
  }

  /* ================= HELPERS ================= */

  function setStatus(box, text, state = "") {
    const title = box.querySelector(".upload-title");
    if (!title) return;

    title.textContent = text;

    box.classList.remove("has-file", "error", "success", "loading");
    if (state) box.classList.add(state);
  }

  function validatePDFs(files, box) {
    for (let i = 0; i < files.length; i++) {
      if (files[i].type !== "application/pdf") {
        setStatus(box, "Only PDF files allowed ❌", "error");
        return false;
      }
    }
    return true;
  }

  /* ================= COMPRESS ================= */

  async function compressPDF(file, box) {
    try {
      console.log("📤 Compressing:", file.name);
      setStatus(box, "Compressing… ⏳", "loading");

      const formData = new FormData();
      formData.append("file", file);

      const levelSelect = document.getElementById("levelSelect");
      if (levelSelect) {
        formData.append("level", levelSelect.value);
      }

      const res = await fetch(`${API_BASE}/api/compress`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error ${res.status}`);
      }

      const data = await res.json();

      if (!data.downloadUrl) {
        throw new Error("Invalid server response");
      }

      setStatus(box, "Compression complete ✅", "success");
      window.open(data.downloadUrl, "_blank");

    } catch (err) {
      console.error("❌ Compression failed:", err);
      setStatus(box, "Compression failed ❌", "error");
      alert("Compression failed:\n" + err.message);
    }
  }

  /* ================= MERGE ================= */

  async function mergePDF(files, box) {
    try {
      console.log("📤 Merging files:", files.length);
      setStatus(box, "Merging… ⏳", "loading");

      const formData = new FormData();

      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch(`${API_BASE}/api/merge`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error ${res.status}`);
      }

      const data = await res.json();

      if (!data.downloadUrl) {
        throw new Error("Invalid merge response");
      }

      setStatus(box, "Merge complete ✅", "success");
      window.open(data.downloadUrl, "_blank");

    } catch (err) {
      console.error("❌ Merge failed:", err);
      setStatus(box, "Merge failed ❌", "error");
      alert("Merge failed:\n" + err.message);
    }
  }

  /* ================= MAIN ================= */

  uploadBoxes.forEach(box => {

    const input = box.querySelector(".file-input");
    if (!input) return;

    /* CLICK */
    box.addEventListener("click", () => {
      input.click();
    });

    /* FILE SELECT */
    input.addEventListener("change", () => {

      if (!input.files || !input.files.length) return;

      if (!validatePDFs(input.files, box)) return;

      if (tool === "merge") {
        setStatus(box, `${input.files.length} files selected`, "has-file");
        mergePDF(input.files, box);
      }
      else if (tool === "compress") {
        const file = input.files[0];
        setStatus(box, file.name, "has-file");
        compressPDF(file, box);
      }

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
      if (!validatePDFs(e.dataTransfer.files, box)) return;

      input.files = e.dataTransfer.files;

      if (tool === "merge") {
        setStatus(box, `${input.files.length} files selected`, "has-file");
        mergePDF(input.files, box);
      }
      else if (tool === "compress") {
        const file = input.files[0];
        setStatus(box, file.name, "has-file");
        compressPDF(file, box);
      }

    });

  });

});
