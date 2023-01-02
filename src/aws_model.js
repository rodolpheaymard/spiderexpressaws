const AWS = require("aws-sdk");
const dotenv = require('dotenv');

class AwsModel 
{
  constructor() 
  {
    this.init_dotenv();

    this.datamodel = { objects : [] , loaded : false, lastmodif : null};
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
    this.awsConfig = {
      "region" :"us-east-2",
       "endpoint"  : "http://dynamodb.us-east-2.amazonaws.com",
    };
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

        this.datamodel.objects.push(fullobj);
        console.log( " obj :   " + JSON.stringify(fullobj));
      } );

      this.datamodel.loaded = true;   
    },
    error => {
     console.log("receiving error " + error );
    })
    .catch(console.error)


  //  docClient.scan({
  //  TableName: "my-table",
  //  FilterExpression:
  //    "attribute_not_exists(deletedAt) AND contains(firstName, :firstName)",
   // ExpressionAttributeValues: {
   //   ":firstName": "John",
   // },
  //})
  //.promise()
  //.then(data => console.log(data.Items))
  //.catch(console.error)
  
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

  save_object(obj, mode)
  {
    try {    
      this.datamodel.lastmodif = new Date();
      let docClient = new AWS.DynamoDB.DocumentClient();     

      let timestamp = this.get_timestamp();
      switch(mode) {
        case "create" : 
          docClient.put({   Item: { spider_id: obj.id,
                                     spider_type: obj.type,
                                     spider_deleted: obj.deleted,
                                     spider_created_date: timestamp,
                                     spider_modified_date: timestamp,
                                     spider_deleted_date: "",
                                     spider_content: this.extract_content(obj),
                                    },
                                    TableName: this.awsdatatablename,
                            })
                            .promise()
                            .then(data => console.log(data.Attributes))
                            .catch(console.error);                            
        break;
        case "update" : 
        break;
        case "delete" : 
        break;
      }


    } catch (error) {
      console.log('An error has occurred while saving', error);
    }  
  }

  ping()
  {
     let result = "spider express server is available for " + this.getObjects("user").length + " users.";
     return result;
  }

  login(username, password)
  {
    let user = null;
    let result = false;
    let message = "login not found"; 
    this.datamodel.objects.forEach(element => {
      if (element.type === "user" && element.deleted === false)
      {
        if (element.username === username )
        {
          if (element.password === password)
          {
            result =  true;
            message = "";
            user = {username : element.username, isadmin : element.isadmin } ;
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

  addObject(obj , objtype)
  {
    if (obj.id === null || obj.id  === undefined || obj.id === "")
    {
      obj.id = objtype + "-" + this.datamodel.objects.length;
    }
    obj.type = objtype;
    obj.deleted = false;
    this.datamodel.objects.push(obj);
    this.save_object(obj,"create");

    return obj;
  }

  getObjects(objtype)
  {
    let result = [];
    if (objtype === null || objtype  === undefined)
    {
      return result;
    }

    this.datamodel.objects.forEach(element => {
      if (element.type === objtype 
          && element.deleted === false)
      {
        if (element.type === "user")
        {
          // special case for users :  we do not give password ...
          result.push({ "id" : element.id , 
                        "type" : element.type, 
                        "deleted" : element.deleted,
                        "username" : element.username , 
                        "isadmin" : element.isadmin });    
        }
        else
        {
          result.push(element);    
        }
      }
    });

    return result;
  }

  getAllObjects()
  {
    let result = [];

    this.datamodel.objects.forEach(element => {    
      if (element.type === "user")
      {
        // special case for users :  we do not give password ...
        result.push({ "id" : element.id , "type" : element.type, "deleted" : element.deleted,
                      "username" : element.username , "isadmin" : element.isadmin });    
      }
      else
      {
        result.push(element);
      }
    
    });
    return result;
  }

  getFullDatabase()
  { 
    return this.datamodel;
  }

  removeObject(id)
  {
    this.datamodel.objects.forEach(element => {
      if (element.id === id )
      {
        if ( element.deleted !== true)
        {
          element.deleted = true;      

          this.save_object(element,"delete");
        }
      }
    });
  }


}

module.exports = AwsModel;


