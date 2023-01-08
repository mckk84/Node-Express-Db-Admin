const fs = require("fs");
const dbClient = require('mongodb').MongoClient;
let instance = null;
const logfile = __dirname+"/../data/temp.json";

class MongodbService
{
	static getInstance()
	{
		try{
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
		return instance ? instance : new MongodbService();
	}

	getClient()
  	{	
    	return dbClient;
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

	setDatabases(data)
	{
		let tempJsonString = this.getJson();
		if( tempJsonString !== false ){
			let tempJson = JSON.parse(tempJsonString);
			tempJson.databases = data;
			this.setJson(tempJson);
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

	setUrl(data)
	{
		let tempJsonString = this.getJson();
		if( tempJsonString !== false )
		{
			console.log('setUrl');
			let tempJson = {};
			try{
				tempJson = JSON.parse(tempJsonString);
			}catch(e){
				//
			}
			tempJson.connectionurl = data;
			this.setJson(tempJson);
		}	
		else
		{
			console.log('No-setUrl');
		}
	}

	getUrl()
	{
		let tempJsonString = this.getJson();
		if( tempJsonString !== false ){
			let tempJson = JSON.parse(tempJsonString);
			return tempJson.connectionurl;
		} else {
			return "";
		}
	}

	getDatabases()
	{
		let tempJsonString = this.getJson();
		if( tempJsonString !== false ){
			let tempJson = JSON.parse(tempJsonString);
			return tempJson.databases;
		} else {
			return "";
		}
	}

	setDbCollection(db, collection)
	{
		let tempJsonString = this.getJson();
		if( tempJsonString !== false ){
			let tempJson = JSON.parse(tempJsonString);
			tempJson[db] = collection;
			this.setJson(tempJson);
		}
	}

	getDbCollection(db)
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


}

module.exports = MongodbService;