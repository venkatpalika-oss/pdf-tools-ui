import { apiRequest } from "./api.js";
import { initAuthUI } from "./auth.js";
import { tools } from "./tools-config.js";

document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */

  const API_BASE = "https://pdf-tools-api-c4f5.onrender.com";

  console.log("🚀 PDF Tools JS Loaded");
  console.log("🌐 API BASE:", API_BASE);

  const uploadBoxes = document.querySelectorAll(".upload-box");

  let toolType = document.body.dataset.tool;

  /* ===== dynamic fallback for template ===== */

  if (!toolType) {

    const path = window.location.pathname;
    const slug = path.split("/").pop().replace(".html","");

    const tool = tools.find(t => t.slug === slug);

    if (tool) {

      const endpoint = tool.api.replace("/","");

      toolType = endpoint;

      console.log("Dynamic tool detected:", toolType);

    }

  }

  if (!uploadBoxes.length) return;

  /* ================= HELPERS ================= */

  function setStatus(box, text, state = "") {

    const title = box.querySelector(".upload-title");
    if (!title) return;

    title.textContent = text;

    box.classList.remove("has-file","error","success","loading");

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

  function formatFileSize(bytes){

    const mb = bytes / (1024*1024);

    if(mb >= 1) return mb.toFixed(2)+" MB";

    return (bytes/1024).toFixed(1)+" KB";

  }

  function isValidFileType(file) {

    if (toolType === "jpg-to-pdf") {

      return file.type === "image/jpeg" || file.type === "image/jpg";

    }

    return file.type === "application/pdf";

  }

  /* ================= PROGRESS + REQUEST ================= */

  async function sendRequest(endpoint, formData, box, loadingText) {

    try {

      const progressContainer = box.querySelector(".progress-container");
      const progressBar = box.querySelector(".progress-bar");

      setStatus(box, loadingText, "loading");

      if (progressContainer) {

        progressContainer.style.display = "block";
        progressBar.style.width = "10%";

      }

      let progress = 10;

      const interval = setInterval(() => {

        progress += Math.random() * 12;

        if (progress > 85) progress = 85;

        if (progressBar) progressBar.style.width = progress + "%";

      },250);

      const data = await apiRequest(endpoint,{
        method:"POST",
        body:formData
      });

      clearInterval(interval);

      if (!data || !data.downloadUrl) {
        throw new Error("Invalid server response");
      }

      if (progressBar) progressBar.style.width = "100%";

      const title = box.querySelector(".upload-title");

      setTimeout(()=>{

title.innerHTML = `
<div class="result-actions">

<div class="result-success">Completed ✅</div>

${data.originalSize ? `
<div class="compression-info">
<div>Original: ${(data.originalSize/(1024*1024)).toFixed(2)} MB</div>
<div>Compressed: ${(data.compressedSize/(1024*1024)).toFixed(2)} MB</div>
<div class="saved-percent">Saved ${data.savedPercent}%</div>
</div>
`:""}

<button class="download-btn">Download File</button>
<button class="upload-again-btn">Upload Another</button>

</div>
`;

const downloadBtn = box.querySelector(".download-btn");
const againBtn = box.querySelector(".upload-again-btn");

downloadBtn.addEventListener("click",()=>{
safeDownload(data.downloadUrl);
});

againBtn.addEventListener("click",()=>{
window.location.reload();
});

if(progressContainer){

progressContainer.style.display="none";
progressBar.style.width="0%";

}

},600);

    }

    catch(error){

      console.error("❌ API Error:",error);

      setStatus(box,"Failed ❌","error");

      const progressContainer = box.querySelector(".progress-container");

      if(progressContainer) progressContainer.style.display="none";

      alert(error.message || "Processing failed.");

    }

  }

  /* ================= TOOL FUNCTIONS ================= */

  function compressPDF(file,box){

    const formData=new FormData();

    formData.append("file",file);

    const levelSelect=document.getElementById("levelSelect");

    if(levelSelect){
      formData.append("level",levelSelect.value);
    }

    sendRequest("/api/compress",formData,box,"Compressing… ⏳");

  }

  function mergePDF(files,box){

    if(files.length<2){

      alert("Please select at least 2 PDF files.");

      return;

    }

    const formData=new FormData();

    files.forEach(file=>formData.append("files",file));

    sendRequest("/api/merge",formData,box,"Merging… ⏳");

  }

  function splitPDF(file,box){

    const formData=new FormData();

    formData.append("file",file);

    sendRequest("/api/split",formData,box,"Splitting… ⏳");

  }

  function pdfToImage(file,box){

    const formData=new FormData();

    formData.append("file",file);

    sendRequest("/api/pdf-to-image",formData,box,"Converting to Images… ⏳");

  }

  function watermarkPDF(file,box){

    const formData=new FormData();

    formData.append("file",file);

    const watermarkInput=document.getElementById("watermarkText");

    const text=watermarkInput?.value?.trim() || "CONFIDENTIAL";

    formData.append("text",text);

    sendRequest("/api/watermark",formData,box,"Adding Watermark… ⏳");

  }

  function pdfToWord(file,box){

    const formData=new FormData();

    formData.append("file",file);

    sendRequest("/api/pdf-to-word",formData,box,"Converting to Word… ⏳");

  }

  function jpgToPDF(files,box){

    const formData=new FormData();

    files.forEach(file=>formData.append("files",file));

    sendRequest("/api/jpg-to-pdf",formData,box,"Converting to PDF… ⏳");

  }

  function unlockPDF(file,box){

    const formData=new FormData();

    formData.append("file",file);

    const password=document.getElementById("passwordInput")?.value || "";

    formData.append("password",password);

    sendRequest("/api/unlock",formData,box,"Unlocking… ⏳");

  }

  /* ================= MAIN ================= */

  uploadBoxes.forEach(box=>{

    const input=box.querySelector(".file-input");

    if(!input) return;

    box.addEventListener("click",()=>input.click());

    input.addEventListener("change",()=>{

      if(!input.files.length) return;

      const files=Array.from(input.files);

      if(files.some(file=>!isValidFileType(file))){

        setStatus(box,"Invalid file type ❌","error");

        return;

      }

      box.classList.add("has-file");

      const queue = box.querySelector(".file-queue");

      if(queue){

        queue.innerHTML="";

        files.forEach((file)=>{

          const item=document.createElement("div");
          item.className="file-item";

          item.innerHTML=`
          <span>${file.name} (${formatFileSize(file.size)})</span>
          <span class="file-remove">✖</span>
          `;

          item.querySelector(".file-remove").addEventListener("click",(e)=>{

            e.stopPropagation();

            item.remove();

          });

          queue.appendChild(item);

        });

      }

      switch(toolType){

        case "compress":
        compressPDF(files[0],box);
        break;

        case "merge":
        mergePDF(files,box);
        break;

        case "split":
        splitPDF(files[0],box);
        break;

        case "pdf-to-image":
        pdfToImage(files[0],box);
        break;

        case "watermark":
        watermarkPDF(files[0],box);
        break;

        case "pdf-to-word":
        pdfToWord(files[0],box);
        break;

        case "jpg-to-pdf":
        jpgToPDF(files,box);
        break;

        case "unlock":
        unlockPDF(files[0],box);
        break;

        default:
        console.warn("Unknown tool type:",toolType);

      }

    });

  });

  /* ================= AUTH UI ================= */

  initAuthUI();

});
