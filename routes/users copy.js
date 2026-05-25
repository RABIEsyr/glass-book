const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../db/db");
const checkJwt = require("./../middleware/checkAuth");
var fs = require("fs");

testFolder = "uploads/";

router.post("/search-user", checkJwt, async (req, res, next) => {
  let name = req.body.name;

  try {
    db.userSchema.find(
      {
        name: { $regex: `${name}`, $options: "i" },
      },
      (err, users) => {
        if (err) {
          res.json({
            success: false,
          });
        } else {
          if (users) {
            try {
              var result = users.map((item) => {
                const filePath = `${testFolder}${item._id}.PNG`;
                if (fs.existsSync(filePath)) {
                  const contents = fs.readFileSync(testFolder + item._id + ".PNG", {
                    encoding: "base64",
                  });
                  if (contents && contents.length > 0) {
                    return { name: item["name"], id: item["_id"], image: contents };
                  }
                }
                const contents = fs.readFileSync(testFolder + 'avatar' + ".png", {
                  encoding: "base64",
                });
                return { name: item["name"], id: item["_id"], image: contents }
              
            });
           } catch (error) {
            console.log('upload error 2233', error)
           }
  
            res.json({
              success: true,
              users: result,
            });
          }
        }
      }
    );
  } catch (error) {
    
  }
});

router.get('/get-username', checkJwt, (req, res, next) => {
  res.json(req.decoded.user.name)
});

router.post('/get-name-chat', checkJwt, (req, res, next) => {
  db.userSchema.findOne({_id: req.body.id})
    .exec((err, user) => {
       res.send({name: user?.name, _id:user?._id})
    })
})

router.post('/get-username-profile/:id', checkJwt, (req,res,next) => {
  console.log('users 1111111 id', req.params.id)
  db.userSchema.findOne({_id: req.params.id})
    .exec((err, user) =>{
      if (user) {
        console.log('users,', user.name)
      res.send(user.name)
      } else {
        res.send('no user')
      }
    })
})
module.exports = router;
