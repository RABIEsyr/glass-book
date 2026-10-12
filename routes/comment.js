const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const db = require("../db/db");

const checkJwt = require("./../middleware/checkAuth");

router.get('/get-comments', checkJwt, (req, res) => {
    let postID = req.headers["postid"];
    let id = req.decoded.user._id;
    db.postSchema.findOne({ _id: postID })
        .populate('comments')
        .exec((err, comments) => {
             console.log('comments.js comments 322', comments)
            res.json(comments)
        })
    // console.log('comment.js pstId', postID)
    // console.log('comment.js userId', id)
    
})

router.post('/delete-comment', checkJwt, (req, res) => {
    let id = req.decoded.user._id;
    const {commentId, postId} = req.body
   
    if (commentId && postId) {
        try {
            db.commentSchema.findByIdAndRemove(commentId, (err, comment) => {
                console.log('coco: ', comment)
                db.postSchema.findOneAndUpdate({ _id: postId.postID },
                                  {
                                    $pull: {
                                      comments: mongoose.Types.ObjectId(commentId.toString())
                                    }
                                  }).exec((err, post) => {
                                    if (err) {
                                        res.json({success: false, msg: err}) 
                                    }
                                    res.json({success: true})
                                  })
            })
        } catch (error) {
            res.json({success: false, msg: 'internal data error'})
        }
    } 
})
module.exports = router;
