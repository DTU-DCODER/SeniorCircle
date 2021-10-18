const secrets = require("./uri");
// const { apply } = require('core-js/fn/reflect');
const mongoose = require("mongoose");
// const { config } = require('yargs');
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
// mongoose.connect(`mongodb+srv://${secrets.username}:${secrets.password}@${secrets.url}`)
mongoose.connect(
  "mongodb+srv://amit:RYqfUTDsgZPmE5B6@seniorcircle.z5ejt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
);
var signedIN = true;
const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  user_name: String,
  Branch: {
    type: String,
    required: false,
  },
  year: Number,
  linkedin_ID: String,
  password: String,
});

// localhost::5000/
const doubtSchema = new mongoose.Schema({
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
  author: userSchema,
});

const User = mongoose.model("User", userSchema);
const Blog = mongoose.model("Blog", blogSchema);
const Review = mongoose.model("Review", commentSchema);
// const user = new User({
//     first_name: "Akshit",
//     last_name : "Sharma",
//     user_name: "aks100",
//     year: 2,
// })
// user.save()
// const review = new Review({
//     title: "Internship at Google",
//     description: "XYZ",
// })
// const blog = new Blog({
//     title: "Internship at Google",
//     description: "XYZ",
//     review: review,

// })
// review.save();
// Review.updateOne({_id: '613b69f1f94287f776c8a012'},{likes:2},function(err,docs){
//     if(err){
//         console.log(err);
//     }
//     else{
//         console.log("Successfully updated ",docs)
//     }
// });
// Review.find(function(err, item){
//     if(err){
//         console.log(err);
//     }
//     else{
//         console.log(item);
//         mongoose.connection.close();
//     }
// });
console.log("Server started succesfully");

app.get("/", (req, res) => {
  res.render("index", { signedIN: signedIN });
});
app.get("/compose", (req, res) => {
  res.render("Blog");
});
app.use(bodyParser.urlencoded({ extended: true }));
app.post("/", function (req, res) {
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
  });
  console.log(blog);
  // blog.save();
  res.redirect("/");
});
app.listen(3000, () => {
  console.log("Server started at port 3000");
});
