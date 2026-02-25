const mongoose = require("mongoose");
var deepPopulate = require("mongoose-deep-populate")(mongoose);

const schema = mongoose.Schema;

const userSchema = new schema({
  name: String,
  email: String,
  password: String,
  isAdmin: { type: Boolean, default: false },
  image: { data: Buffer, contentType: String },
  publicKey: String,
  gender: String,
  online: { type: Boolean, default: false },
  friends: [{ type: schema.Types.ObjectId, ref: "userSchema" }],
  friendRequest: [{ type: schema.Types.ObjectId, ref: "userSchema" }],
  posts: [{ type: schema.Types.ObjectId, ref: "postSchema" }]
});
userSchema.plugin(deepPopulate);

const chatSchema = new schema({
  from: { type: schema.Types.ObjectId, ref: "userSchema" },
  to: { type: schema.Types.ObjectId, ref: "userSchema" },
  text: String,
  date: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  status: { type: String, default: 'sent' },
  delete: []
});
 
const postSchema = new schema({
  owner: { type: schema.Types.ObjectId, ref: "userSchema" },
  text: String,
  // image: {data: Buffer, contentType: String}
  image: String,
  comments: [{ type: schema.Types.ObjectId, ref: "commentSchema" }],
  likes: [{ type: schema.Types.ObjectId, ref: "likeShcema" }],
  date: { type: Date, default: Date.now }

});

const commentSchema = new schema({
  post: { type: schema.Types.ObjectId, ref: "postSchema" },
  user: { type: schema.Types.ObjectId, ref: "userSchema" },
  content: String,
  date: { type: Date, default: Date.now }
})
const likeSchema = new schema({
  post: { type: schema.Types.ObjectId, ref: "postSchema" },
  user: { type: schema.Types.ObjectId, ref: "userSchema" },
})

module.exports.userSchema = mongoose.model("userSchema", userSchema);
module.exports.chatSchema = mongoose.model("chatSchema", chatSchema);
module.exports.postSchema = mongoose.model("postSchema", postSchema);
module.exports.commentSchema = mongoose.model("commentSchema", commentSchema);
module.exports.likeSchema = mongoose.model('likeShcema', likeSchema)
