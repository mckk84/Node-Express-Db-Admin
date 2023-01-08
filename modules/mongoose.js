const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { UserModel } = require("../Models/User.model");
const { cartModel } = require("../Models/Cart.model");
const { productModel } = require("../Models/Product.model");
const { wishlistModel } = require("../Models/wishlist.model");


let instance = null;
dotenv.config();

//MNIAtrQJAe8W5eIQ
//const connection = mongoose.connect("mongodb+srv://mjaved98:javed9838@cluster0.xwu1ihr.mongodb.net/farfetch?retryWrites=true&w=majority");

let url = "mongodb+srv://charan:MNIAtrQJAe8W5eIQ@cluster0.07bxow4.mongodb.net/?retryWrites=true&w=majority";

const connection = mongoose.createConnection(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//mongodb+srv://charan:<password>@cluster0.07bxow4.mongodb.net/?retryWrites=true&w=majority

module.exports = { connection }; 