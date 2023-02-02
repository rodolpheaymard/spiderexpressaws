const express = require("express");
const router = express.Router();

const AwsModel = require('./aws_model');
const mymodel = new AwsModel();


router.get("/", (req, res) => {
  let result = mymodel.ping();
  res.json(result);
});

router.get("/login/:username/:password", (req,res)=>{
  let result = mymodel.login(req.params.username, req.params.password);
  res.json(result);
});

router.get("/newlogin/:username/:password", (req,res)=>{
  let result = mymodel.newlogin(req.params.username, req.params.password);
  res.json(result);
});

router.get("/allobjects", (req,res)=>{
  let result = mymodel.getAllObjects();
  res.json(result);
});

router.get("/all/:objecttype", (req,res)=>{
  let result = mymodel.getObjects(req.params.objecttype);
  res.json(result);
});

router.post("/all", (req,res)=>{
  let filter = req.body;
  var result = {objects : []};

  let objs = mymodel.getObjectsByTypes(filter.types);
  objs.forEach( o => { result.objects.push(o);})
  
  console.log( " found " + objs.length + " objects of types " + filter.types)
  res.json(result);
});

router.post("/filter", (req,res)=>{
  let filter = req.body;
  var result = {objects : []};
  filter.types.forEach(t => {
      let objs = mymodel.filterObjects(t, filter.filterprop , filter.filterval);
      objs.forEach( o => { result.objects.push(o);})
    }); 

  res.json(result);
});




router.post('/add', (req, res) => {
  let newobj = req.body;
  mymodel.addObject(newobj);
  res.json(newobj);
});

router.post('/save', (req, res) => {
  let objtosave = req.body;
  mymodel.saveObject(objtosave);
  res.json(objtosave);
});
  
router.post('/remove/:objectid', (req, res) => {
  let response = mymodel.removeObject(req.params.objectid);
  res.json(response);
});        
  
router.use((req, res) => {
            res.status(404);
            res.json({
                error: "API not found"
            });
        });
     
 module.exports = router;