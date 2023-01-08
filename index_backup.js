const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const cookieparser=require("cookie-parser")
const DbService = require("./modules/DbService");
const LocalStorage = require("./modules/localStorage");

app.set('view engine', 'ejs');
app.use(cookieparser());

const port = 8000;

let databases = [];
var session;

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({
    extended: true,
  })
);

app.get("/", async (req, res) => {
  let cache = LocalStorage.getInstance();
  let msg = cache.getGlobalMessage();
  cache.setGlobalMessage('');
  let URI = cache.getUrl();
  console.log(URI);
  if( !URI )
  {
    res.render("index", {databases:false,msg:msg});
  }
  else
  {
    console.log('connecting to db');
    const dbObject = DbService.getDbInstance();
    let dbClient = dbObject.getClient();
    let selectedDatabase = '';
    dbClient.connect(URI).then((dbConnect) => {
      console.log('connected');
      dbConnect.db().admin().listDatabases().then((collections) => {
        cache.setDatabases(collections.databases);
        msg = "Select a Database";
        res.render("index", {URI:URI,msg:msg,databases:collections.databases, selectedDatabase:selectedDatabase});
      }).catch(err => {
        console.log(err);
        cache.setGlobalMessage("Failed to get databases from MongoDB");
        res.redirect('/');
        return false;  
      });
    }).catch(err => {
      console.log('MongoDB connect failed.');
      console.log(err);
      cache.setGlobalMessage("Failed to connect MongoDB");
      res.redirect('/');
      return false;
    });
  }
});

app.post("/connect", async (req, res) => {
  let cache = LocalStorage.getInstance();
  let connecturl = req.body.connectionurl.trim();
  console.log(connecturl);
  if( connecturl == "" || connecturl.search('mongodb') == -1 )
  {
    cache.setGlobalMessage("connecturl is invalid");
    res.redirect('/');
    return false;
  }
  else
  {
    const dbObject = DbService.getDbInstance();
    let dbClient = dbObject.getClient();
    dbClient.connect(connecturl).then((dbConnect) => 
    {
      cache.setUrl(connecturl);
      cache.setGlobalMessage("Connected Successfully");
      res.redirect('/');
      return true;
    }).catch(err => {
      console.log(err);
      cache.setGlobalMessage("Failed to connect");
      res.redirect('/');
      return true;
    });
  }
});

app.get("/disconnect", async(req, res) => {
  let cache = LocalStorage.getInstance();
  cache.clearCache();
  res.redirect('/');
  return false;
});

app.get("/database", async (req, res) => 
{
  let ls = LocalStorage.getInstance(); 
  let dbinstore = ls.getDatabases();

  let database = req.query.db;
  let selectedDatabase = database;
  const dbObject = DbService.getDbInstance();
  if( dbinstore.length )
  {
    let collections = ls.getDbCollection(database);
    console.log('collections in local', collections);
    if( collections == false )
    {
      let dbClient = dbObject.getClient();
      let URI = ls.getUrl();
      dbClient.connect(URI).then((dbConnect) => {
        dbConnect.db(selectedDatabase).listCollections().toArray().then((collections) => {
          ls.setDbCollection(selectedDatabase, collections);
          res.render("index", {
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
      res.render("index", {
        databases:dbinstore, 
        selectedDatabase:selectedDatabase,
        tables:collections 
      });
    }
  }
  else
  {
    let dbClient = dbObject.getClient();
    let URI = ls.getUrl();
    dbClient.connect(URI).then((dbConnect) => {
      dbConnect.db(selectedDatabase).listCollections().toArray().then((collections) => {
        res.render("index", {
          URI:URI,
          databases:dbinstore, 
          selectedDatabase:selectedDatabase,
          tables:collections 
        });
      });
    });
  }
});

app.get("/table", async (req, res) => 
{
  let table = req.query.table;
  let selectedDatabase = req.query.db;
  let skip = 0;
  if( typeof req.query.skip != 'undefined' )
  {
    skip = parseInt(req.query.skip);
  }
  let ajax = ( req.query.ajax ) ? 1 : 0;
  let modelData = [];
  let ls = LocalStorage.getInstance();
  let URI = ls.getUrl(); 
  let dbinstore = ls.getDatabases();
  let collections = ls.getDbCollection(selectedDatabase);
  const dbObject = DbService.getDbInstance();
  let dbClient = dbObject.getClient();  

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
                      URI:URI,
                      table:table,
                      tableData:modelData 
                    });
                  } else {
                    res.render("index", {
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
                    URI:URI,
                    table:table,
                    tableData:modelData 
                  });
                } else {
                  res.render("index", {
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

app.listen(port,async()=>{
    console.log(`Listning on ${port}`)
})