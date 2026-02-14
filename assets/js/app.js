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

  function safeDownload(url) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ================= PROGRESS + REQUEST ================= */

  async function sendRequest(endpoint, formData, box, loadingText) {
    try {

      const progressContainer = box.querySelector(".progress-container");
      const progressBar = box.querySelector(".progress-bar");

      setStatus(box, loadingText, "loading");

      // Show progress bar
      if (progressContainer) {
        progressContainer.style.display = "block";
        progressBar.style.width = "10%";
      }

      // Fake smooth animated progress
      let progress = 10;
      const interval = setInterval(() => {
        progress += Math.random() * 12;
        if (progress > 85) progress = 85;
        if (progressBar) progressBar.style.width = progress + "%";
      }, 250);

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        body: formData
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error ${response.status}`);
      }

      const data = await response.json();

      if (!data.downloadUrl) {
        throw new Error("Invalid server response");
      }

      if (progressBar) progressBar.style.width = "100%";

      setTimeout(() => {
        setStatus(box, "Completed ✅", "success");
        safeDownload(data.downloadUrl);

        if (progressContainer) {
          progressContainer.style.display = "none";
          progressBar.style.width = "0%";
        }
      }, 600);

    } catch (error) {
      console.error("❌ API Error:", error);
      setStatus(box, "Failed ❌", "error");

      const progressContainer = box.querySelector(".progress-container");
      if (progressContainer) progressContainer.style.display = "none";

      alert(error.message);
    }
  }

  /* ================= TOOL FUNCTIONS ================= */

  function compressPDF(file, box) {
    const formData = new FormData();
    formData.append("file", file);

    const levelSelect = document.getElementById("levelSelect");
    if (levelSelect) {
      formData.append("level", levelSelect.value);
    }

    sendRequest("/api/compress", formData, box, "Compressing… ⏳");
  }

  function mergePDF(files, box) {
    if (files.length < 2) {
      alert("Please select at least 2 PDF files.");
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    sendRequest("/api/merge", formData, box, "Merging… ⏳");
  }

  function splitPDF(file, box) {
    const formData = new FormData();
    formData.append("file", file);

    sendRequest("/api/split", formData, box, "Splitting… ⏳");
  }

  function pdfToImage(file, box) {
    const formData = new FormData();
    formData.append("file", file);

    sendRequest("/api/pdf-to-image", formData, box, "Converting to Images… ⏳");
  }

  function watermarkPDF(file, box) {
    const formData = new FormData();
    formData.append("file", file);

    const watermarkInput = document.getElementById("watermarkText");
    const text = watermarkInput?.value?.trim() || "CONFIDENTIAL";

    formData.append("text", text);

    sendRequest("/api/watermark", formData, box, "Adding Watermark… ⏳");
  }

  function pdfToWord(file, box) {
    const formData = new FormData();
    formData.append("file", file);

    sendRequest("/api/pdf-to-word", formData, box, "Converting to Word… ⏳");
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

      // File preview animation
      box.classList.add("has-file");

      const fileName = files.length === 1
        ? files[0].name
        : `${files.length} files selected`;

      const title = box.querySelector(".upload-title");
      title.innerHTML = `📄 <strong>${fileName}</strong>`;
      title.style.animation = "popFile 0.4s ease";

      switch (toolType) {

        case "compress":
          compressPDF(files[0], box);
          break;

        case "merge":
          mergePDF(files, box);
          break;

        case "split":
          splitPDF(files[0], box);
          break;

        case "pdf-to-image":
          pdfToImage(files[0], box);
          break;

        case "watermark":
          watermarkPDF(files[0], box);
          break;

        case "pdf-to-word":
          pdfToWord(files[0], box);
          break;

        default:
          console.warn("Unknown tool type:", toolType);
      }

    });

    /* ================= DRAG & DROP ================= */

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
