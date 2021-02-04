const { dialog } = require('electron').remote;
const jimp = require('jimp');
let filePath = "";

function selectImage() {
  dialog.showOpenDialog({"filters": [{"name": "Image", "extensions": ["jpg", "png"]}]}).then(result => {
    if (result.canceled !== true) {
      filePath = result.filePaths[0];
      document.getElementById("select-image").style.display = "none";
      document.getElementById("selected-image").src = filePath;
      document.getElementById("sonify-image").style.display = "initial";
    }
  });
}

function sonifyImage() {

}
