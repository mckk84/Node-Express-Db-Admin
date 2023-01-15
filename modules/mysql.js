const mysql = require("mysql");
const fs = require("fs");
const logfile = __dirname+"/../data/mysql.json";

let instance = null;

class MysqlService 
{
    static getInstance()
    {
        try {
            if( !fs.existsSync(logfile) ) 
            {
                fs.open(logfile, 'w+', function(err, fd){
                   if (err) {
                      console.log('Cannot create log file');
                      console.error(err);
                      return false;
                   }
                   fs.writeFileSync(logfile, "");      
                });// create log file
            }
        } 
        catch(e)
        {
            console.log(e);
        }
        return instance ? instance : new MysqlService();
    }

    getLogFile()
    {
        try{
            if( !fs.existsSync(logfile) ) 
            {
                return false;
            }
            else
            {
                return logfile;
            }
        } catch (err) {
            return false;
        }
    }

    clearCache()
    {
        let logfile = this.getLogFile();
        if( !logfile ) 
        {
            return false;
        }
        else
        {
            return fs.writeFileSync(logfile, '');
        }
    }

    getJson()
    {
        let logfile = this.getLogFile();
        if( !logfile ) 
        {
            return false;
        }
        else
        {
            return fs.readFileSync(logfile, 'utf8');
        }
    }

    setJson(data)
    {
        let logfile = this.getLogFile();
        if( !logfile ) 
        {
            return false;
        }
        else
        {
            return fs.writeFileSync(logfile, JSON.stringify(data));
        }
    }

    getClient()
    {
        let tempJsonString = this.getJson();
        if( tempJsonString )
        {
            if( tempJsonString !== false )
            {
                let tempJson = {};
                try{
                    tempJson = JSON.parse(tempJsonString);
                }
                catch(e)
                {
                    //
                }
                return tempJson.hasOwnProperty('dbconfig') ? tempJson.dbconfig : false;
            }
        }
        else
        {
            return false;
        }
    }

    setDbConfig(host, username, password, port)
    {
        let tempJsonString = this.getJson();
        if( tempJsonString !== false )
        {
            let tempJson = {};
            try{
                tempJson = JSON.parse(tempJsonString);
            }catch(e){
                //
            }
            tempJson.dbconfig = {};
            tempJson.dbconfig.host = host;
            tempJson.dbconfig.username = username;
            tempJson.dbconfig.password = password;
            tempJson.dbconfig.port = port;
            this.setJson(tempJson);
        }
    }

    createConnection(host, username, password, port)
    {
        let db_con  = mysql.createConnection({
            host: host,
            user: username,
            password: password,
            port: port
        });
        return db_con;
    }

    connect(dbConfig)
    {
        if( dbConfig.hasOwnProperty('database') )
        {
            let db_con  = mysql.createConnection({
                host: dbConfig.host,
                user: dbConfig.username,
                password: dbConfig.password,
                database:dbConfig.database,
                port: dbConfig.port
            });
            return db_con;
        }
        else
        {
            let db_con  = mysql.createConnection({
                host: dbConfig.host,
                user: dbConfig.username,
                password: dbConfig.password,
                port: dbConfig.port
            });
            return db_con;
        }
    }

    setGlobalMessage(data)
    {
        let tempJsonString = this.getJson();
        if( tempJsonString !== false )
        {
            let tempJson = {};
            try{
                tempJson = JSON.parse(tempJsonString);
            }catch(e){
                //
            }
            tempJson.global_message = data;
            this.setJson(tempJson);
        }
    }

    getGlobalMessage()
    {
        let tempJsonString = this.getJson();
        if( tempJsonString !== false )
        {
            let tempJson = {};
            try{
                tempJson = JSON.parse(tempJsonString);
            }catch(e){
                //
            }
            return tempJson.hasOwnProperty('global_message') ? tempJson.global_message : "";
        } else {
            return "";
        }
    }

    async connectToDatabase(db) {
        try {
            const response = await new Promise((resolve, reject) => {   
            db_con  = mysql.createConnection({
                host: process.env.HOST,
                user: process.env.USER,
                password: process.env.PASSWORD,
                database:db,
                port: process.env.DB_PORT
            });
              
            db_con.connect((err) => {
                if (err) {
                  console.log("Database Connection Failed !!!", err);
                  reject(new Error(err.message));
                } else {
                  console.log("Connected to Database");
                  resolve(db_con);    
                }
            });
        });
        
        return response;
    } 
    catch(err)
    {
        console.log(err);
    }
  }

    clearCache()
    {
        let logfile = this.getLogFile();
        if( !logfile ) 
        {
            return false;
        }
        else
        {
            return fs.writeFileSync(logfile, '');
        }
    }

    setDatabases(data)
    {
        let tempJsonString = this.getJson();
        if( tempJsonString !== false )
        {
            let tempJson = JSON.parse(tempJsonString);
            tempJson.databases = data;
            this.setJson(tempJson);
        }
    }

    getDatabases(data)
    {
        let tempJsonString = this.getJson();
        if( tempJsonString !== false )
        {
            let tempJson = JSON.parse(tempJsonString);
            return tempJson.databases;
        }
    }

    async fetchDatabases(db_con) {
        try {
            const response = await new Promise((resolve, reject) => {
                const query = "SHOW DATABASES";

                db_con.query(query, (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                })
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    async fetchTables(db_connection, db) {
        try {
            const response = await new Promise((resolve, reject) => {
                
                const query = "SHOW TABLES";
                db_connection.query(query, (err, results) => {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                })
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    setTables(db, tables)
    {
        let tempJsonString = this.getJson();
        if( tempJsonString !== false ){
            let tempJson = JSON.parse(tempJsonString);
            tempJson[db] = tables;
            this.setJson(tempJson);
        }
    }

    getTables(db)
    {
        let tempJsonString = this.getJson();
        if( tempJsonString !== false ){
            let tempJson = JSON.parse(tempJsonString);
            if( tempJson.hasOwnProperty(''+db+'') ) {
                return tempJson[db];
            }
        }
        return [];
    }

    async db_query(db_connection, sql) 
    {
        return await new Promise((resolve, reject) => {
            const query = sql;
            try {
                db_connection.query(query, (err, results) => 
                {
                    if (err) reject(new Error(err.message));
                    resolve(results);
                });
            }
            catch (error) 
            {
                if(error) reject(new Error(error.message));
            }
        });        
    }

}
  
module.exports = MysqlService;