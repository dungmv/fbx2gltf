const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');

const binaries = {
  'darwin': `darwin/bin/FBX-glTF-conv`,
  'linux': `linux/bin/FBX-glTF-conv`,
  'win32': `windows\bin\FBX-glTF-conv.exe`,
};

/**
 * Converts an FBX to a GTLF or GLB file.
 * @param string srcFile path to the source file.
 * @param string destFile path to the destination file or destination path.
 * This must end in `.glb` or `.gltf` (case matters).
 * @param string[] [opts] options to pass to the converter tool.
 * @return Promise<string> a promise that yields the full path to the converted
 * file, an error on conversion failure.
 */
function convert(srcFile, destFile, opts = []) {
  return new Promise((resolve, reject) => {
    try {
      let binExt = os.type() === 'Windows_NT' ? '.exe' : '';
      let tool = path.join(__dirname, os.type(), 'bin', 'FBX-glTF-conv' + binExt);
      if (!fs.existsSync(tool)) {
        throw new Error(`Unsupported OS: ${os.type()}`);
      }

      let destExt = path.extname(destFile).toLowerCase();

      if (!destExt) {
        destExt = '.glb'

        const srcFilename = path.basename(srcFile, path.extname(srcFile))
        destFile = path.join(destFile, srcFilename + destExt)
      }

      if (destExt !== '.glb' && destExt !== '.gltf') {
        throw new Error(`Unsupported file extension: ${destFile}`);
      }

      let srcPath = fs.realpathSync(srcFile);
      let destDir = fs.realpathSync(path.dirname(destFile));
      let destFilename = path.basename(destFile, path.extname(destFile)) + destExt;
      let destPath = path.join(destDir, destFilename);

      let args = opts.slice(0);
      args.push(srcPath, '--out', destPath);
      let child = childProcess.spawn(tool, args);

      let output = '';
      child.stdout.on('data', (data) => output += data);
      child.stderr.on('data', (data) => output += data);
      child.on('error', reject);
      child.on('close', code => {
        // the FBX SDK may create an .fbm dir during conversion; delete!
        let fbmCruft = srcPath.replace(/.fbx$/i, '.fbm');
        // don't stick a fork in things if this fails, just log a warning
        const onError = error =>
          error && console.warn(`Failed to delete ${fbmCruft}: ${error}`);
        try {
          fs.existsSync(fbmCruft) && rimraf.rimrafSync(fbmCruft, {});
        } catch (error) {
          onError(error);
        }

        // non-zero exit code is failure
        if (code != 0) {
          reject(new Error(`Converter output:\n` + (output.length ? output : "<none>")));
        } else {
          resolve(destPath);
        }
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = convert;
