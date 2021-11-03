var express = require('express');
const authenticate= require('../authenticate');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Police Backend' });
});
router.get('/tokenValidity',(authenticate.verifyUser),((req,res,next)=>{
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.json('Token is valid');
}));
module.exports = router;
