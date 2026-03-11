document.addEventListener("DOMContentLoaded", () => {

const toolSEO = {

compress: {
title: "Compress PDF Online – Reduce PDF File Size | PaperlyTools",
description: "Compress PDF online to reduce file size while keeping quality intact."
},

merge: {
title: "Merge PDF Online – Combine PDF Files | PaperlyTools",
description: "Merge multiple PDF files into a single document quickly and securely."
},

split: {
title: "Split PDF Online – Extract PDF Pages | PaperlyTools",
description: "Split PDF files into individual pages and download them instantly."
}

};

const tool = document.body.dataset.tool;

if (!tool || !toolSEO[tool]) return;

const data = toolSEO[tool];

document.title = data.title;


/* =========================
META DESCRIPTION
========================= */

let metaDesc = document.querySelector('meta[name="description"]');

if (!metaDesc) {
metaDesc = document.createElement("meta");
metaDesc.name = "description";
document.head.appendChild(metaDesc);
}

metaDesc.setAttribute("content", data.description);


/* =========================
CANONICAL URL
========================= */

let canonical = document.querySelector("link[rel='canonical']");

if (!canonical) {
canonical = document.createElement("link");
canonical.rel = "canonical";
document.head.appendChild(canonical);
}

canonical.href = `https://paperlytools.com/tools/${tool}-pdf.html`;


/* =========================
OPEN GRAPH
========================= */

function setOG(property, content){

let tag = document.querySelector(`meta[property='${property}']`);

if(!tag){
tag = document.createElement("meta");
tag.setAttribute("property", property);
document.head.appendChild(tag);
}

tag.setAttribute("content", content);

}

setOG("og:title", data.title);
setOG("og:description", data.description);
setOG("og:type", "website");
setOG("og:url", canonical.href);
setOG("og:image", "https://paperlytools.com/assets/img/preview.png");


/* =========================
TWITTER CARD
========================= */

function setTwitter(name, content){

let tag = document.querySelector(`meta[name='${name}']`);

if(!tag){
tag = document.createElement("meta");
tag.setAttribute("name", name);
document.head.appendChild(tag);
}

tag.setAttribute("content", content);

}

setTwitter("twitter:card","summary_large_image");
setTwitter("twitter:title", data.title);
setTwitter("twitter:description", data.description);
setTwitter("twitter:image","https://paperlytools.com/assets/img/preview.png");

/* =========================
RELATED TOOLS ENGINE
========================= */

const relatedTools = {

compress: [
{slug:"merge-pdf",name:"Merge PDF"},
{slug:"split-pdf",name:"Split PDF"},
{slug:"pdf-to-word",name:"PDF to Word"},
{slug:"pdf-to-image",name:"PDF to Image"}
],

merge: [
{slug:"compress-pdf",name:"Compress PDF"},
{slug:"split-pdf",name:"Split PDF"},
{slug:"organize-pdf",name:"Organize PDF"},
{slug:"pdf-to-word",name:"PDF to Word"}
],

split: [
{slug:"merge-pdf",name:"Merge PDF"},
{slug:"compress-pdf",name:"Compress PDF"},
{slug:"organize-pdf",name:"Organize PDF"},
{slug:"pdf-to-image",name:"PDF to Image"}
]

};

if (relatedTools[tool]) {

const toolsSection = document.querySelector(".tools .container");

if(!toolsSection) return;

const block = document.createElement("div");
block.className = "related-tools";

let html = `<h3 style="text-align:center;margin-top:40px;">Related PDF Tools</h3>`;
html += `<div class="seo-link-grid">`;

relatedTools[tool].forEach(t=>{
html += `<a class="seo-link dynamic-link" data-path="/tools/${t.slug}.html">${t.name}</a>`;
});

html += `</div>`;

block.innerHTML = html;

toolsSection.appendChild(block);

}
});
