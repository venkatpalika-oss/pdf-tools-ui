import { apiRequest } from "./api.js";
import { initAuthUI, getToken } from "./auth.js";
import { tools } from "./tools-config.js";

document.addEventListener("DOMContentLoaded", () => {

  /* ================= CONFIG ================= */

  const API_BASE = "https://pdf-tools-api-c4f5.onrender.com";
  const FREE_FILE_LIMIT_MB = 20;
  const ANON_LIMIT = 2;

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

  /* ================= ANON LOGIN WALL ================= */

  function getAnonUsage(){
    const usage = localStorage.getItem("anonUsage");
    return usage ? parseInt(usage) : 0;
  }

  function incrementAnonUsage(){
    const current = getAnonUsage();
    localStorage.setItem("anonUsage", current + 1);
  }

  function checkLoginWall(){

    const token = getToken();

    if(!token){

      const usage = getAnonUsage();

      if(usage >= ANON_LIMIT){

        alert("Create a free account to continue using PaperlyTools.");
        window.location.href = "/login.html";
        return false;

      }

      incrementAnonUsage();
    }

    return true;
  }

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

  function validateFileSize(file){

    const sizeMB = file.size / (1024*1024);

    if(sizeMB > FREE_FILE_LIMIT_MB){

      alert(`File too large. Free plan supports up to ${FREE_FILE_LIMIT_MB} MB.`);
      return false;

    }

    return true;

  }
    function getAITextInput(){

    const input = document.querySelector(".ai-text-input");

    if(!input) return "";

    return input.value.trim();

  }

    function getLanguageSelection(){

    const select = document.querySelector(".language-select");

    if(!select) return "English";

    return select.value;

  }
    

  /* ================= AI REQUEST ================= */

async function sendAIRequest(endpoint, payload, box, loadingText){

  try{

    setStatus(box, loadingText, "loading");

    const data = await apiRequest(endpoint,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify(payload)
    });

    if(!data){
      throw new Error("AI returned no response");
    }

    const result =
      data.summary ||
      data.paraphrased ||
      data.translation ||
      data.corrected ||
      data.email ||
      data.coverLetter ||
      data.analysis ||
      data.answer;

    if(!result){
      throw new Error("Invalid AI response");
    }

    const title = box.querySelector(".upload-title");

    title.innerHTML = `
    <div class="result-actions">

      <div class="result-success">
        AI Result ✨
      </div>

      <div class="ai-result">
        ${result.replace(/\n/g,"<br>")}
      </div>

      <button class="upload-again-btn">
        Try Again
      </button>

    </div>
    `;

    const againBtn = box.querySelector(".upload-again-btn");

    againBtn.addEventListener("click",()=>{
      window.location.reload();
    });

  }
  catch(error){

    console.error("AI Error:",error);

    setStatus(box,"AI Failed ❌","error");

    alert(error.message || "AI processing failed");

  }

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
        throw new Error(data?.error || "Invalid server response");
      }

      if (progressBar) progressBar.style.width = "100%";

      const title = box.querySelector(".upload-title");

      setTimeout(()=>{

title.innerHTML = `
<div class="result-actions">

<div class="result-success">Completed ✅</div>

${data.usage ? `
<div class="usage-info">
Free files remaining today: ${data.usage.remaining ?? "Unlimited"}
</div>
` : ""}

${data.originalSize ? `
<div class="compression-info">
<div>Original: ${(data.originalSize/(1024*1024)).toFixed(2)} MB</div>
<div>Compressed: ${(data.compressedSize/(1024*1024)).toFixed(2)} MB</div>
<div class="saved-percent">Saved ${data.savedPercent}%</div>
</div>
`:""}

${data.usage && data.usage.remaining === 0 ? `
<button class="upgrade-btn">Upgrade to Download</button>
` : `
<button class="download-btn">Download File</button>
`}

<button class="upload-again-btn">Upload Another</button>

</div>
`;

const downloadBtn = box.querySelector(".download-btn");
const upgradeBtn = box.querySelector(".upgrade-btn");
const againBtn = box.querySelector(".upload-again-btn");

if(downloadBtn){
downloadBtn.addEventListener("click",()=>{
safeDownload(data.downloadUrl);
});
}

if(upgradeBtn){
upgradeBtn.addEventListener("click",()=>{
window.location.href="/pricing.html";
});
}

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

      if(!checkLoginWall()) return;

      if(!input.files.length) return;

      const files=Array.from(input.files);

      if(files.some(file=>!isValidFileType(file) || !validateFileSize(file))){
        setStatus(box,"Invalid file ❌","error");
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


  /* ================= AI TEXT TOOLS ================= */

  case "ai-summarize":

  const summarizeText = getAITextInput();

  if(!summarizeText){
    alert("Please enter text to summarize.");
    return;
  }

  sendAIRequest("/api/ai/summarize",
    { text: summarizeText },
    box,
    "Summarizing… 🤖"
  );

  break;


  case "ai-paraphrase":

  const paraphraseText = getAITextInput();

  if(!paraphraseText){
    alert("Please enter text to rewrite.");
    return;
  }

  sendAIRequest("/api/ai/paraphrase",
    { text: paraphraseText },
    box,
    "Rewriting… 🤖"
  );

  break;


  case "ai-grammar":

  const grammarText = getAITextInput();

  if(!grammarText){
    alert("Please enter text.");
    return;
  }

  sendAIRequest("/api/ai/grammar-fix",
    { text: grammarText },
    box,
    "Fixing grammar… 🤖"
  );

  break;


  case "ai-translate":

  const translateText = getAITextInput();

  if(!translateText){
    alert("Please enter text to translate.");
    return;
  }

  const language = getLanguageSelection();

  sendAIRequest("/api/ai/translate",
    { text: translateText, language: language },
    box,
    "Translating… 🌍"
  );

  break;


  case "ai-email-writer":

  const emailTopic = getAITextInput();

  if(!emailTopic){
    alert("Please enter an email topic.");
    return;
  }

  sendAIRequest("/api/ai/email-writer",
    { topic: emailTopic },
    box,
    "Writing email… ✉️"
  );

  break;


  case "ai-resume-analyzer":

const resumeFile = files[0];

const formData = new FormData();
formData.append("file", resumeFile);

sendRequest("/api/ai/resume-analyzer",
  formData,
  box,
  "Analyzing resume… 📄"
);

break;


  case "ai-cover-letter":

  const coverText = getAITextInput();

  if(!coverText){
    alert("Please provide your details.");
    return;
  }

  sendAIRequest("/api/ai/cover-letter",
    { text: coverText },
    box,
    "Generating cover letter… 🧠"
  );

  break;


  default:
  console.warn("Unknown tool type:",toolType);

}

    });

  });

  /* ================= AUTH UI ================= */

  initAuthUI();

});
/* =========================================
   Cursor Glow Effect
========================================= */

const cursorGlow = document.querySelector(".cursor-glow");

document.addEventListener("mousemove", (e) => {
  if (!cursorGlow) return;

  cursorGlow.style.left = e.clientX + "px";
  cursorGlow.style.top = e.clientY + "px";
});


/* =========================================
   Interactive Upload Glow
========================================= */

const upload = document.getElementById("homeUpload");
const uploadGlow = document.querySelector(".upload-glow");

if (upload && uploadGlow) {

  upload.addEventListener("mousemove", (e) => {
    const rect = upload.getBoundingClientRect();

    uploadGlow.style.left = (e.clientX - rect.left) + "px";
    uploadGlow.style.top = (e.clientY - rect.top) + "px";
  });

  upload.addEventListener("mouseleave", () => {
    uploadGlow.style.opacity = "0";
  });

  upload.addEventListener("mouseenter", () => {
    uploadGlow.style.opacity = "1";
  });

}
/* =========================================
   Header Scroll Glow
========================================= */

const header = document.querySelector(".site-header");

if (header) {

  window.addEventListener("scroll", () => {

    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

  });

}
