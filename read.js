
/*var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

var instream = fs.createReadStream(__dirname + "/pdf/A13132.pdf");
var outstream = new stream;
var rl = readline.createInterface(instream, outstream);

rl.on('line', function (line) {
    console.log(line)
});

rl.on('close', function () {
    console.log("fin")
});
*/
'use strict';
const fs = require('fs');
const text = require('pdf-stream').text;
const es = require('event-stream');
const ignore = require("./ignore.json");
const path = require('path');

// Load file contents to ArrayBuffer synchronously
// let file = __dirname + "/pdf/A13132.pdf";
let file = __dirname + "/pdf/A11303.pdf";
let pdf = new Uint8Array(fs.readFileSync(file));
// Stream PDF text to stdout

let currentPage = 0;
let currentLine = 0;
let currentElement = null;
let currentRegion = null;
let currentProvincia = null;
let currentComuna = null;
let currentFile = path.basename(file);
let elements = [];

text(pdf)
    .pipe(es.split())
    .pipe(es.filterSync(line => !ignore.includes(line)))
    .pipe(es.mapSync(line => {

        // Si es una página nueva
        if (line == "Página") {
            currentPage++;
            currentLine = 0;
            console.info(`Procesando página: ${currentPage}`);
        }

        currentLine++;
        
        if(currentLine < 30)
            console.log(currentLine + ' - ' + line);
        if (currentLine > 7) {
            if ((currentLine - 7)%7 == 1) {
                currentElement = {}
                currentElement["nom"] = line;
            }
            if ((currentLine - 7)%7 == 2) {
                currentElement["uid"] = parseInt(line.replace(/\./g, "").split("-")[0]);
                currentElement["rut"] = line;
            }
            if ((currentLine - 7)%7 == 3)
                currentElement["sex"] = line;
            if ((currentLine - 7)%7 == 4)
                currentElement["dir"] = line;
            if ((currentLine - 7)%7 == 5)
                currentElement["cir"] = line;
            if ((currentLine - 7)%7 == 6)
                currentElement["me1"] = line;
            
            // Hay casos en que no tienen Mesa V o M,
            // Evaluamos si el token es una M o V, si no, rellenamos
            if ((currentLine - 7)%7 == 0) {
                currentElement["me2"] = line;
                currentElement["reg"] = currentRegion;
                currentElement["pro"] = currentProvincia;
                currentElement["com"] = currentComuna;
                currentElement["fil"] = currentFile;
                currentElement["pag"] = currentPage;
                elements.push(currentElement);
            }
        } else { 
            if (currentLine == 3) {
                currentRegion = line.replace(": ", "");
            }
            if (currentLine == 5) {
                currentProvincia = line.replace(": ", "");
            }
            if (currentLine == 6) {
                currentComuna = line.replace(": ", "");
            }
        }
    }).on('end', () => {
        const extension = path.extname(currentFile);
        const fileName = path.basename(currentFile, extension);
        fs.writeFileSync(__dirname + '/json/' + fileName +'.json', JSON.stringify(elements));
    }))