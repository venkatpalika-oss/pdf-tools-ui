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

  function forceDownload(url) {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 5000);
  }

  async function sendRequest(endpoint, formData, box, loadingText) {
    try {
      setStatus(box, loadingText, "loading");

      const res = await fetch(`${API_BASE}${endpoint}`, {
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

      setStatus(box, "Completed ✅", "success");
      forceDownload(data.downloadUrl);

    } catch (err) {
      console.error("❌ Request failed:", err);
      setStatus(box, "Failed ❌", "error");
      alert(err.message);
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
    const text = watermarkInput?.value || "CONFIDENTIAL";

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

      setStatus(
        box,
        files.length === 1 ? files[0].name : `${files.length} files selected`,
        "has-file"
      );

      /* TOOL SWITCH */

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
