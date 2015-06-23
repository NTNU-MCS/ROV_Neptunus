/* GET home page. */
exports.index = function(req, res){
  res.json({ title: 'Express' });
};

// legg client generated file i server folder
// var staticContentPath = client path folder (dist) 
// app.use(express.static(staticContentPath));