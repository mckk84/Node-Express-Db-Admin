const { Router } = require("express");
require("dotenv").config();
const MySqlController = Router();
const MysqlService = require("../modules/mysql");

MySqlController.get("/", async (req, res) => {
  let DbService = MysqlService.getInstance();
  let msg = DbService.getGlobalMessage();
  DbService.setGlobalMessage('');
  let dbConfig = DbService.getClient();
  if( !dbConfig )
  {
    res.render("mysql", {title:"MySql Admin",page:"mysql", msg: msg});
  }
  else
  {
    let dbConfig = DbService.getClient();
    let dbConnection = DbService.connect(dbConfig);
    let selectedDatabase = '';
    dbConnection.connect((err) => {
    	if( err )
    	{
    		  console.log(err);
	      	let msg = "Failed to connect : "+err.message;
	      	res.render("mysql", {title:"MySql Admin",page:"mysql", msg: msg});
	      	return true;	
    	}
    	else
    	{
    		DbService.fetchDatabases(dbConnection).then(databases => {
    			DbService.setDatabases(databases);
    			dbConnection.end();
		        msg = "Select a Database";
		        res.render("mysql", {title:"MySql Admin",page:"mysql",msg:msg,databases:databases,selectedDatabase:selectedDatabase});
    		});
    	}
    });
    console.log('connected');
  }
});

MySqlController.post("/connect", async (req, res) => {
  let DbService = MysqlService.getInstance();
  let host = req.body.host.trim();
  let username = req.body.username.trim();
  let password = req.body.password.trim();
  let port = req.body.port.trim();

  if( host == "" || username == "" )
  {
    DbService.setGlobalMessage("Invalid connection parameters");
    res.redirect('/mysql');
    return false;
  }
  else
  {
  	let dbClient = DbService.createConnection(host, username, password, port);
    dbClient.connect((err) => 
    {
    	if( err )
    	{
    		console.log(err);
	      	DbService.setGlobalMessage("Failed to connect : "+err.message);
	      	res.redirect('/mysql');
	      	return true;		
    	}
    	else
    	{
    		dbClient.end();
    		DbService.setDbConfig(host, username, password, port);
	      	DbService.setGlobalMessage("Connected Successfully");
	      	res.redirect('/mysql');
	      	return true;
    	}
    });
  }
});

MySqlController.get("/disconnect", async(req, res) => {
  let DbService = MysqlService.getInstance();
  DbService.clearCache();
  res.redirect('/mysql');
  return false;
});

MySqlController.get("/database", async (req, res) => 
{
  let DbService = MysqlService.getInstance(); 
  let dbinstore = DbService.getDatabases();
  let dbConfig = DbService.getClient();
  let database = req.query.db;
  let selectedDatabase = database;
  dbConfig.database = selectedDatabase;
  let dbConnection = DbService.connect(dbConfig);
  if( dbinstore.length )
  {
    let tables = DbService.getTables(selectedDatabase);
    if( tables.length )
    {
    	res.render("mysql", {
	      	title:"MySql Admin",
	        page:"mysql",
	        databases:dbinstore, 
	        selectedDatabase:selectedDatabase,
	        tables:tables 
	    });
    }
    else
    {
      	dbConnection.connect((err) => {
	    	if( err )
	    	{
	    		console.log(err);
		      	DbService.setGlobalMessage("Failed to connect : "+err.message);
		      	res.redirect('/mysql');
		      	return true;	
	    	}
	    	else
	    	{
	    		DbService.fetchTables(dbConnection, selectedDatabase).then((tables) => 
    			{
    				DbService.setTables(selectedDatabase, tables);
	    			dbConnection.end();
			        res.render("mysql", {
			        		title:"MySql Admin",
			        		page:"mysql",
			        		databases:dbinstore,
			        		selectedDatabase:selectedDatabase,
			        		tables:tables
			        	});
    			});
	    	}
	    });
    }
  }
  else
  {
    dbConnection.connect((err) => {
    	if( err )
    	{
    		console.log(err);
	      	DbService.setGlobalMessage("Failed to connect : "+err.message);
	      	res.redirect('/mysql');
	      	return true;	
    	}
    	else
    	{
    		DbService.fetchDatabases(dbConnection).then(databases => {
    			DbService.setDatabases(databases);
    			DbService.fetchTables(dbConnection, selectedDatabase).then((tables) => 
    			{
    				DbService.setTables(selectedDatabase, tables);
	    			dbConnection.end();
			        res.render("mysql", {
			        		title:"MySql Admin",
			        		page:"mysql",
			        		databases:databases,
			        		selectedDatabase:selectedDatabase,
			        		tables:tables
			        	});
    			});
    		});
    	}
    });
  }
});

MySqlController.get("/table", async (req, res) => 
{
  let DbService = MysqlService.getInstance(); 
  let dbinstore = DbService.getDatabases();
  let dbConfig = DbService.getClient();
  let database = req.query.database;
  let table = req.query.table;
  let ajax = ( req.query.ajax ) ? 1 : 0;
  let skip = 0;
  if( typeof req.query.skip != 'undefined' )
  {
    skip = parseInt(req.query.skip);
  }
  let selectedDatabase = database;
  dbConfig.database = selectedDatabase;
  let dbConnection = DbService.connect(dbConfig);
  if( dbinstore.length )
  {
    let tables = DbService.getTables(selectedDatabase);
    if( tables.length )
    {
    	let sql = "SELECT * FROM "+table+" LIMIT "+skip+", 10";
        DbService.db_query(dbConnection, sql).then(tableData => {
        		if( ajax ){
                res.json({
                  table:table,
                  tableData:tableData 
                });
              } else {
            	res.render("mysql", {
            	  title:"MySql Admin",
	        	    page:"mysql",
                databases:dbinstore, 
                selectedDatabase:selectedDatabase, 
                tables:tables, 
                table:table,
                tableData: tableData 
              });
          	}
        }).catch(err => console.log(err));
    }
    else
    {
      	dbConnection.connect((err) => {
	    	if( err )
	    	{
	    		console.log(err);
	      	DbService.setGlobalMessage("Failed to connect : "+err.message);
	      	res.redirect('/mysql');
	      	return true;	
	    	}
	    	else
	    	{
	    		DbService.fetchTables(dbConnection, selectedDatabase).then((tables) => 
    			{
    				DbService.setTables(selectedDatabase, tables);
	    			let sql = "SELECT * FROM "+table+" LIMIT "+skip+", 10";
			        DbService.db_query(dbConnection, sql).then(tableData => {
			        	if( ajax ){
	                res.json({
	                  table:table,
	                  tableData:tableData 
	                });
	              } else {
			            res.render("mysql", {
			            		title:"MySql Admin",
				        			page:"mysql",
			                databases:dbinstore, 
			                selectedDatabase:selectedDatabase, 
			                tables:tables, 
			                table:table,
			                tableData: tableData 
			              });
			          }
			        }).catch(err => console.log(err));

    			});
	    	}
	    });
    }
  }
  else
  {
    dbConnection.connect((err) => {
    	if( err )
    	{
    		console.log(err);
	      	DbService.setGlobalMessage("Failed to connect : "+err.message);
	      	res.redirect('/mysql');
	      	return true;	
    	}
    	else
    	{
    		DbService.fetchDatabases(dbConnection).then(databases => {
    			DbService.setDatabases(databases);
    			DbService.fetchTables(dbConnection, selectedDatabase).then((tables) => 
    			{
    				DbService.setTables(selectedDatabase, tables);
	    			let sql = "SELECT * FROM "+table+" LIMIT "+skip+", 10";
			        DbService.db_query(dbConnection, sql).then(tableData => {
			            res.render("mysql", {
			            	title:"MySql Admin",
				        	page:"mysql",
			                databases:databases, 
			                selectedDatabase:selectedDatabase, 
			                tables:tables, 
			                table:table,
			                tableData: tableData 
			              });
			        }).catch(err => console.log(err));
    			});
    		});
    	}
    });
  }
});

MySqlController.post("/table", async (req, res) => 
{
  let DbService = MysqlService.getInstance(); 
  let dbinstore = DbService.getDatabases();
  let dbConfig = DbService.getClient();
  let database = req.query.database;
  let table = req.query.table;
  let ajax = ( req.query.ajax ) ? 1 : 0;
  let skip = 0;
  if( typeof req.body.skip != 'undefined' )
  {
    skip = parseInt(req.body.skip);
  }
  let query = "";
  if( typeof req.body.query != 'undefined' )
  {
    query = req.body.query;
  }
  console.log(query);
  let selectedDatabase = database;
  dbConfig.database = selectedDatabase;
  let dbConnection = DbService.connect(dbConfig);
  if( dbinstore.length )
  {
    let tables = DbService.getTables(selectedDatabase);
    if( tables.length )
    {
      DbService.db_query(dbConnection, query).then(tableData => {
      		if( ajax ){
              res.json({
                table:table,
                tableData:tableData 
              });
            } else {
          	res.render("mysql", {
          	  title:"MySql Admin",
        	    page:"mysql",
              databases:dbinstore, 
              selectedDatabase:selectedDatabase, 
              tables:tables, 
              table:table,
              tableData: tableData 
            });
        	}
      }).catch(err => {
      	console.log('error',err);
      	if( ajax ){
          res.json({
            table:table,
            tableData:[],
            error:err.message, 
          });
        } 
      });
    }
    else
    {
      	dbConnection.connect((err) => {
	    	if( err ) {
	    		console.log(err);
	      	DbService.setGlobalMessage("Failed to connect : "+err.message);
	      	res.redirect('/mysql');
	      	return true;	
	    	}
	    	else
	    	{
	    		DbService.fetchTables(dbConnection, selectedDatabase).then((tables) => 
    			{
    				DbService.setTables(selectedDatabase, tables);
		        DbService.db_query(dbConnection, query).then(tableData => {
		        	if( ajax ){
                res.json({
                  table:table,
                  tableData:tableData 
                });
              } else {
		            res.render("mysql", {
		            		title:"MySql Admin",
			        			page:"mysql",
		                databases:dbinstore, 
		                selectedDatabase:selectedDatabase, 
		                tables:tables, 
		                table:table,
		                tableData: tableData 
		              });
		          }
		        }).catch(err => {
		        	console.log('e=', err);
		        	if( ajax ){
			          res.json({
			            table:table,
			            tableData:[],
			            error:err.message, 
			          });
			        }
		      	});
    			});
	    	}
	    });
    }
  }
  else
  {
    dbConnection.connect((err) => {
    	if( err )
    	{
    		console.log(err);
      	DbService.setGlobalMessage("Failed to connect : "+err.message);
      	res.redirect('/mysql');
      	return true;	
    	}
    	else
    	{
    		DbService.fetchDatabases(dbConnection).then(databases => {
    			DbService.setDatabases(databases);
    			DbService.fetchTables(dbConnection, selectedDatabase).then((tables) => 
    			{
    				DbService.setTables(selectedDatabase, tables);
		        DbService.db_query(dbConnection, query).then(tableData => {
		            res.render("mysql", {
		            	title:"MySql Admin",
			        	page:"mysql",
		                databases:databases, 
		                selectedDatabase:selectedDatabase, 
		                tables:tables, 
		                table:table,
		                tableData: tableData 
		              });
		        }).catch(err => {
		        	console.log(err);
		        	if( ajax ){
			          res.json({
			            table:table,
			            tableData:[],
			            error:err.message, 
			          });
			        }
    			});
    			});
    		});
    	}
  	});
	}
});

module.exports = { MySqlController };