const { dialog } = require('electron').remote;
const Jimp = require('jimp');
let filePath = "";
let colors = [];
let notes = [];
let progress = document.getElementById("progress");
const minFreq = 65.41;
const maxFreq = 2637.02;
const range = maxFreq - minFreq;

// RGB to HSL based on https://github.com/CodeDrome/hslrgb-conversions-javascript/blob/master/rgbhsl.js
function calculateHue (R, G, B) {
	let Max = 0.0;
	let Min = 0.0;

	let fR = R / 255.0;
	let fG = G / 255.0;
	let fB = B / 255.0;

	if(fR >= fG && fR >= fB)
		Max = fR;
	else if(fG >= fB && fG >= fR)
		Max = fG;
	else if(fB >= fG && fB >= fR)
		Max = fB;

	if(fR <= fG && fR <= fB)
		Min = fR;
	else if(fG <= fB && fG <= fR)
		Min = fG;
	else if(fB <= fG && fB <= fR)
		Min = fB;

	let Hue;

	if(Max == Min)
	{
		Hue = -1.0;
	}
	else
	{
		if(Max == fR)
		{
			Hue = (fG - fB) / (Max - Min);
		}
		else if(Max == fG)
		{
			Hue = 2.0 + (fB - fR) / (Max - Min);
		}
		else if(Max == fB)
		{
			Hue = 4.0 + (fR - fG) / (Max - Min);
		}

		Hue *= 60.0;

		if(Hue < 0.0)
		{
			Hue += 360.0;
		}
	}

	return Hue;
}
function calculateLightness (R, G, B) {
	let Max = 0.0
	let Min = 0.0

	let fR = R / 255.0;
	let fG = G / 255.0;
	let fB = B / 255.0;

	if(fR >= fG && fR >= fB)
		Max = fR;
	else if(fG >= fB && fG >= fR)
		Max = fG;
	else if(fB >= fG && fB >= fR)
		Max = fB;

	if(fR <= fG && fR <= fB)
		Min = fR;
	else if(fG <= fB && fG <= fR)
		Min = fG;
	else if(fB <= fG && fB <= fR)
		Min = fB;

	let Lightness = (Min + Max) / 2.0;

	return Lightness;
}

//Code for playing sounds is based on https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Simple_synth

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
  document.getElementById('sonify-image').style.display = "none";
  colors = [];
  progress.innerText += "Reading file...";
  Jimp.read(filePath, (err, image) => {
    progress.innerText += "\nCalculating colors...";
    if (err) throw err;
    for (var f = 0; f < image.bitmap.width; f++) {
      let currentColor = {color: -1, start: -1};
      colors[f] = [];
      image.scan(f, 0, 1, image.bitmap.height, (x, y, idx) => {
        const pixelColor = Jimp.intToRGBA(image.getPixelColor(x, y));
        const hue = calculateHue(pixelColor.r, pixelColor.g, pixelColor.b);
        const color = Math.floor(hue / 36) * 36;
        if (hue !== -1) {
          if (color !== currentColor.color) {
            if (currentColor.color !== -1) {
              const middlePixelColor = Jimp.intToRGBA(image.getPixelColor(x, currentColor.start + Math.floor((y - 1 - currentColor.start) / 2)));
              colors[x].push({color: currentColor.color, start: currentColor.start, end: y - 1, lightness: calculateLightness(middlePixelColor.r, middlePixelColor.b, middlePixelColor.g)});
            }
            currentColor.color = color;
            currentColor.start = y;
          }
        }
      });
    }

    progress.innerText += "\nGenerating Music...\n    Calculating notes...";
    for (var f in colors) {
      const frame = colors[f];
      notes[f] = [];
      for (var n in colors[f]) {
        const note = frame[n];
				if (note.lightness > 0.3) {
					notes[f].push({volume: (note.end - note.start) / image.bitmap.height, pitch: (range * ((note.lightness - 0.3) / 0.7)) + minFreq});
				}
      }
    }
    console.log(notes);

    /*setInterval(() => {

    }, 500);*/

    progress.innerText += "\nDone!";
  });
}
