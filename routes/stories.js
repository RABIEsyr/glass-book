// routes/stories.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require("./../middleware/checkAuth");

const db = require('../db/db');

const Story = db.storySchema;

// const Story = require('../models/Story');

const upload = multer({ dest: 'uploads/stories/' });

// جلب Stories المستخدمين الذين يتابعهم
// routes/stories.js
router.get('/following', auth, async (req, res) => {
    let user_Id = req.decoded.user._id;
    const user = await db.userSchema.findById(user_Id);
    const usersToFetch = [...user.friends, user_Id];

    const stories = await Story.find({
        userId: { $in: usersToFetch },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .populate('userId', 'name profileImage')
    .populate('seenBy', 'name profileImage')
    .sort({ createdAt: -1 });

    // ✅ تجميع القصص حسب المستخدم
    const grouped = {};
    
    stories.forEach(story => {
        const userId = story.userId._id.toString();
        
        if (!grouped[userId]) {
            grouped[userId] = {
                userId: story.userId,
                username: story.userId.name,
                userImage: story.userId.profileImage,
                slides: [],
                seenBy: [], // ✅ دمج جميع المشاهدين
                createdAt: story.createdAt,
                _id: story._id // ✅ أول قصة كـ ID رئيسي
            };
        }
        
        // ✅ دمج الشرائح (slides) من جميع القصص
        grouped[userId].slides.push(...story.slides.map(slide => ({
            ...slide,
            storyId: story._id, // ✅ حفظ الـ ID الأصلي لكل شريحة
            createdAt: slide.createdAt || story.createdAt
        })));
        
        // ✅ دمج المشاهدين بدون تكرار
        if (story.seenBy && story.seenBy.length > 0) {
            story.seenBy.forEach(viewer => {
                const viewerId = viewer._id.toString();
                const exists = grouped[userId].seenBy.find(v => v._id.toString() === viewerId);
                if (!exists) {
                    grouped[userId].seenBy.push(viewer);
                }
            });
        }
    });

    // ✅ تحويل إلى مصفوفة
    const groupedStories = Object.values(grouped);

    res.json({
        myStories: groupedStories.filter(s => s.userId._id.toString() === user_Id.toString()),
        friendsStories: groupedStories.filter(s => s.userId._id.toString() !== user_Id.toString())
    });
});


// إنشاء Story
router.post('/', auth, upload.single('media'), async (req, res) => {
    console.log('new story here')
  const story = new Story({
    userId: req.decoded.user._id,
    type: req.body.type,
    slides: [{
      type: req.body.type,
      url: req.file ? `/uploads/stories/${req.file.filename}` : null,
      text: req.body.text,
      backgroundColor: req.body.backgroundColor
    }]
  });
  
  await story.save();
  res.json({ success: true, story });
});

// تسجيل مشاهدة
router.post('/seen', auth, async (req, res) => {
    let userId = req.decoded.user._id;
    
    const result = await Story.findOneAndUpdate(
        {
            _id: req.body.storyId,
            userId: { $ne: userId } // ✅ القصة ليست للمستخدم الحالي
        },
        {
            $addToSet: { seenBy: userId }
        },
        { new: true }
    );
    
    if (!result) {
        return res.json({ success: false, message: 'Cannot mark own story as seen' });
    }
    
    res.json({ success: true });
});

// الرد على Story
router.post('/reply', auth, async (req, res) => {
  // إرسال رسالة خاصة للمستخدم مع reference للـ Story
  const message = new Message({
    from: req.userId,
    to: req.body.storyId, // userId صاحب الـ Story
    text: req.body.text,
    storyReply: {
      storyId: req.body.storyId,
      slideIndex: req.body.slideIndex
    }
  });
  
  await message.save();
  res.json({ success: true });
});

module.exports = router;