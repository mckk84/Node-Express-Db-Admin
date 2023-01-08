const express = require("express");
const app = express();
const cors = require("cors");
const cookieparser=require("cookie-parser")
const sessions=require("express-session");
const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');
app.use(cookieparser());
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

const dbConn = require('./modules/dbconnection');
const port = 8000;
const saltRounds = 10;
let databases = [];
var session;

var corsOptions = {
  origin: "http://localhost:3000",
  credentials:true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  session = req.session;
  session.destroy();
  const DbService = dbConn.getDbInstance();
  databases = DbService.getDatabases().then(databases => {
    session.databases = databases;
    const selectedDatabase = '';
    console.log('session:', session.databases);
    res.render("index", {databases:databases,selectedDatabase:selectedDatabase});
  }).catch(err => console.log(err));
});

app.get("/login", (req, res) => {
  session = req.session;
  if( session.user )
  {
    console.log(session.user);
    res.send({login:true, user:session.user.email});
  }
  else{
    res.send({login:false,user:false,msg:""});
  }
});

app.get("/logout", (req, res) => {
  session = req.session;
  session.destroy();
  session.user = false;
  session.login = false;
  res.send({login:false, user:false});
});

app.post("/login", (req, res) => {
  session = req.session;
  if( session.user )
  {
    console.log(session.user);
    res.send({login:true, user:session.user.email});
  }
  const email = req.body.email;
  const password = req.body.loginpassword;
  console.log(email);
  console.log(password);

  const DbService = dbConn.getDbInstance();
  databases = DbService.connectToDatabase('test').then(db_connection => {
    
    let sql = `SELECT * FROM users WHERE email='${email}'`;
    DbService.db_query(db_connection, sql).then(result => 
    {
        if(result.length > 0)
        {
            bcrypt.compare(password,result[0].password,(errr, response)=>{
            if( response )
            {
              session.user = result[0];
              res.send({login:true, user:email});
            }
            else
            {
               res.send({login:false,msg:"Wrong Password"});  
            }
          })
         }
         else{
            res.send({login:false,msg:"User Email Not Exits"});
         }
      }).catch(err => console.log(err));    

  }).catch(err => console.log(err));
});

app.get("/database", async (req, res) => 
{
  console.log('databases: ', req.query.db);
  session = req.session;
  session.database = req.query.db;
  let selectedDatabase = req.query.db;
  let tables = [];
  const DbService = dbConn.getDbInstance();

  await DbService.connectToDatabase(selectedDatabase).then(db_connection => {

      DbService.getTables(db_connection, selectedDatabase).then(tables => {

        if( session.databases )
        {
          databases = session.databases;
          console.log('databases', databases);
        }
        res.render("index", {databases:databases, selectedDatabase:selectedDatabase, tables:tables});

      }).catch(err => console.log(err));
    
  }).catch(err => console.log('Could not connect to Database'));
  
});

app.get("/table", async (req, res) => 
{
  session = req.session;
  if( typeof session.database == 'undefined' )
  {
    res.redirect('/');
  }
  let selectedDatabase = session.database;
  let table = req.query.table;
  let tableData = [];

  const DbService = dbConn.getDbInstance();
  await DbService.connectToDatabase(selectedDatabase).then(db_connection => {
      DbService.getTables(db_connection, selectedDatabase).then(tables => {
        if( session.databases )
        {
          databases = session.databases;
        }
        session.tables = tables;

        let sql = "SELECT * FROM "+table;
        
        DbService.db_query(db_connection, sql).then(tableData => {
            
            res.render("index", {
                databases:databases, 
                selectedDatabase:selectedDatabase, 
                tables:tables, 
                table:table,
                tableData: tableData 
              });
        }).catch(err => console.log(err));

      }).catch(err => console.log(err));
    
  }).catch(err => console.log('Could not connect to Database'));
  
  
});  

app.listen(port, () => {
  console.log(`NodeMyAdmin app listening at http://localhost:${port}`);
});