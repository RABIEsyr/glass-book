const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const ObjectId = require("mongoose").Types.ObjectId;
var multer = require("multer");
var fs = require("fs");
var path = require("path");

const checkJwt = require("./../middleware/checkAuth");
const db = require("../db/db");
const config = require("../config/config");

const DIR = "./posts";

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    cb(null, 1111 + ".PNG");
  },
});

let upload = multer({ storage: storage });

router.post("/new-post", checkJwt, upload.single("file"), (req, res, next) => {
  const text = req.body.data;

  var newPost = new db.postSchema();
  newPost.text = text;
  newPost.owner = req.decoded.user._id
  newPost.save((err, post) => {
    fs.rename("./posts/1111.PNG", `./posts/${post._id}.PNG`, (err) => {
      db.userSchema.update({ _id: newPost.owner }, { $push: { posts: post._id } })
        .exec()
      if (err) {
        res.json({
          success: false,
        });
      } else {
        db.postSchema.findOne({ _id: post._id })
          .populate('owner')
          .exec((err, post) => {
            res.json({
              success: true,
              post,
            });
          })

      }
    });
  });
});

router.get("/get-posts", checkJwt, (req, res, next) => {
  const id = req.decoded.user._id
  let index = +req.headers["index"];
  console.log('post.js index 233:', index)
  db.userSchema.findOne({ _id: id })
    .populate('posts')
    .populate('likes')
    .exec((err, users) => {
      console.log('index 111', index)
      console.log('posts 111', users.posts)

      //res.send(users.posts.slice(index, index + 3));
      //res.send(users.posts)

      if (index > users.posts.length) {
        res.json({
          success: false,
        });
      } else {
        res.send(users.posts.slice(index, index + 3));
      }
    })



});
// قبل اضافة ارسال منشورات عشوائية
// router.get('/friends-post', checkJwt, async (req, res) => {
//   let index = +req.headers["index2"];

//   const id = req.decoded.user._id
//   let fs = [];
//   let posts = []
//   let finalPosts = []
//   try {
//     db.userSchema.findOne({ _id: id }, (err, frnds) => {
//       if (frnds != null) {
//         fs = frnds.friends
//         posts = db.postSchema.find()
//           .populate({
//             path: 'comments',
//             populate: {
//               path: 'user',        // جلب بيانات المستخدم لكل تعليق
//               select: 'name email username profileImage' // الحقول التي تريدها
//             }
//           })
//           .populate('likes')
//           .populate('owner')
//           .exec()
//         posts.then((value) => {
//           value.map(p => {

//             for (let i = 0; i < value.length; i++) {
//               if (p.owner._id.toString() == fs[i]) {
//                 finalPosts.unshift(p)
//               }
//             }

//           })
//           res.json(finalPosts.slice(index, index + 2))
//         })
//       }
//     })

//   } catch (error) {
//     console.log(error)
//   }




//   //  db.userSchema.findOne({ _id: id })
//   //   .exec( (err, frnds) => {
//   //     fs =  frnds.friends

//   //   })
//   // posts = await db.postSchema.find().exec()
//   // let finalPosts = []
//   // posts.map( p => {

//   //   for (let i = 0; i < fs.length; i++) {
//   //     if (p.owner.toString() == fs[i]) {
//   //        finalPosts.push(p)
//   //     }
//   //   }

//   // })
//   // if (index > finalPosts.length) {
//   //   res.json({
//   //     success: false,
//   //   });
//   // } else {
//   //    console.log('post.js sss', finalPosts)
//   //   res.send(finalPosts)

//   // res.json(finalPosts.slice(index, index + 3))
// })


// Suggested if no friends
router.get('/friends-post', checkJwt, async (req, res) => {
  let index = +req.headers["index2"] || 0;

  const id = req.decoded.user._id;

  try {
    // البحث عن المستخدم والحصول على قائمة الأصدقاء
    const user = await db.userSchema.findOne({ _id: id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const friendsIds = user.friends || [];

    // جلب المنشورات مع البيانات المطلوبة
    let posts = await db.postSchema.find()
    .sort({ date: -1 })
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name email username profileImage'
        }
      })
      .populate('likes')
      .populate('owner')
      .exec();

    let finalPosts = [];

    // تصفية منشورات الأصدقاء مع إضافة حقل isFriend
    const friendsPosts = posts
      .filter(p => p.owner && friendsIds.some(friendId =>
        friendId.toString() === p.owner._id.toString()
      ))
      .map(p => ({
        ...p.toObject(), // تحويل إلى كائن عادي
        isFriend: true   // إضافة حقل يشير إلى أنه من صديق
      }));

    // إذا كان هناك منشورات للأصدقاء
    if (friendsPosts.length > 0) {
      finalPosts = friendsPosts;
    } else {
      // إذا لم يكن هناك منشورات للأصدقاء، جلب منشورات عشوائية من مستخدمين آخرين
      const otherPosts = posts
        .filter(p =>
          p.owner &&
          p.owner._id.toString() !== id.toString() &&
          !friendsIds.some(friendId => friendId.toString() === p.owner._id.toString())
        )
        .map(p => ({
          ...p.toObject(), // تحويل إلى كائن عادي
          isFriend: false  // إضافة حقل يشير إلى أنه ليس من صديق
        }));

      // ترتيب عشوائي واختيار 10 منشورات كحد أقصى
      const shuffled = otherPosts.sort(() => 0.5 - Math.random());
      finalPosts = shuffled.slice(0, 10);
    }

    // إرجاع النتائج مع التقسيم حسب الـ index
    res.json(finalPosts.slice(index, index + 2));

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// router.get('/user-post/:id', checkJwt, (req, res, next) => {
//   let postsArr = []
//   db.userSchema.findOne({ _id: req.params.id })
//     .populate('posts')
//     .exec( (err, da) => {
//       for (let i = 0; i < da.posts.length; i++) {
//         db.postSchema.find({ _id: da.posts[i]._id })
//           .populate('comments')
//           .exec((err, post) => {
//             postsArr.push(post)
//           })
//       }
//       return  Promise.resolve(postsArr) 

//     }).then((p) => {
//       console.log(p)
//     })

// })
router.get('/user-post/:id', checkJwt, async (req, res, next) => {
  let index = +req.headers["index2"];
  try {
    let da = await db.userSchema.findOne({ _id: req.params.id }).populate('posts').exec();
    let postsArray = [];
    if (da) {
      for (let post of da.posts) {
        let result = await db.postSchema.find({ _id: post._id })
          .populate({
            path: 'comments',
            populate: {
              path: 'user',
              select: 'name'
            }
          })
          .populate('likes').exec();
        postsArray.unshift(result);
      }
      if (postsArray[0].length > 0)
        res.send(postsArray.slice(index, index + 2))
    }

  } catch (e) {
    console.log(e);
  }
});
module.exports = router;

// suggested posts