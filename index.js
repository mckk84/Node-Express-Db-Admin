const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const expressLayouts = require('express-ejs-layouts')
require("dotenv").config();
const cookieparser=require("cookie-parser")
const moment = require("moment");

app.use((req, res, next)=>{
    res.locals.moment = moment;
    next();
});

app.set('view engine', 'ejs');
app.use(expressLayouts)
app.set('layout', './layouts/full-width')
app.use(cookieparser());
app.use(express.static('public'))

const {MySqlController} = require("./Routes/mysql.routes");
const {MongoDbController} = require("./Routes/mongodb.routes");

const port = process.env.SERVER_PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true,
  })
);

app.use("/mysql", MySqlController)
app.use("/mongodb", MongoDbController)

app.get("/", async (req, res) => {
    res.render("home", {title:"Node Database Admin", page:"home"});
});

app.listen(port, async()=>{
    console.log(`Server Listning on ${port}`)
})