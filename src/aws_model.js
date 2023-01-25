const AWS = require("aws-sdk");
const dotenv = require('dotenv');

class AwsModel 
{
  constructor() 
  {
    this.init_dotenv();

    this.datamodel = { objects : new Map(), loaded : false, lastmodif : null};
    this.awsdatatablename = "spider_data_" + process.env.MY_AWS_ENVIRONMENT;
    console.log( this.awsdatatablename );

    try {
       this.init_aws();
       this.load_all();
    } 
    catch (error) {
      console.log('An error has occurred while loading ', error);
    }
  }
  
  init_dotenv()
  {
    dotenv.config();
    const result = dotenv.config()

    if (result.error) {
      console.log( "dotenv error" );
    }
    else
    {
      console.log(result.parsed);
    }
  }
 
  init_aws()
  {        
    this.test_credentials();
    
    let defaultAWS = "us-east-2";
    if (process.env.MY_AWS_DEFAULT_REGION !== null && process.env.MY_AWS_DEFAULT_REGION !== undefined)
    {
      defaultAWS = process.env.MY_AWS_DEFAULT_REGION ;
    }

    this.awsConfig = {
      "region" :  defaultAWS,
      "endpoint"  : "http://dynamodb." + defaultAWS + ".amazonaws.com"
    };

    if (process.env.MY_AWS_ACCESS_KEY_ID !== null && process.env.MY_AWS_ACCESS_KEY_ID !== undefined
      && process.env.MY_AWS_SECRET_ACCESS_KEY !== null  && process.env.MY_AWS_SECRET_ACCESS_KEY  !== undefined)
      {
        this.awsConfig.credentials =  { accessKeyId : process.env.MY_AWS_ACCESS_KEY_ID  , 
                                        secretAccessKey : process.env.MY_AWS_SECRET_ACCESS_KEY };
      }

    AWS.config.update(this.awsConfig);
    console.log("aws init ok ");
  }

  test_credentials()
  {        
    console.log("testing aws credentials");
    AWS.config.getCredentials(function(err) {
      if (err) {
        console.log(err.stack);
        // credentials not loaded
      }
      else {
        console.log("Access key:", AWS.config.credentials.accessKeyId);
      }
    });
  }

  load_object(id)
  {
    let docClient = new AWS.DynamoDB.DocumentClient();
    
    var params = {
      TableName : this.awsdatatablename,
      Key : { spider_id : id }
    };
  
    console.log("aws loading data ");
    docClient.get(params, function (err,data) {
      if (err) {
        console.log("aws error : "+ JSON.stringify(err,null, 2));
      } else {
        console.log("aws success : "+ JSON.stringify(data,null, 2));    
      }
  
    });    
  }
  
  load_all()
  {
    let docClient = new AWS.DynamoDB.DocumentClient();
    
    console.log("loading table "+ this.awsdatatablename );

    docClient.scan({
      TableName: this.awsdatatablename,
    })
    .promise()
    .then(data => {

      console.log("receiving data ");

      data.Items.forEach( itm => {
        
        let obj = {id : itm.spider_id, type : itm.spider_type, deleted : itm.spider_deleted } ;
        let content = JSON.parse(itm.spider_content);
        let fullobj = { ...obj, ...content };

        this.datamodel.objects.set(fullobj.id, fullobj);
        // console.log( " obj :   " + JSON.stringify(fullobj));
      } );

      this.datamodel.loaded = true;   
      console.log( this.datamodel.objects.size + " objects in database ");
    },
    error => {
     console.log("receiving error " + error );
    })
    .catch(console.error)
  
  }



  extract_content(obj)  {
    let duplicatedobj = { ...obj};
    delete duplicatedobj.id;
    delete duplicatedobj.type;
    delete duplicatedobj.deleted;
    let result = JSON.stringify(duplicatedobj);
   
    return result;
  }

  get_timestamp()
  {
    let dt = new Date();
    return dt.toISOString();
  }

  ping()
  {
     let result = "spider express server is available for " + this.getObjects("user").length + " users. ";
     result += "databasename [" + this.awsdatatablename + "]";
     return result;
  }

  login(username, password)
  {
    let user = null;
    let result = false;
    let message = "login not found"; 
    this.datamodel.objects.forEach((element,id,map) => {
      if (element.type === "user" && element.deleted === false)
      {
        if (element.username === username )
        {
          if (element.password === password)
          {
            result =  true;
            message = "";
            user = { id : element.id , username : element.username, isadmin : element.isadmin } ;
            return;
          }
          else
          {
            result = false;
            message = "bad password";
            return;
          }
        }
      }
    });
    return { response : result , message : message, user: user };
  }

  secureObject(element)
  {
    if (element.type === "user")
    {
      // special case for users :  we do not give password ...
      return { "id" : element.id , 
              "type" : element.type, 
              "deleted" : element.deleted,
              "username" : element.username , 
              "isadmin" : element.isadmin };    
    }
    return element;    
  }

  getObjects(objtype)
  {
    let result = [];
    if (objtype === null || objtype  === undefined)
    {
      return result;
    }

    this.datamodel.objects.forEach((element,id,map)  => {
      if (element.type === objtype && element.deleted === false)
      {
        result.push(this.secureObject(element));
      }
    });

    return result;
  }

  getObjectsByTypes(objtypes)
  {
    let result = [];
    if (objtypes === null || objtypes  === undefined)
    {
      return result;
    }

    this.datamodel.objects.forEach((element,id,map)  => {
      if (element.deleted === false)
      {
        objtypes.forEach( t => {
          if ( element.type === t ) {
            result.push(this.secureObject(element));
          }  
        });
      }
    });

    return result;
  }

  filterObjects(objtype , objprop, objpropvalue)
  {
    let result = [];
    if (objtype === null || objtype  === undefined)
    {
      return result;
    }
    if (objprop === null || objprop  === undefined)
    {
      return result;
    }
    if (objpropvalue === null || objpropvalue  === undefined)
    {
      return result;
    }

    this.datamodel.objects.forEach((element,id,map)  => {
      if (element.type === objtype && element.deleted === false)
      {
        if (element[objprop] === objpropvalue )
        {
          result.push(this.secureObject(element));
        }
      }
    });

    return result;
  }

  getAllObjects()
  {
    let result = [];

    this.datamodel.objects.forEach((element,id,map)  => {    
      result.push(this.secureObject(element));    
    });
    return result;
  }

  getFullDatabase()
  { 
    return this.datamodel;
  }

  
  addObject(obj , objtype)
  {
    if (obj.id === null || obj.id  === undefined || obj.id === "")
    {
      obj.id = objtype + "-" + this.datamodel.objects.size;
    }
    obj.type = objtype;
    obj.deleted = false;
    this.datamodel.objects.set(obj.id,obj);
    this.save_object_to_aws(obj,"create");

    return obj;
  }

  
  saveObject(obj , objtype)
  {
    if (this.datamodel.objects.has(obj.id))
    {
      this.datamodel.objects.delete(obj.id);
    }
    this.datamodel.objects.set(obj.id,obj);
    
    this.save_object_to_aws(obj,"update");

    return obj;
  }

  removeObject(id)
  {
    let result = { deleted : false };
    if (this.datamodel.objects.has(id))
    {
      let element = this.datamodel.objects.get(id);
      if ( element.deleted !== true)
      {
        element.deleted = true;      
        result.deleted = this.save_object_to_aws(element,"delete");
      }
    }
    return  result ;
  }

  
  save_object_to_aws(obj, mode)
  {
    try {    
      this.datamodel.lastmodif = new Date();
      let docClient = new AWS.DynamoDB.DocumentClient();     

      let timestamp = this.get_timestamp();
      switch(mode) {
        case "create" : 
          docClient.put({   TableName: this.awsdatatablename,
                            Item: { spider_id: obj.id,
                                     spider_type: obj.type,
                                     spider_deleted: obj.deleted,
                                     spider_created_date: timestamp,
                                     spider_modified_date: timestamp,
                                     spider_deleted_date: "",
                                     spider_content: this.extract_content(obj),
                                    },
                                    
                            })
                            .promise()
                            .then(data => console.log( obj.id + " created"))
                            .catch(console.error);                            
        break;
        case "update" : 
        docClient.update({  TableName: this.awsdatatablename,
                            Key: {
                              spider_id: obj.id,
                            },
                            UpdateExpression: `set spider_modified_date = :dateModif,  spider_content = :newContent`,
                            ExpressionAttributeValues: {
                              ":newContent": this.extract_content(obj),
                              ":dateModif": timestamp,
                            }
                          })
                  .promise()
                  .then(data => console.log( obj.id + " modified"))
                  .catch(console.error);    
        break;
        case "delete" : 
          docClient.update({  TableName: this.awsdatatablename,
                              Key: {
                                spider_id: obj.id,
                              },
                              UpdateExpression: `set spider_deleted = :valTrue , spider_deleted_date = :dateDeleted `,
                              ExpressionAttributeValues: {
                                ":valTrue": true,
                                ":dateDeleted": timestamp,
                              }
                            })
          .promise()
          .then(data => console.log( obj.id + " deleted"))
          .catch(console.error);      
        break;
      }

    } catch (error) {
      console.log('An error has occurred while saving', error);
      return false;
    }  

    return true;
  }


}

module.exports = AwsModel;


