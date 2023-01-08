const { MongoClient } = require('mongodb');
const URI = "mongodb+srv://charan:MNIAtrQJAe8W5eIQ@cluster0.07bxow4.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(URI);

module.exports = { client }; 