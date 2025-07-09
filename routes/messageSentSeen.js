const express = require('express');
const router = express.Router();
const db = require("../db/db");
const checkJwt = require("./../middleware/checkAuth");
const mongoose = require('mongoose');

module.exports = function (io, onlineUsers) {
    router.post('/see-all-message', checkJwt, (req, res, next) => {
        let senderId 
            let recieverId 
        try {
             senderId = req.body.senderId;
             recieverId = req.decoded.user._id
        } catch (error) {
            console.log('glassbook, error 298')
        }
        if (senderId) {
            db.chatSchema.updateMany({
                "$and": [
                    {
                        "from":  mongoose.Types.ObjectId(senderId.toString())
                    },
                    {
                        "to":  mongoose.Types.ObjectId(recieverId.toString())
                    }
                ]
            },
                {
                    "$set": {
                        "status": "seen"
                    }
                }).exec((err, m) => {
                    if (err) {
                        console.log('glassbok error 3344', err)
                    }
                    if (m) {
                        const receiverSocketId = onlineUsers.get(senderId.toString());
                                if (receiverSocketId) {
                                    console.log('online here',)
                                    io.to(receiverSocketId).emit('message-seen', recieverId);
                    }
                }
                })
            console.log('glassbook: sender', senderId)
            console.log('glassbook: reciever', recieverId)
            res.json({
                success: true
            })
        } else {
            console.log('ssff')
            res.json({
                success: false
            })
        }
    });
    return router
}