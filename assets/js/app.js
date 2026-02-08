document.addEventListener("DOMContentLoaded", () => {
  const uploadBoxes = document.querySelectorAll(".upload-box");

  uploadBoxes.forEach(box => {
    const input = box.querySelector(".file-input");
    const title = box.querySelector(".upload-title");

    // Click to upload
    box.addEventListener("click", () => {
      input.click();
    });

    // File selected
    input.addEventListener("change", () => {
      if (input.files.length > 0) {
        title.textContent = input.files[0].name;
        box.classList.add("has-file");
      }
    });

    // Drag over
    box.addEventListener("dragover", e => {
      e.preventDefault();
      box.classList.add("dragging");
    });

    // Drag leave
    box.addEventListener("dragleave", () => {
      box.classList.remove("dragging");
    });

    // Drop file
    box.addEventListener("drop", e => {
      e.preventDefault();
      box.classList.remove("dragging");

      if (e.dataTransfer.files.length > 0) {
        input.files = e.dataTransfer.files;
        title.textContent = e.dataTransfer.files[0].name;
        box.classList.add("has-file");
      }
    });
  });
});

