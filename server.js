const app = require("express")();
const http = require("http").Server(app);
// const io = require("socket.io")(http, {
//   cors: {
//     origin: "http://localhost:8080",
//     methods: ["GET", "POST"]
//   }
// });
const io = require("socket.io")(http);
const morgan = require("morgan");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const db = require("./db/db");
var fs = require("fs");
const config = require("./config/config");

const indexRoute = require("./routes/index");
const messageRoute = require("./routes/user-message");
const uploadPhotoRoute = require("./routes/uploadaPhoto");
const postRoute = require("./routes/post");
const userRoute = require("./routes/users");
const friendRequestRoute = require("./routes/friendRequest");
const notificationsRoute = require("./routes/notifications");
const commentRoute = require("./routes/comment");

const getAllMessages = require("./routes/getAllMessages");
const checkMatchId = require("./routes/checkMatchId");
const getUSerName = require("./routes/getUserName");
const publicKey = require('./routes/getPublicKey');
const checkAuth = require('./routes/checkAuth');



// socket for route
// const io2 = require('socket.io')(http);
const onlineUsers = new Map();
const chatMessageRoute = require("./routes/cahtMessage")(io, onlineUsers);
const messageSeen = require('./routes/messageSentSeen')(io, onlineUsers);
try {
  io.on('connection', (socket) => {
    var userId;
    jwt.verify(socket.handshake.query.token, "lol", function (err, decoded) {
      if (err) return next(new Error("Authentication error"));
      socket.decoded = decoded;
      senderTokent = decoded;
     userId = socket.decoded.user._id.toString();
      onlineUsers.set(userId, socket.id); 
      console.log('io2 connected', onlineUsers);
    })
      
      socket.on('disconnect', () => {
        onlineUsers.delete(userId); // إزالة المستخدم عند قطع الاتصال
        console.log('io2 onnected', onlineUsers);
    });
  })
} catch (error) {
  console.log(' eroor 0099', error)
}

mongoose.Promise = global.Promise;
const url = "mongodb+srv://rabie:A1b2c3d4e5..!@cluster0.ahjsytc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const connectionParams={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
}
mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to database CLOUDE ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    })

  // const ConnectionUri = config.db;

// mongoose.connect(ConnectionUri, (err) => {
//   if (err) {
//     console.log("Error in connecting to Mongo DB !!");
//     throw err;
//   }
//   console.log("successfully connected to database ..");
// });

const user1 = new db.userSchema();
user1.name = 'samer'
user1.email = "samer@samer.samer";
user1.password = "1111111"
user1.friendRequest = []
user1.friends = []
db.userSchema.findOne({ email: 'samer@samer.samer' })
  .exec((err, user) => {
    if (err) console.log('server samer: ', err)
    if (!user) {
      user1.save((err, doc) => {
        fs.readFile(`uploads/avatar.png`, (err, data) => {
          fs.writeFile('uploads/' + doc._id + ".PNG", data, 'base64', function (err) {
          });
        })
      })
    }
  })

//old begin of socket
// app.set("socketio", app.io);
// app.io = io;
// var array_of_connection = [];
// app.io.use(function (socket, next) {
//   if (socket.handshake.query && socket.handshake.query.token) {
//     jwt.verify(socket.handshake.query.token, "lol", function (err, decoded) {
//       if (err) {
//         return next(new Error("Authentication error"));
//       }
//       decoded_token = decoded;
//       socket.handshake.query.decoded = decoded;
//       next();
//     });
//   } else {
//     next(new Error("Authentication error"));
//   }
// });
// app.io.sockets.on("connection", function (socket) {
//   console.log("connect client");
//   array_of_connection.push(socket);
// });
// app.set("array_of_connection", array_of_connection);
//old end of socket

const message = require("./routes/chat")(io);

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors());

app.use("/auth", indexRoute);
app.use("/user-msg", messageRoute);
app.use("/upload-photo", uploadPhotoRoute);
app.use("/post", postRoute);
app.use("/users", userRoute);
app.use("/friend-request", friendRequestRoute);
app.use("/notifications", notificationsRoute);
app.use("/comment", commentRoute);
app.use("/chat-message", chatMessageRoute);
app.use("/get-all-messages", getAllMessages);
app.use("/check-match-id", checkMatchId);
app.use("/get-user-name", getUSerName);
app.use('/public-key', publicKey);
app.use('/check-auth', checkAuth);
app.use('/seen', messageSeen);


const path = require("path");
const expressSS = require("express");

app.use(expressSS.static(path.join(__dirname, "uploads")));
app.use(expressSS.static(path.resolve("uploads")));
app.use("/profile-image/", expressSS.static("./uploads"));
app.use("/static", expressSS.static("posts"));

app.use(expressSS.static(__dirname + '/dist'));
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/dist/index.html'))
});

const port = process.env.PORT || config.port || 8000;
http.listen(port, (err) => {
  if (err) {
    throw err;
  } else {
    console.log(`server running on port ${port}`);
  }
});

//module.exports = app;
