var filePath = "";
var colors = [];
var notes = [];
var minFreq = 65.41;
var maxFreq = 2637.02;
var range = maxFreq - minFreq;

// RGB to HSL based on https://github.com/CodeDrome/hslrgb-conversions-javascript/blob/master/rgbhsl.js
function calculateHue (R, G, B) {
	var Max = 0.0;
	var Min = 0.0;

	var fR = R / 255.0;
	var fG = G / 255.0;
	var fB = B / 255.0;

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

	var Hue;

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
	var Max = 0.0
	var Min = 0.0

	var fR = R / 255.0;
	var fG = G / 255.0;
	var fB = B / 255.0;

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

	var Lightness = (Min + Max) / 2.0;

	return Lightness;
}

//Code for playing sounds is based on https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Simple_synth

function selectImage(e) {
	var file = e.target.files[0];
  var reader = new FileReader();
  reader.readAsDataURL(file,'UTF-8');
	reader.onload = readerEvent => {
		document.getElementById("selected-image").src = readerEvent.target.result;
		sonifyImage();
	};
}

function sonifyImage() {
  colors = [];
  var progress = document.getElementById("progress");
	progress.innerText += "Reading file...";
  Jimp.read(document.getElementById("selected-image").src, (err, image) => {
    progress.innerText += "\nCalculating colors...";
    if (err) throw err;
    for (var f = 0; f < image.bitmap.width; f++) {
      var currentColor = {color: -1, start: -1};
      colors[f] = [];
      image.scan(f, 0, 1, image.bitmap.height, (x, y, idx) => {
        var pixelColor = Jimp.intToRGBA(image.getPixelColor(x, y));
        var hue = calculateHue(pixelColor.r, pixelColor.g, pixelColor.b);
        var color = Math.floor(hue / 36) * 36;
        if (hue !== -1) {
          if (color !== currentColor.color) {
            if (currentColor.color !== -1) {
              var middlePixelColor = Jimp.intToRGBA(image.getPixelColor(x, currentColor.start + Math.floor((y - 1 - currentColor.start) / 2)));
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
      var frame = colors[f];
      notes[f] = [];
      for (var n in colors[f]) {
        var note = frame[n];
				if (note.lightness > 0.3) {
					notes[f].push({volume: (note.end - note.start) / image.bitmap.height, pitch: (range * ((note.lightness - 0.3) / 0.7)) + minFreq});
				}
      }
    }

    progress.innerText += "\nDone!";
		document.getElementById("play-image").style.display = "initial";
  });
}

function playImage() {
	console.clear();
	var frame = 0;
	function playFrame() {
		console.log(frame);

		function playTone(freq) {
		  var osc = audioContext.createOscillator();
		  osc.connect(masterGainNode);

		  var type = wavePicker.options[wavePicker.selectedIndex].value;

		  if (type == "custom") {
		    osc.setPeriodicWave(customWaveform);
		  } else {
		    osc.type = type;
		  }

		  osc.frequency.value = freq;
		  osc.start();

		  return osc;
		}

		frame++;
		if (frame === notes.length) console.log("Done!");
		else setTimeout(playFrame, 200)
	}
	setTimeout(playFrame, 200);
}
