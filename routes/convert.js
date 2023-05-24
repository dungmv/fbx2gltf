const express = require('express');
const multer = require('multer')
const AdmZip = require("adm-zip");
const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');
const fbx2gltf = require('../fbx2gltf');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      const dir = raw.toString('hex')
      fs.mkdirSync('uploads/' + dir)
      cb(null, 'uploads/' + dir)
    })
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "original" + ext)
  }
})

const upload = multer({
  storage: storage, fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext == '.fbx' || ext == '.zip') {
      cb(null, true)
    } else {
      cb(new Error('File invalid'), false);
    }
  }
})

router.post('/', upload.single('file'), function (req, res, next) {
  if (!req.file) {
    res.json({ error: 1, message: 'file missing!' })
    return
  }

  let filePath = ''
  const workDir = req.file.destination
  if (req.file.mimetype == 'application/zip') {
    const zip = new AdmZip(req.file.path);
    const pathfbx = zip.getEntries().find(entry => path.extname(entry.name) == '.fbx');
    if (!pathfbx) {
      res.status(400).json({message: 'missing file fbx'});
      return
    }
    zip.extractAllTo(workDir, true, false);
    filePath = `${workDir}/${pathfbx.entryName}`
  } else {
    filePath = req.file.path
  }

  const srcFile = fs.realpathSync(filePath);
  const destFile = srcFile.replace(/.fbx$/i, '.glb');
  fbx2gltf(srcFile, destFile).then((destFile) => {
    const filename = crypto.randomBytes(16).toString('hex');
    return cloudinary.uploader.upload(destFile, { public_id: filename });
  }).then((cloudinaryRes) => {
    res.json(cloudinaryRes);
  }).catch(next).finally(() => {
    rimraf.rimrafSync([workDir], {});
  })
});

module.exports = router;
