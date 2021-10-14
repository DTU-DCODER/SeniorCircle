const express = require("express");
const bodyParser = require("body-parser");
// const app = express();
// app.get("/", (req,res)=>{
//     res.send("Hello World");
// })
// app.use(express.static(path.resolve(__dirname, 'public')));

// app.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0' ); 

const secrets = require("./uri") ;

console.log("username" + secrets.username );
console.log("password " + secrets.password);
console.log("url " + secrets.url);
