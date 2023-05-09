const { v2: cloudinary } = require('cloudinary');
const childProcess = require('child_process');
const path = require('path');
const rimraf = require('rimraf');

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'suzuverse-uat',
  api_key: process.env.CLOUDINARY_API_KEY || '974265556381415',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'IWeV1Pkauem5jo1nsouiFxj8kcI'
});

const binaries = {
  'darwin': `darwin/bin/FBX-glTF-conv`,
  'linux': `linux/bin/FBX-glTF-conv`,
  'win32': `windows\bin\FBX-glTF-conv.exe`,
};
/**
 * Converts an FBX to a GTLF or GLB file.
 * @param {string} srcFile path to the source file.
 * @param {string} destFile path to the destination file or destination path.
 * This must end in `.glb` or `.gltf` (case matters).
 * @return {Promise<string>} a promise that yields the full path to the converted
 * file, an error on conversion failure.
 */
function convert(srcFile, destFile) {
  return new Promise((resolve, reject) => {
    const tool = path.join(__dirname, 'linux', 'bin', 'FBX-glTF-conv');
    const args = [srcFile, '--out', destFile];
    let child = childProcess.spawn(tool, args);

    let output = '';
    child.stdout.on('data', (data) => output += data);
    child.stderr.on('data', (data) => output += data);
    child.on('error', reject);
    child.on('close', code => {
      // the FBX SDK may create an .fbm dir during conversion; delete!
      const fbmCruft = srcFile.replace(/.fbx$/i, '.fbm');
      rimraf.rimrafSync(fbmCruft, {});
      // non-zero exit code is failure
      if (code != 0) {
        reject(new Error(`Converter output:\n` + (output.length ? output : "<none>")));
      }
      resolve(destFile);
    });
  });
}

module.exports = convert;
