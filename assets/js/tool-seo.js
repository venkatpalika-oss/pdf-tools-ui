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

if (toolSEO[tool]) {

document.title = toolSEO[tool].title;

let metaDesc = document.querySelector('meta[name="description"]');

if (!metaDesc) {
metaDesc = document.createElement("meta");
metaDesc.name = "description";
document.head.appendChild(metaDesc);
}

metaDesc.setAttribute("content", toolSEO[tool].description);

}
