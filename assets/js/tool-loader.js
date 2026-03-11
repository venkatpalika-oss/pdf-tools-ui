import { tools } from "./tools-config.js";

/*
=========================================================
DETECT CURRENT TOOL
=========================================================
*/

const path = window.location.pathname;

// extract filename
const file = path.split("/").pop().replace(".html", "");

// find tool from config
const tool = tools.find(t => t.slug === file);

if (!tool) {
  console.warn("Tool not found in config:", file);
} else {

  /*
  =========================================================
  UPDATE PAGE META
  =========================================================
  */

  document.title = tool.title;

  const titleEl = document.querySelector(".tool-title");
  const descEl = document.querySelector(".tool-description");

  if (titleEl) titleEl.textContent = tool.title;
  if (descEl) descEl.textContent = tool.description;

  /*
  =========================================================
  GLOBAL TOOL VARIABLES
  =========================================================
  */

  // API endpoint used by app.js
  window.currentToolAPI = tool.api;

  // Tool slug
  window.currentToolSlug = tool.slug;

  // Detect AI tool
  window.isAITool = tool.api.startsWith("/ai");

  /*
  =========================================================
  TOOL TYPE DETECTION
  =========================================================
  */

  // Tools that require PDF upload
  const pdfTools = [
    "compress-pdf",
    "merge-pdf",
    "split-pdf",
    "pdf-to-word",
    "pdf-to-image",
    "watermark-pdf",
    "unlock-pdf",
    "protect-pdf",
    "rotate-pdf",
    "organize-pdf",
    "add-page-numbers",
    "pdf-ai-summary",
    "chat-with-pdf"
  ];

  window.requiresFileUpload = pdfTools.includes(tool.slug);

  /*
  =========================================================
  DEBUG INFO (DEV MODE)
  =========================================================
  */

  console.log("Loaded tool:", {
    slug: tool.slug,
    api: tool.api,
    isAI: window.isAITool,
    fileUpload: window.requiresFileUpload
  });

}