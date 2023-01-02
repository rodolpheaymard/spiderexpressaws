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

router.get("/allobjects", (req,res)=>{
  let result = mymodel.getAllObjects();
  res.json(result);
});

router.get("/all/:objecttype", (req,res)=>{
  let result = mymodel.getObjects(req.params.objecttype);
  res.json(result);
});

router.get("/all/:objecttype1/:objecttype2", (req,res)=>{
  let result1 = mymodel.getObjects(req.params.objecttype1);
  let result2 = mymodel.getObjects(req.params.objecttype2);

  res.json({ list1 : result1, list2 : result2});
});

router.get("/all/:objecttype1/:objecttype2/:objecttype3", (req,res)=>{
  let result1 = mymodel.getObjects(req.params.objecttype1);
  let result2 = mymodel.getObjects(req.params.objecttype2);
  let result3 = mymodel.getObjects(req.params.objecttype3);

  res.json({ list1 : result1, list2 : result2, list3 : result3});
});

router.get("/all/:objecttype1/:objecttype2/:objecttype3/:objecttype4", (req,res)=>{
  let result1 = mymodel.getObjects(req.params.objecttype1);
  let result2 = mymodel.getObjects(req.params.objecttype2);
  let result3 = mymodel.getObjects(req.params.objecttype3);
  let result4 = mymodel.getObjects(req.params.objecttype4);

  res.json({ list1 : result1, list2 : result2, list3 : result3, list4 : result4});
});

router.post('/add/:objecttype', (req, res) => {
  let newobj = req.body;
  mymodel.addObject(newobj, req.params.objecttype);
  res.json(newobj);
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