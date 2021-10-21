const request = require("request");
const express = require("express");
const util = require("util");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
require('dotenv').config();
const session = require("express-session");
const passport = require("passport");
const findOrCreate = require("mongoose-findorcreate");
const passportLocalMongoose = require("passport-local-mongoose");
const url = require("url");
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
var port = process.env.PORT;
var usrDetails="knk";
let profilePictureUrl;

if (port === null || port === undefined || port === "")
  port = 3000;
app.listen(port, () => console.log("Server is started on " + port));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "seniorCircle's_secretKey",
  resave: true,
  saveUnintialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DATABASE_LINK, { useNewUrlParser: true },
  err => err ? console.log(err) : console.log('Connected to database'));

const userSchema = new mongoose.Schema({
  // _id: Object,
  firstName: String,
  imageUrl: String,
  lastName: String,
  username: String,
  email: String,
  Branch: {
    type: String,
    required: false,
  },
  year: Number,
  password: String,
  googleId: String,
  linkedinId: String,
});const doubtSchema = new mongoose.Schema({
  author: String,
  question: String,
  answer: String,
});
const commentSchema = new mongoose.Schema({
  likes: Number,
  user_id: mongoose.Types.ObjectId,
  description: String,
});
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "You didn't enter title"],
  },
  author_id: mongoose.Types.ObjectId,
  description: String,
  companyName: String,
  date: String,
  time: String,
  comment: commentSchema,
  author: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Blog = mongoose.model("Blog", blogSchema);
const Review = mongoose.model("Review", commentSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: process.env.G_CLIENT_ID,
  clientSecret: process.env.G_CLIENT_SECRET,
  callbackURL: "https://agile-castle-96458.herokuapp.com/auth/google/home",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
},
  function (accessToken, refreshToken, profile, cb) {
    //  console.log(profile);
     if (profile.photos[0] === undefined)
      profilePictureUrl = undefined;
    else profilePictureUrl = profile.photos[0].value;
    User.findOrCreate({ googleId: profile.id, 
      username: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      imageUrl: profilePictureUrl,
      email: profile.emails[0].value 
    }, function (err, user) { 
    // userDetails = {
    //   firstName: profile.name.givenName,
    //   lastName: profile.name.familyName,
    //   googleId: profile.id,
    //   imageUrl: profilePictureUrl,
    //   email: profile.emails[0].value
    // };
      return cb(err, user);
    });
  }
));

passport.use(new LinkedInStrategy({
  clientID: process.env.L_CLIENT_ID,
  clientSecret: process.env.L_CLIENT_SECRET,
  callbackURL: "https://agile-castle-96458.herokuapp.com/auth/linkedin/home",
  scope: ['r_emailaddress', 'r_liteprofile'],
  state: true
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    // console.log(profile);
    if (profile.photos[3] === undefined)
    profilePictureUrl = undefined;
  else profilePictureUrl = profile.photos[3].value;
    User.findOrCreate({ linkedinId: profile.id, 
          username: profile.id,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          imageUrl: profilePictureUrl,
          email: profile.emails[0].value
    
    }, function (err, user) {
  
        // userDetails = {
        //   firstName: profile.name.givenName,
        //   lastName: profile.name.familyName,
        //   linkedinId: profile.id,
        //   imageUrl: profilePictureUrl,
        //   email: profile.emails[0].value
        // };
      return done(err, user);
    });
    return done(null, profile);
  });
}));


app.get('/auth/linkedin',
  passport.authenticate('linkedin'));

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  app.get('/auth/linkedin/home', passport.authenticate('linkedin', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect("/home");
  });

app.get('/auth/google/home',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/home');
  });


app.get("/home", (req, res) => {
  // console.log(req.user);
  if (req.isAuthenticated()) {
    res.redirect("/")
  }
  else {
    res.redirect("/login");
  }

})


app.get("/", (req, res) => { 
  if(req.isAuthenticated()){ 
    let currentUser;
    (async ()=>{
      if(req.user.provider==="linkedin")
         currentUser = await User.findOne({username:req.user.id});
      else if(req.user.provider==="google")
         currentUser = await User.findOne({username:req.user.emails[0].value});
      else{
        currentUser = await User.findOne({username:req.user.username});
      } 
      console.log( currentUser );
      res.render("index", { signedIN: true, usrDetails: currentUser });
    })();
  }
  else{
    // if (req.query && req.query.code && req.query.state) {
    //   let AUTHCODE = req.query.code;
    //   LinkedinInfo(AUTHCODE, res);
    // }
    // else { 
      res.render("index", {signedIN: false});
    // }
  }
});



app.post("/", (req, res) => { 
  // console.log(req.user);
  const date = new Date();
  const cur_time = date.toLocaleTimeString("en-US");
  var options = { year: "numeric", month: "numeric", day: "numeric" };
  const blog_date = date.toLocaleDateString("en-US", options);
  const blog = new Blog({
    title: req.body.title,
    description: req.body.description,
    date: blog_date,
    time: cur_time,
    companyName: req.body.company,
    author:req.user.username,
  });
  console.log(blog);
  blog.save();
  res.redirect("/");
});


app.post("/register", (req, res) => {
  let Users = new User({
    email: req.body.username,
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    // imageUrl: "../images/unkonwn.jpg"
  });
  // userDetails = Users;
  User.register(Users, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/home");
      });
    }
  });
});

app.post("/login", (req, res) => { 
  console.log("1111")
  let user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err) => {
    if (err){
      console.log(err);
      res.redirect("/login");
    }

    else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/home");
      });
      res.redirect("/login");
    }
  });
}); 

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/apps/realloginpage.html");
})

app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/apps/login1.html");
})

app.get("/signout",(req,res)=>{
  req.logout();
  res.redirect("/");
})

app.get("/compose", (req, res) => {
  if(req.isAuthenticated())
  res.render("Blog");
  else res.redirect("/login");
});


app.get("/company",(req,res)=>{
  if(req.isAuthenticated()){
    (async ()=>{
      if(req.user.provider==="linkedin")
         currentUser = await User.findOne({username:req.user.id});
      else if(req.user.provider==="google")
         currentUser = await User.findOne({username:req.user.emails[0].value});
      else{
        currentUser = await User.findOne({username:req.user.username});
      } 
      // console.log( currentUser );
      Blog.find({companyName:"amazone"},(err,foundUsers)=>{
        if(err) console.log(err);
        else{ 
          console.log(foundUsers);
          res.render("blog_page_new", { signedIN: true, usrDetails: currentUser, blogPosts: foundUsers });
        } });
    })();
  }
  else res.redirect("/login");
  });
  





















































// (async ()=>{
//   let status= await User.find({linkedinId:profile.id});
//   if(status[0]){ 
//     console.log("Already in the database"); 
//     userDetails = status[0];  
//   }
//     else
//    { console.log("Added in the database"); 
//    if(profile.photos[3]===undefined)
//          profilePictureUrl = "../images/unkonwn.jpg"; 
//    else 
//        profilePictureUrl = profile.photos[3].value;

//     let newUser = new User({
//       firstName : profile.name.givenName,
//       lastName : profile.name.familyName,
//       linkedinId : profile.id, 
//       imageUrl : profilePictureUrl,
//       email : profile.emails[0].value
//     }); 
//     userDetails = newUser; 
//     newUser.save();       
//    }
//    })(); 













// function LinkedinInfo(authcode,res){  
// console.log("AUTHCODE = "+authcode);
// request.get({ url: "https://www.linkedin.com/oauth/v2/accessToken", form: { 
// grant_type:'authorization_code',
// code:authcode,
// redirect_uri:'http://localhost:3000/',
// client_id:'78armc0eqkp8bl',
// client_secret:'6K15S30vLB1jiiDE'
// } }, (err, resp, body) => {  
//     let usrDetails={};
//     let Token = JSON.parse(body).access_token; 
//     if (err) console.log(err);
//     else{ 
//         console.log("TOKEN = "+Token);
//     request.get({url:"https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~digitalmediaAsset:playableStreams))",headers:{"Authorization":"Bearer "+Token}},function(err,response,responseBody){
//         if(err) console.log("ERROR is "+err);
//         else{
//             let namejson = JSON.parse(responseBody);  
//             if(namejson.profilePicture)
//             usrDetails.usrProfilePictureLink=namejson.profilePicture['displayImage~'].elements[3].identifiers[0].identifier; 
//             else usrDetails.usrProfilePictureLink="https://raw.githubusercontent.com/DTU-DCODER/SeniorCircle/master/images/unknown%20profile%20picture.jpg"
//             console.log(usrDetails.usrProfilePictureLink);

//     request.get({url:"https://api.linkedin.com/v2/me",headers:{"Authorization":"Bearer "+Token}},function(err,response,responseBody){
//     if(err) console.log("ERROR is "+err);
//     else{
//         let namejson = JSON.parse(responseBody); 
//         usrDetails.usrName=namejson.localizedFirstName+" "+namejson.localizedLastName;
//         console.log("Name = "+usrDetails.usrName);  


//     request.get({url:"https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",headers:{"Authorization":"Bearer "+Token}},function(err,response,responseBody){
//         if(err) console.log("ERROR is "+err);
//         else{
//             let namejson = JSON.parse(responseBody); 
//             usrDetails.usrEmail=namejson["elements"][0]["handle~"]["emailAddress"];
//             console.log("Email Address = "+usrDetails.usrEmail);  
//             // return usrDetails;
//             // res.render("index",{usrDetails:usrDetails}); 
//              res.redirect("/home");
//             // usrDetails=JSON.stringify(usrDetails);
//             // res.redirect(url.format({
//             //     pathname:"/home",
//             //     query: {
//             //        "usrDetails":usrDetails
//             //      }
//             //   }));

//         }
//     });
//     }
// });
// }
// }); 
// }
// });
// }














// app.get("/",(req,res)=>{ 

//     // let Token=TOKEN; 
//     let usrDetails=LinkedinInfo(TOKEN,res);
//     // res.render("index",{usrDetails:usrDetails});
// });




// function LinkedinInfo(Token,res){   
//     let usrDetails={};
//         request.get({url:"https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~digitalmediaAsset:playableStreams))",headers:{"Authorization":"Bearer "+Token}},function(err,response,responseBody){
//             if(err) console.log("ERROR is "+err);
//             else{
//                 let namejson = JSON.parse(responseBody); 
//                 usrDetails.usrProfilePictureLink=namejson.profilePicture['displayImage~'].elements[3].identifiers[0].identifier;
//                 console.log(usrDetails.usrProfilePictureLink);

//         request.get({url:"https://api.linkedin.com/v2/me",headers:{"Authorization":"Bearer "+Token}},function(err,response,responseBody){
//         if(err) console.log("ERROR is "+err);
//         else{
//             let namejson = JSON.parse(responseBody); 
//             usrDetails.usrName=namejson.localizedFirstName+" "+namejson.localizedLastName;
//             console.log("Name = "+usrDetails.usrName);  


//         request.get({url:"https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",headers:{"Authorization":"Bearer "+Token}},function(err,response,responseBody){
//             if(err) console.log("ERROR is "+err);
//             else{
//                 let namejson = JSON.parse(responseBody); 
//                 usrDetails.usrEmail=namejson["elements"][0]["handle~"]["emailAddress"];
//                 console.log("Email Address = "+usrDetails.usrEmail);   
//                 // return usrDetails;
//                 res.render("index",{usrDetails:usrDetails});
//             }
//         });
//         }
//     });
//     }
//     });  
//     }










//agile-castle-96458
//https://agile-castle-96458.herokuapp.com/ 