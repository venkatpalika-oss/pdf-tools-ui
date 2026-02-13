document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */

  const API_BASE = "https://pdf-tools-api-c4f5.onrender.com";

  console.log("🚀 PDF Tools JS Loaded");
  console.log("🌐 API BASE:", API_BASE);

  const uploadBoxes = document.querySelectorAll(".upload-box");
  const toolType = document.body.dataset.tool;

  if (!uploadBoxes.length) return;

  /* ================= HELPERS ================= */

  function setStatus(box, text, state = "") {
    const title = box.querySelector(".upload-title");
    if (!title) return;

    title.textContent = text;

    box.classList.remove("has-file", "error", "success", "loading");
    if (state) box.classList.add(state);
  }

  function openDownload(url) {
    window.open(url, "_blank");
  }

  /* ================= COMPRESS ================= */

  async function compressPDF(file, box) {
    try {
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

      const data = await res.json();

      if (!res.ok || !data.downloadUrl) {
        throw new Error(data.error || "Compression failed");
      }

      setStatus(box, "Compression Complete ✅", "success");
      openDownload(data.downloadUrl);

    } catch (err) {
      setStatus(box, "Compression Failed ❌", "error");
      alert(err.message);
    }
  }

  /* ================= MERGE ================= */

  async function mergePDF(files, box) {
    try {
      if (files.length < 2) {
        alert("Please select at least 2 PDF files.");
        return;
      }

      setStatus(box, "Merging… ⏳", "loading");

      const formData = new FormData();
      files.forEach(file => formData.append("files", file));

      const res = await fetch(`${API_BASE}/api/merge`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok || !data.downloadUrl) {
        throw new Error(data.error || "Merge failed");
      }

      setStatus(box, "Merge Complete ✅", "success");
      openDownload(data.downloadUrl);

    } catch (err) {
      setStatus(box, "Merge Failed ❌", "error");
      alert(err.message);
    }
  }

  /* ================= MAIN ================= */

  uploadBoxes.forEach(box => {

    const input = box.querySelector(".file-input");
    if (!input) return;

    box.addEventListener("click", () => input.click());

    input.addEventListener("change", () => {

      if (!input.files.length) return;

      const files = Array.from(input.files);

      if (files.some(file => file.type !== "application/pdf")) {
        setStatus(box, "Only PDF files allowed ❌", "error");
        return;
      }

      setStatus(box,
        files.length === 1 ? files[0].name : `${files.length} files selected`,
        "has-file"
      );

      if (toolType === "compress") {
        compressPDF(files[0], box);
      }

      if (toolType === "merge") {
        mergePDF(files, box);
      }

    });

    /* DRAG & DROP */

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

      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event("change"));
    });

  });

});
