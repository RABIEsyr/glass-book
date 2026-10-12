const express = require('express')
const router = express.Router()
const db = require('../db/db')
const checkJwt = require('../middleware/checkAuth')

router.get('/likes',checkJwt, async (req, res, next) => {
   try {
    const userId = req.decoded.user._id
    //    const likes = await db.likeSchema.find({ user: userId })
    //    .populate({
    //             path: 'post',
    //             populate: [
    //                 { path: 'owner', model: 'userSchema' },  // جلب بيانات مالك المنشور
    //                 { path: 'comments', model: 'commentSchema' }, // جلب التعليقات
    //                 { path: 'likes', model: 'likeShcema', // جلب بيانات الإعجابات
    //                     populate: { path: 'user', model: 'userSchema' } // جلب بيانات المستخدمين الذين أعجبوا
    //                 }
    //             ]
    //         })
    //         .populate('user')

    const likes = await db.likeSchema.find({ user: userId })
            .populate({
                path: 'post',
                populate: [
                    { 
                        path: 'owner', 
                        model: 'userSchema',
                        select: 'name image' // تحديد الحقول المطلوبة
                    },
                    { 
                        path: 'comments', 
                        model: 'commentSchema',
                        populate: {
                            path: 'user',
                            model: 'userSchema',
                            select: 'name image' // جلب اسم وصورة صاحب التعليق
                        }
                    },
                    { 
                        path: 'likes', 
                        model: 'likeShcema',
                        populate: { 
                            path: 'user', 
                            model: 'userSchema',
                            select: 'name image'
                        }
                    }
                ]
            })
            .populate({
                path: 'user',
                model: 'userSchema',
                select: 'name image email' // جلب بيانات صاحب التعليق (المستخدم الحالي)
            });

    res.json({
        success: true,
        likes
    })
   } catch (error) {
        console.log('error is 1122', error)
        res.json({
            suucess: false,
            message: 'server error'
        })
   }
});

router.get('/comments', checkJwt, async(req, res, next) => {
    try {
         const userId = req.decoded.user._id;

         const comments = await db.commentSchema.find({ user: userId })
            .populate({
                path: 'post',
                populate: [
                    { 
                        path: 'owner', 
                        model: 'userSchema',
                        select: 'name image' // تحديد الحقول المطلوبة
                    },
                    { 
                        path: 'comments', 
                        model: 'commentSchema',
                        populate: {
                            path: 'user',
                            model: 'userSchema',
                            select: 'name image' // جلب اسم وصورة صاحب التعليق
                        }
                    },
                    { 
                        path: 'likes', 
                        model: 'likeShcema',
                        populate: { 
                            path: 'user', 
                            model: 'userSchema',
                            select: 'name image'
                        }
                    }
                ]
            })
            .populate({
                path: 'user',
                model: 'userSchema',
                select: 'name image email' // جلب بيانات صاحب التعليق (المستخدم الحالي)
            });

            const finalArr = []
            const finalCommentsArr = comments.filter((el) => {
               let temp;
               const isExist = finalArr.findIndex((el2) => {
                return el2.post?._id == el.post?._id
               })
               if (isExist < 0) {
                finalArr.push(el)
                temp = true
               } else {
                temp = false
               }

               return temp
            })

            console.log('c22: ', comments)
            res.json({
                success: true,
                comments: finalArr,
                commentsLength: comments.length
            })
    } catch (error) {
        console.log('error 556789 ', error)
        res.json({
            success: false,
            message: 'server error'
        })
    }
})

module.exports = router