async function readLocalFile() {
  return new Promise((resolve, reject) => {
    const uploadInput = document.createElement("input");

    uploadInput.addEventListener('change', _ => {
      let files = [];
      Array.from(uploadInput.files).forEach(file => { files.push({
        type: file.type,
        name: file.name,
        file
      }) });

      resolve(files);
    });

    // This input element in IE11 becomes visible after it is added on the page
    // Hide an input element
    uploadInput.style.visibility = 'hidden';
    uploadInput.type = "file";
    uploadInput.setAttribute("multiple","");

    document.body.appendChild(uploadInput);
    uploadInput.click();
    document.body.removeChild(uploadInput);
  });
}

export {
  readLocalFile
}
