var jwt = require("jsonwebtoken");
const db = require("../db/db");
const checkJwt = require("./../middleware/checkAuth");
const ObjectId = require("mongoose").Types.ObjectId;
var mongoose = require('mongoose');

module.exports = function (io) {
  var array_of_connection = [];
  let senderTokent;
  let sessionID = {};
  let id;
  const onlineUsersIds = [];
  const userIds = [];
  const userIdsObj = {}

  io.use(function (socket, next) {
    if (socket.handshake.query && socket.handshake.query.token) {
      jwt.verify(socket.handshake.query.token, "lol", function (err, decoded) {
        if (err) return next(new Error("Authentication error"));
        socket.decoded = decoded;
        senderTokent = decoded;
        sessionID[id] = senderTokent.user._id;
        onlineUsersIds.push(senderTokent.user._id);
        next();
      });
    } else {
      next(new Error("Authentication error"));
    }
  }).on("connection", async function (socket) {
     socket._id = senderTokent.user._id;
     socket.currentUrl = null
    let user123 = await db.userSchema.findOneAndUpdate({_id: socket._id}, {online: true});
    console.log('user123', user123);
    array_of_connection.push(socket);

    
    const sessionMap = {};

      //online Friends
        const userId = senderTokent.user._id;
        // let user = await db.userSchema.findOne({_id: userId}).exec();
        // let friends = []
        // friends = user.friends;
        
        // const tempOnlineFriends = [];
        // onlineUsersIds.forEach((onlineUser) => {
        //   friends.forEach((friend) => {
        //     if (friend == onlineUser) {
        //             if (!tempOnlineFriends.includes(friend))
        //             tempOnlineFriends.push(friend);
        //     }
        //   });
        // });
       // console.log('user get-online friend', tempOnlineFriends);
      array_of_connection.forEach((socket) => {
        socket.emit('online-users', user123._id);
      })
       
         
      //end online Friends

    socket.on("msg", function (message) {
      console.log('new message 2025')
      let id = message.id;
      sessionMap[message._id] = socket.id;
      let curUrl = null
      //     db.userSchema.find({isAdmin: true}, function(err, admins) {
      //       const newMessage = new db.chatSchema();

      //       newMessage.from = message._id;

      //       for (let admin of admins) {
      //           newMessage.to.push(admin._id)
      //       }

      //       newMessage.content = message.message;

      //       newMessage.save();
      const newMessage = new db.chatSchema();
      newMessage.from = socket._id;
      newMessage.to = id;
      newMessage.text = message.msg;
      newMessage.save().then((m) => {
        console.log('mana,', m)
        messageNew = {
          msg: message.msg,
          senderId: socket._id,
          receiverId: id,
          _id: m._id,
          delete: m.delete,
          status: 'sent'
        }
        console.log('default message ', messageNew) 
        db.userSchema.findOne({ _id: socket._id }).exec((err, user) => {
          db.userSchema.findOne({ _id: id }).exec((err, user2) => {
            newMessageforChatList = {
              text: message.msg,
              from: { _id: socket._id, name: user.name },
              to: id,
              date: m.date,
              _id: m._id

            }

            newMessageforChatList2 = {
              text: message.msg,
              from: { _id: socket._id, name: user.name },
              to: { _id: user2._id, name: user2.name },
              date: m.date,
              _id: m._id

            }
            for (let i = 0; i < array_of_connection.length; i++) {
              if (array_of_connection[i]._id == id) {
                array_of_connection[i].emit("new-msg-list", newMessageforChatList)
              }
              if (array_of_connection[i]._id == socket._id) {
                array_of_connection[i].emit("new-msg-list2", newMessageforChatList2)
              }
            }
          })
        })
        
        for (let i = 0; i < array_of_connection.length; i++) {
          if (array_of_connection[i]._id == id) {
            // array_of_connection[i].emit("new-msg-list", newMessageforChatList)
           
            console.log('the current url: ', array_of_connection[i].currentUrl)

            console.log('curll', curUrl)
            if (array_of_connection[i].currentUrl == socket._id) {
              db.chatSchema
                .findOneAndUpdate({ _id: messageNew._id }, { status: 'seen' })
                .exec((err, m) => {
                  if (m) {
                    messageNew = {
                      msg: message.msg,
                      senderId: socket._id,
                      receiverId: id,
                      _id: m._id,
                      delete: m.delete,
                      status: 'seen'
                    }
                   // console.log('seen result', res1)
                    array_of_connection[i].emit("msg", messageNew);

                  }
                })
            } else {
              array_of_connection[i].emit("msg", messageNew);
            }

          }
        }
        for (let i = 0; i < array_of_connection.length; i++) {
            if (array_of_connection[i]._id == socket._id) {

              
               db.chatSchema
                .findOne({ _id: messageNew._id })
                  .exec((err, res11) => {
                    messageNew = {
                      msg: message.msg,
                      senderId: socket._id,
                      receiverId: id,
                      _id: m._id,
                      delete: m.delete,
                      status: res11.status
                    }
                    array_of_connection[i].emit("msg", messageNew);

                 console.log('here message', messageNew)
                  })
              
            }
        
        }
        
      });

      
    });
    socket.on("new-post", (post) => {
      db.userSchema
        .findOne({ _id: socket._id })
        .populate("friends")
        .exec((err, users) => {
          for (let i = 0; i < array_of_connection.length; i++) {
            for (let j = 0; j < users.friends.length; j++) {
              if (array_of_connection[i]._id == users.friends[j]._id) {

                post['owner'] = 'gggggg'
                array_of_connection[i].emit("new-post", post);
              }
            }
          }
        });
      post.owner = 'gggggg'
      socket.emit("new-post", post);
    });
    socket.on('current-url', (url) => {
      console.log('current-url', url)
       for (let i = 0; i < array_of_connection.length; i++) {
            if (array_of_connection[i]._id == socket._id) {
              array_of_connection[i].currentUrl = url;
            }
        }
    })
    socket.on('edit-post', (post) => {
      db.postSchema.findOneAndUpdate({ _id: post.id }, { text: post.text }).exec((err, res) => {
        db.userSchema.findOne({ _id: post.owner })
          .populate('friends')
          .exec((err, users) => {
            for (let i = 0; i < array_of_connection.length; i++) {
              for (let j = 0; j < users.friends.length; j++) {
                if (array_of_connection[i]._id == users.friends[j]._id) {
                  array_of_connection[i].emit("edit-post", post);
                }
              }
            }
            for (let i = 0; i < array_of_connection.length; i++) {
              if (array_of_connection[i]._id == socket._id) {
                array_of_connection[i].emit("edit-post", post)
              }
            }
          })
      })
      // console.log('chat, edit-post', post)
      // for (let i = 0; i < array_of_connection.length; i++) {

      // array_of_connection[i].emit("new-msg-list", newMessageforChatList)
      // array_of_connection[i].emit("edit-post", post);

      // if (array_of_connection[i]._id == socket._id){
      //   array_of_connection[i].emit("new-msg-list", newMessageforChatList)
      // }
      // }
    });

    socket.on('delete-post', (post) => {
     // console.log('chat.js, delete-post', post);
      db.postSchema.findOneAndRemove({ _id: post.postid }).exec((err, res) => {
        db.userSchema.findOneAndUpdate({ _id: post.ownerid },
          {
            $pull: {
              posts: mongoose.Types.ObjectId(post.postid.toString())
            }
          })
          .populate('friends')
          .exec((err, users) => {
            for (let i = 0; i < array_of_connection.length; i++) {
              for (let j = 0; j < users.friends.length; j++) {
                if (array_of_connection[i]._id == users.friends[j]._id) {
                  array_of_connection[i].emit("delete-post", post);
                }
              }
            }
            for (let i = 0; i < array_of_connection.length; i++) {
              if (array_of_connection[i]._id == socket._id) {
                array_of_connection[i].emit("delete-post", post)
              }
            }
          })
      })
    })

    socket.on("new-fr-req", (id) => {
      for (let i = 0; i < array_of_connection.length; i++) {
        if (array_of_connection[i]._id == id) {
          db.userSchema.findOne({ _id: id }).exec((err, result) => {
            array_of_connection[i].emit("new-fr-req", result);
          });
        }
      }
    });

    socket.on("new-fr-req", (id) => {
      for (let i = 0; i < array_of_connection.length; i++) {
        if (array_of_connection[i]._id == id) {
          db.userSchema.findOne({ _id: id }).exec((err, result) => {
            array_of_connection[i].emit("new-fr-req", result);
            array_of_connection[i].emit("get-fr-req-data", "111111111");
          });
        }
      }
    });

    socket.on("new-comment", async (msg) => {
      // console.log('chat.js new-comment', msg, ', user id:', socket._id)
      // let connectionsSet = new Set(array_of_connection)
      let newComment = new db.commentSchema();
      //console.log("sender id", socket._id)
      newComment.content = msg.comment;
      (newComment.post = msg.postID), (newComment.user = socket._id);
      newComment.save((err, comment) => {
        db.postSchema
          .updateOne({ _id: msg.postID }, { $push: { comments: comment._id } })
          .exec(() => {
            db.postSchema
              .findOne({ _id: comment.post })
              .populate("owner")
              .exec((err, post) => {
                let friendList = post.owner.friends
                for (let conn of array_of_connection) {
                  // if (friendList.indexOf(conn._id) !== -1) {
                  io.to(conn.id).emit("new-comment-posted", comment)
                  // }
                }
              });
          })
      });
    });
    // socket.on('get-fr-req-data', (id) => {
    //   for (let i = 0; i < array_of_connection.length; i++) {
    //     if (array_of_connection[i]._id == id) {
    //       console.log('cha.js', id)

    //       db.userSchema.findOne({ _id: id })
    //         .exec((err, result) => {
    //           array_of_connection[i].emit('get-fr-req-data', '111111111')
    //         })

    //     }
    //   }
    // })
    socket.on('add-remove-like', (postId) => {
      // console.log("sender like id", socket._id)
      // console.log('post id', postId.postID)


      db.likeSchema.findOne({ $and: [{ post: postId.postID, user: socket._id }] })
        .exec((err, result) => {
          if (err) {
            throw err
          } if (result !== null) { // pull like
            db.likeSchema.findOne({ $and: [{ post: postId.postID }, { user: socket._id }] }).exec((err, like1) => {
              db.likeSchema.findOneAndRemove({ $and: [{ post: postId.postID }, { user: socket._id }] }).exec((err, rs) => {
                db.postSchema.findOneAndUpdate({ _id: postId.postID },
                  {
                    $pull: {
                      likes: mongoose.Types.ObjectId(like1._id.toString())
                    }
                  })
                  .populate('owner')
                  .exec((err, post) => {
                   // console.log('0000 ', like1)
                    let friendList = post.owner.friends
                    for (let conn of array_of_connection) {
                      // if (friendList.indexOf(conn._id) !== -1) {
                      io.to(conn.id).emit("remove-like", like1)
                      // }
                    }
                  })
              })
            })
          } if (result == null) {
            const newLike = new db.likeSchema();
            newLike.post = postId.postID;
            newLike.user = socket._id
            newLike.save((err, like) => {
              db.postSchema
                .findOneAndUpdate({ _id: postId.postID }, { $push: { likes: like._id } })
                .populate('owner')
                .exec((err, post) => {
                  let friendList = post.owner.friends
                  for (let conn of array_of_connection) {
                    // if (friendList.indexOf(conn._id) !== -1) {
                    io.to(conn.id).emit("add-like", like)
                    // }
                  }
                })

            });
          }
        })

    })

    socket.on('remove-friend', (data) => {
      // console.log('socket remove-friend', data, 'owner:', senderTokent.user._id);
      db.userSchema.findOneAndUpdate({ _id: senderTokent.user._id },
        {
          $pull: {
            friends: mongoose.Types.ObjectId(data['id'])
          }
        },
        function (err, user) {
          socket.emit('remove-friend-ok', 'ok')
        });
        db.userSchema.findOneAndUpdate({_id: data['id']},
        {
          $pull: {
            friends: senderTokent.user._id
          }
        }, (err, user) => {

        });
    });
    
    socket.on('enc-msg', (msg) => {
      console.log('enc-msg', msg)
      for (let i = 0; i < array_of_connection.length; i++) {
        if (array_of_connection[i]._id == msg.id) {
          array_of_connection[i].emit('enc-msg', {msg: msg.msg, senderId: socket._id})
        }
      }
    })

    // call request
    socket.on('call-request', async (id) => {
      const user = await db.userSchema.findById(socket._id);
      for (let i = 0; i < array_of_connection.length; i++) {
        if (array_of_connection[i]._id == id) {
          array_of_connection[i].emit('call-request', {sender: socket._id, name: user.name})
        }
      }
    });
    // end call request

    // video call
    socket.on('call-user', (data) => {
      console.log(data)
      for (let i = 0; i < array_of_connection.length; i++) {
        if (array_of_connection[i]._id == data.to) {
          array_of_connection[i].emit('call-made', {offer: data.offer, socket: socket._id})
        }
      }
    })

    socket.on('make-answer', data => {
      for (let i = 0; i < array_of_connection.length; i++) {
        if (array_of_connection[i]._id == data.to) {
          array_of_connection[i].emit('answer-made', {answer: data.answer, socket: socket._id})
        }
      }
    })
    // end video call
    
      // open camera for both
      socket.on('start-video', (data) => {
        for (let i = 0; i < array_of_connection.length; i++) {
          if (array_of_connection[i]._id == data.id) {
            array_of_connection[i].emit('start-video');
          }
        }
      });
      //end open camera for both

    socket.on('disconnect',  async () => {
      socket.removeAllListeners();
       let uu = await db.userSchema.findOneAndUpdate({_id: socket._id}, {online: false});
      //  console.log('uuuu', uu)
       array_of_connection.forEach((socket) => {
        socket.emit('friend-leave2', uu._id)
       })
      
    
    });
  });
};
