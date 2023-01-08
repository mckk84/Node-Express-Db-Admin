const dbClient = require('mongodb').MongoClient;
//const URI = "mongodb+srv://charan:MNIAtrQJAe8W5eIQ@cluster0.07bxow4.mongodb.net/?retryWrites=true&w=majority";
//const URI = "mongodb+srv://mjaved98:javed9838@cluster0.xwu1ihr.mongodb.net/farfetch?retryWrites=true&w=majority";

let instance = null;

class DbService 
{
  static getDbInstance()
  {
    return instance ? instance : new DbService();
  }

  getClient()
  {
    return dbClient;
  }

  getUrl()
  {
    return URI;
  }

  async getDatabases() 
  {
    try {
        await dbClient.connect();
        let databases = await dbClient.db().admin().listDatabases();
        //console.log(databases);
        dbClient.close();
        if( typeof databases.databases == 'undefined' )
        {
            return [];
        }
        return databases.databases;
    } catch (e) {
        return [];
        console.error(e);
    } finally {
        // Close the connection to the MongoDB cluster
        dbClient.close();
    }
    return [];
  }

  async getCollections(db) 
  {
    console.log('database:', db);
    try {
        await dbClient.connect();
        let collections = await dbClient.db(db).listCollections().toArray();
        //console.log('collections:', collections);
        dbClient.close();
        if( typeof collections == 'undefined' )
        {
            return [];
        }
        return collections;
    } catch (e) {
        return [];
        console.error(e);
    }
    return [];
  }

  async getModelData(db, model)
  {
    try {
        dbClient.connect(URI).then((dbConnect) => {
            var dbo = dbConnect.db(db);
            dbo.collection(model).find({}).toArray()
            .then((result) => {
                dbConnect.close();
                console.log(result.forEach((obj) => console.log(obj._id)));
                return result;
            });
        });
    }
    catch(e)
    {
        console.error(e);
        return [];
    }
  }

  async getModelData1(db, model) 
  {
    console.log(db, model);
    try {
        await dbClient.connect();
        let data = await dbClient.db(db).collection(model).findOne({}).toArray((error, data) => {
            console.log(data.forEach((obj) => console.log(obj._id)));
            dbClient.close();
            return data;    
        });
        return data;
        /*let data = await dbClient.db(db).collection(model).find({_i:10006546}).toArray(function(err, results){
            console.log('data:', results);
            if( typeof results == 'undefined' )
            {
                return [];
            }
            return results;        
        });
        return data;*/        
    } catch (e) {
        return [];
        console.error(e);
    } finally {
        // Close the connection to the MongoDB cluster
        dbClient.close();
    }
    return [];
  }

}
  
module.exports = DbService;