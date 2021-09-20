// const { apply } = require('core-js/fn/reflect');
const mongoose = require('mongoose');
const { config } = require('yargs');
// mongoose.connect('mongodb://localhost:27017/userdb');
mongoose.connect('mongodb+srv://amit:b4SPE7hkFgJkiKRQ@seniorcircle.z5ejt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority')

const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    user_name: String,
    Branch:{
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
    answer: String
})
const commentSchema = new mongoose.Schema({
    likes: Number,
    user_id : mongoose.Types.ObjectId,
    description :String,
})
const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "You didn't enter title"]},
    author_id : mongoose.Types.ObjectId,
    description :String,
    comment: commentSchema,
})

const User = mongoose.model('User',userSchema);
const Blog = mongoose.model("Blog", blogSchema);
const Review = mongoose.model("Review", commentSchema);
const user = new User({
    first_name: "Akshit",
    last_name : "Sharma",
    user_name: "aks100",
    year: 2,
})
user.save()
const review = new Review({
    title: "Internship at Google",
    description: "XYZ",
})
const blog = new Blog({
    title: "Internship at Google",
    description: "XYZ",
    review: review,

})
review.save();
blog.save();
Review.updateOne({_id: '613b69f1f94287f776c8a012'},{likes:2},function(err,docs){
    if(err){
        console.log(err);
    }
    else{
        console.log("Successfully updated ",docs)
    }
});
Review.find(function(err, item){
    if(err){
        console.log(err);
    }
    else{
        console.log(item);
        mongoose.connection.close();
    }
});
console.log("Server started succesfully");
