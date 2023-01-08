const { Router } = require("express");
require("dotenv").config();
const MongoDbService = require("../modules/mongodb");

const MongoDbController = Router();

MongoDbController.get("/", async (req, res) => {
  let DbService = MongoDbService.getInstance();
  let msg = DbService.getGlobalMessage();
  DbService.setGlobalMessage('');
  let URI = DbService.getUrl();
  if( !URI )
  {
    res.render("mongodb", {title:"Mongo Db Admin",page:"mongodb", msg: msg});
  }
  else
  {
    console.log('connecting to db');
    let dbClient = DbService.getClient();
    let selectedDatabase = '';
    dbClient.connect(URI).then((dbConnect) => {
      console.log('connected');
      dbConnect.db().admin().listDatabases().then((collections) => {
        DbService.setDatabases(collections.databases);
        msg = "Select a Database";
        res.render("mongodb", {title:"Mongo Db Admin", page:"mongodb",URI:URI,msg:msg,databases:collections.databases, selectedDatabase:selectedDatabase});

      }).catch(err => {
        console.log(err);
        DbService.setGlobalMessage("Failed to get databases from MongoDB");
        res.redirect('/mongodb');
        return false;  
      });
    }).catch(err => {
      console.log('MongoDB connect failed.');
      console.log(err);
      DbService.setGlobalMessage("Failed to connect MongoDB");
      res.redirect('/mongodb');
      return false;
    });
  }
});

MongoDbController.post("/connect", async (req, res) => {
  let DbService = MongoDbService.getInstance();
  let connecturl = req.body.connectionurl.trim();
  console.log(connecturl);
  if( connecturl == "" || connecturl.search('mongodb') == -1 )
  {
    DbService.setGlobalMessage("connecturl is invalid");
    res.redirect('/mongodb');
    return false;
  }
  else
  {
    let dbClient = DbService.getClient();
    dbClient.connect(connecturl).then((dbConnect) => 
    {
      DbService.setUrl(connecturl);
      DbService.setGlobalMessage("Connected Successfully");
      res.redirect('/mongodb');
      return true;
    }).catch(err => {
      console.log(err);
      DbService.setGlobalMessage("Failed to connect");
      res.redirect('/mongodb');
      return true;
    });
  }
});

MongoDbController.get("/disconnect", async(req, res) => {
  let DbService = MongoDbService.getInstance();
  DbService.clearCache();
  res.redirect('/mongodb');
  return false;
});

MongoDbController.get("/database", async (req, res) => 
{
  let DbService = MongoDbService.getInstance(); 
  let dbinstore = DbService.getDatabases();
  let dbClient = DbService.getClient();
  let URI = DbService.getUrl();

  let database = req.query.db;
  let selectedDatabase = database;
  if( dbinstore.length )
  {
    let collections = DbService.getDbCollection(database);
    if( collections == false )
    {
      dbClient.connect(URI).then((dbConnect) => {
        dbConnect.db(selectedDatabase).listCollections().toArray().then((collections) => {
          DbService.setDbCollection(selectedDatabase, collections);
          res.render("mongodb", {
          	title:"Mongo Db Admin",
            page:"mongodb",
            URI:URI,
            databases:dbinstore, 
            selectedDatabase:selectedDatabase,
            tables:collections 
          });
        });
      });
    }
    else
    {
      console.log('collections in local', collections);
      res.render("mongodb", {
      	title:"Mongo Db Admin",
        page:"mongodb",
        URI:URI,
        databases:dbinstore, 
        selectedDatabase:selectedDatabase,
        tables:collections 
      });
    }
  }
  else
  {
    let dbClient = DbService.getClient();
    let URI = DbService.getUrl();
    dbClient.connect(URI).then((dbConnect) => {
      dbConnect.db(selectedDatabase).listCollections().toArray().then((collections) => {
        res.render("mongodb", {
          title:"Mongo Db Admin",
          page:"mongodb",
          URI:URI,
          databases:dbinstore, 
          selectedDatabase:selectedDatabase,
          tables:collections 
        });
      });
    });
  }
});

MongoDbController.get("/table", async (req, res) => 
{
  let table = req.query.table;
  let selectedDatabase = req.query.db;
  let filter = ( typeof req.query.filter != 'undefined') ? req.query.filter : '{}';
  let project = ( typeof req.query.project != 'undefined') ? req.query.project : '';
  let sort = ( typeof req.query.sort != 'undefined') ? req.query.sort : '';
  let skip = 0;
  if( typeof req.query.skip != 'undefined' )
  {
    skip = parseInt(req.query.skip);
  }
  let ajax = ( req.query.ajax ) ? 1 : 0;
  let modelData = [];
  let DbService = MongoDbService.getInstance();
  let URI = DbService.getUrl(); 
  let dbinstore = DbService.getDatabases();
  let collections = DbService.getDbCollection(selectedDatabase);
  let dbClient = DbService.getClient();  

  if( collections == false )
  {            
      dbClient.connect(URI).then((dbConnect) => {
          dbConnect.db(selectedDatabase).listCollections().toArray().then((tables) => { 
            var dbo = dbConnect.db(selectedDatabase);
            dbo.collection(table).find({}).skip(skip).limit(10).toArray()
              .then((modelData) => {
                  dbConnect.close();
                  if( ajax ){
                    res.json({
                      table:table,
                      tableData:modelData 
                    });
                  } else {
                    res.render("mongodb", {
                      title:"Mongo Db Admin",page:"mongodb",
                      URI:URI,
                      databases:dbinstore,
                      selectedDatabase:selectedDatabase,
                      tables:tables, 
                      table:table,
                      tableData:modelData 
                    });
                  }      
              });
          });
       });
    
  }else{

  dbClient.connect(URI).then((dbConnect) => {
      var dbo = dbConnect.db(selectedDatabase);
      dbo.collection(table).find({}).skip(skip).limit(10).toArray()
        .then((modelData) => {
            dbConnect.close();
            if( ajax ){
              res.json({
                table:table,
                tableData:modelData 
              });
            } else {
              res.render("mongodb", {
              	title:"Mongo Db Admin",page:"mongodb",
                URI:URI,
                databases:dbinstore,
                selectedDatabase:selectedDatabase,
                tables:tables, 
                table:table,
                tableData:modelData 
              });
            }      
        });
   });
  }
});  

MongoDbController.post("/table", async (req, res) => 
{
  let table = req.query.table;
  let selectedDatabase = req.query.db;

  console.log(req.body.filter);
  let filter = {};
  if( req.body.filter ) {
    try{
      filter = JSON.parse(req.body.filter);
    }catch(e){
      console.log(e);
      res.status(500).send("Could not parse <b>filter</b> paramter");
      return false;
    }
  }

  let project = {};
  if( req.body.project ) {
    try{
      project = JSON.parse(req.body.project);
    }catch(e){
      console.log(e);
      res.status(500).send("Could not parse <b>project</b> paramter");
      return false;
    }
  }

  let sort = {};
  if( req.body.sort ) {
    try{
      sort = JSON.parse(req.body.sort);
    }catch(e){
      console.log(e);
      res.status(500).send("Could not parse <b>sort</b> paramter");
      return false;
    }
  } 

  let skip = 0;
  if( typeof req.body.skip != 'undefined' )
  {
    skip = parseInt(req.query.skip);
  }
  let ajax = ( req.query.ajax ) ? 1 : 0;
  let modelData = [];
  let DbService = MongoDbService.getInstance();
  let URI = DbService.getUrl(); 
  let dbinstore = DbService.getDatabases();
  let collections = DbService.getDbCollection(selectedDatabase);
  let dbClient = DbService.getClient();  

  if( collections == false )
  {            
      dbClient.connect(URI).then((dbConnect) => {
          dbConnect.db(selectedDatabase).listCollections().toArray().then((tables) => { 
            var dbo = dbConnect.db(selectedDatabase);
            dbo.collection(table).find(filter).project(project).sort(sort).skip(skip).limit(10).toArray()
              .then((modelData) => {
                  dbConnect.close();
                  if( ajax ){
                    res.json({
                      table:table,
                      tableData:modelData 
                    });
                  } else {
                    res.render("mongodb", {
                      title:"Mongo Db Admin",page:"mongodb",
                      URI:URI,
                      databases:dbinstore,
                      selectedDatabase:selectedDatabase,
                      tables:tables, 
                      table:table,
                      tableData:modelData 
                    });
                  }      
              });
          });
       });
    
  }else{

  dbClient.connect(URI).then((dbConnect) => {
      var dbo = dbConnect.db(selectedDatabase);
      dbo.collection(table).find(filter).project(project).sort(sort).skip(skip).limit(10).toArray()
        .then((modelData) => {
            dbConnect.close();
            if( ajax ){
              res.json({
                table:table,
                tableData:modelData 
              });
            } else {
              res.render("mongodb", {
                title:"Mongo Db Admin",page:"mongodb",
                URI:URI,
                databases:dbinstore,
                selectedDatabase:selectedDatabase,
                tables:tables, 
                table:table,
                tableData:modelData 
              });
            }      
        });
   });
  }
});  

module.exports = { MongoDbController };