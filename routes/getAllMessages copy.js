
const express = require('express');
const router = express.Router();

var mongoose = require('mongoose');
const ObjectId = require("mongoose").Types.ObjectId;

const db = require("../db/db");
const checkJwt = require("./../middleware/checkAuth");

router.get('', checkJwt, async(req, res, next) => {
    let userFrienList = await db.userSchema.findOne({_id: req.decoded.user._id})

    let chat1 = []
    for (let i = 0; i < userFrienList.friends.length; i++) {
        let chat = await db.chatSchema.find({
            $or: [

                {
                    $and: [
                        { to: mongoose.Types.ObjectId(req.decoded.user._id.toString()) },
                        { from: mongoose.Types.ObjectId(userFrienList.friends[i].toString()) }
                    ]
                }, {
                    $and: [
                        { to: mongoose.Types.ObjectId(userFrienList.friends[i].toString()) },
                        { from: mongoose.Types.ObjectId(req.decoded.user._id.toString()) }
                    ]
                }

            ]
        })
        .populate('from')
        .populate('to')
        chat1.push(chat[chat.length -1])

    }   
    res.send(chat1)
})

router.get('/unread-message', checkJwt, (req, res, next) => {
    db.chatSchema.find({
        $and: [
            {
                to: req.decoded.user._id,
                isRead: false
            }
        ]
    }).populate('from', '_id name')
    .exec((err, msgs) => {
        console.log('getAllMessages unread-message', msgs)
        res.json({
            msgs
        })
    })
})
router.post('/read-message', checkJwt, (req, res, next) => {
    let userId = req.decoded.user._id;
    let receiverId = req.body.receiverId;
    console.log("getAllMessages.js", "userId", userId, "receiverId", receiverId)
    db.chatSchema.updateMany({
        $and: [
            {
                to: userId,
                from: receiverId
            }
        ],
        
    }, {isRead: true}, (err, res) => {
        if (err)
            console.log("getAllMessages.js read messages error", err)
        console.log('getAllMessages.js read messages', res)
    })
})
module.exports = router