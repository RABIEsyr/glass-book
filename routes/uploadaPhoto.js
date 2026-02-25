var express = require("express");
var router = express.Router();
var multer = require("multer");
const path = require("path");
const DIR = "./uploads";
const checkJwt = require("./../middleware/checkAuth");
var glob = require("glob");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io").listen(server);

var fs = require("fs"),
  request = require("request");

// var download = function (uri, filename, callback) {
//   request.head(uri, function (err, res, body) {
//     request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
//   });
// };

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    cb(null, req.decoded.user._id + ".PNG");
  },
});

let upload = multer({ storage: storage });

router.post("", checkJwt, upload.single("file"), function (req, res) {
  fs.readdirSync(testFolder).forEach((file) => {
    if (
      req.decoded.user._id + ".png" === file ||
      req.decoded.user._id + ".jpg" === file ||
      req.decoded.user._id + ".PNG" === file
    ) {
      fs.readFile(
        "./uploads/" + req.decoded.user._id + ".PNG",
        "base64",
        (err, base64Image) => {
          const dataUrl = `data:image/png;base64, ${base64Image}`;
          res.json(dataUrl);
        }
      );
    }
  });

});

testFolder = "uploads/";

router.get("/get-pic", checkJwt, (req, res) => {
  const userId = req.decoded.user._id;
  const extensions = ['.png', '.jpg', '.PNG'];
  let found = false;

  // البحث عن الملف
  const files = fs.readdirSync(testFolder);
  for (const file of files) {
    if (extensions.some(ext => `${userId}${ext}` === file)) {
      const filePath = path.join('./uploads', `${userId}.PNG`);
      
      fs.readFile(filePath, "base64", (err, base64Image) => {
        if (err) {
          console.error('Error reading file:', err);
          return sendDefaultImage(res);
        }
        
        const src = `data:image/png;base64,${base64Image}`;
        res.json(src);
      });
      
      found = true;
      break;
    }
  }

  if (!found) {
    sendDefaultImage(res);
  }
});

router.post("/get-search-user-pic", checkJwt, (req, res) => {
  fs.readFile(
    "./uploads/" + req.body.id + ".PNG",
    "base64",
    (err, base64Image) => {
      const dataUrl = `data:image/png;base64, ${base64Image}`;
      console.log('dataurl', dataUrl)
      if (base64Image) {
      res.json(dataUrl);
      } else {
        fs.readFile( "./uploads/" + 'avatar' + ".png",
    "base64", (err, base) =>{
    const dataUrl = `data:image/png;base64, ${base}`;
      res.json(dataUrl);
    })
      }
     
    }
  );
});

function sendDefaultImage(res) {
  const defaultPath = path.join('./uploads', 'avatar.png');
  
  fs.readFile(defaultPath, "base64", (err, base64Image) => {
    if (err) {
      console.error('Error reading default image:', err);
      return res.status(500).json({ error: 'Cannot load image' });
    }
    
    const src = `data:image/png;base64,${base64Image}`;
    res.json(src);
  });
}
module.exports = router;
