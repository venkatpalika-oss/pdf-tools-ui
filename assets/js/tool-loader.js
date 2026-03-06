import { tools } from "./tools-config.js";

const slug = window.location.pathname.replace("/", "");

const tool = tools.find(t => t.slug === slug);

document.title = tool.title;

document.querySelector(".tool-title").textContent = tool.title;
document.querySelector(".tool-description").textContent = tool.description;
