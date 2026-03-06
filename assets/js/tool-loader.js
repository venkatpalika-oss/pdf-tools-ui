import { tools } from "./tools-config.js";

const path = window.location.pathname;

// extract filename
const file = path.split("/").pop().replace(".html","");

// find tool from config
const tool = tools.find(t => t.slug === file);

if(!tool) return;

// update page title
document.title = tool.title;

// update UI elements
const titleEl = document.querySelector(".tool-title");
const descEl = document.querySelector(".tool-description");

if(titleEl) titleEl.textContent = tool.title;
if(descEl) descEl.textContent = tool.description;

// store endpoint globally for app.js
window.currentToolAPI = tool.api;
