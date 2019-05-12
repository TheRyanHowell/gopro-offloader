const readdirp = require('readdirp');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const commander = require('commander');
const shell = require('shelljs');

function loadFiles(path, files, callback) {
  readdirp(path, {
      fileFilter: '*.MP4',
      alwaysStat: true
    })
    .on('data', (entry) => {
      files[entry.path] = entry;
    })
    // Optionally call stream.destroy() in `warn()` in order to abort and cause 'close' to be emitted
    .on('warn', error => console.error('non-fatal error', error))
    .on('error', error => console.error('fatal error', error))
    .on('end', () => {
      callback();
    });
}

function deleteFile(fileToBeDeleted, matchedFile) {
  if (fileToBeDeleted.stats.size === matchedFile.stats.size) {
    fs.unlinkSync(fileToBeDeleted.fullPath);
    return true;
  }

  return false;
}

function downloadFiles(callback) {
  loadFiles(goProPath, goProFiles, () => {
    loadFiles(outputPath, outputFiles, () => {
      for (goProFileKey in goProFiles) {
        let goProFile = goProFiles[goProFileKey];

        // File exists, delete if it's the same
        if (outputFiles.hasOwnProperty(goProFileKey)) {
          var deleted = deleteFile(goProFile, outputFiles[goProFileKey]);
          if (true === deleted) {
            console.log(`(GoPro) Deleted pre-existing file: ${goProFile.path}`);
            continue;
          }
        }

        let outputDir = outputPath;
        let outputFilePath = outputDir + '/' + goProFile.basename;
        console.log(`(GoPro) Downloading: ${goProFile.basename}`);
        mkdirp.sync(outputDir);
        fs.copyFileSync(goProFile.fullPath, outputFilePath);
      }

      callback();
    });
  });
}


function cleanupGoPro(callback) {
  goProFiles = {};
  outputFiles = {};

  loadFiles(goProPath, goProFiles, () => {
    loadFiles(outputPath, outputFiles, () => {
      for (goProFileKey in goProFiles) {
        let goProFile = goProFiles[goProFileKey];

        // File exists, delete if it's the same
        if (outputFiles.hasOwnProperty(goProFileKey)) {
          var deleted = deleteFile(goProFile, outputFiles[goProFileKey]);
          if (true === deleted) {
            console.log(`(GoPro) Cleaned up: ${goProFile.path}`);
            continue;
          } else {
            console.log(`(GoPro) Could not clean up: ${goProFile.path}`);
          }
        }
      }
      callback();
    });
  });
}

function cleanupOutput(callback) {
  outputFiles = {};

  loadFiles(outputPath, outputFiles, () => {
    var expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() - 1);

    for (outputFileKey in outputFiles) {
      let outputFile = outputFiles[outputFileKey];
      // If older than a month
      if (outputFile.stats.ctime < expireDate) {
        fs.unlinkSync(outputFile.fullPath);
        console.log(`(Output) Cleaned up: ${outputFile.path}`);
      }
    }
    callback();
  });
}

function checkPath(path) {
  if (undefined === path || null === path) {
    return false;
  }

  if (!fs.existsSync(path)) {
    return false;
  }

  if (!fs.lstatSync(path).isDirectory()) {
    return false;
  }

  return true;
}
commander
  .option('-g, --go-pro-path <type>', 'Path of GoPro mount')
  .option('-o, --output-path <type>', 'Path to store files')

commander.parse(process.argv);

if (!checkPath(commander.goProPath)) {
  console.log(`Invalid goPro path: ${commander.goProPath}`)
  commander.outputHelp();
  process.exit(1);
}

if (!checkPath(commander.outputPath)) {
  console.log(`Invalid output path: ${commander.outputPath}`)
  commander.outputHelp();
  process.exit(2);
}

const goProPath = path.resolve(commander.goProPath);
const outputPath = path.resolve(commander.outputPath);

var goProFiles = {};
var outputFiles = {};

console.log(`Downloading Files - ${new Date().toISOString()}`);
downloadFiles(() => {
  console.log(`Cleaning Up GoPro - ${new Date().toISOString()}`);
  cleanupGoPro(() => {
    console.log(`Cleaning Up Output - ${new Date().toISOString()}`);
    cleanupOutput(() => {
      console.log(`Done - ${new Date().toISOString()}`);
    });
  });
});
