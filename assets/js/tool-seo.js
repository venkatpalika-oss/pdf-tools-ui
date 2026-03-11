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
SOFTWARE APPLICATION SCHEMA
========================= */

const schema = {

"@context": "https://schema.org",
"@type": "SoftwareApplication",
"name": data.title,
"applicationCategory": "BusinessApplication",
"operatingSystem": "Web",
"offers": {
"@type": "Offer",
"price": "0",
"priceCurrency": "USD"
}

};

const script = document.createElement("script");
script.type = "application/ld+json";
script.textContent = JSON.stringify(schema);

document.head.appendChild(script);

});
