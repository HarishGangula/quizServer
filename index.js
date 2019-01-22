let express  = require('express');
let app      = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let axios = require('axios');
let  _ = require('lodash');
let fs = require('fs');
var  questions;
var responses;
var packetId;

app.use('/', express.static(__dirname+'/'))
io.on('connection', (socket) => {
  
  socket.on('disconnect', function(){
    io.emit('quiz-ended', {quizId: socket.quizId, event: 'end'});   
  });
 
  
  socket.on('start-quiz', (message) => {
      responses = [];
      questions = JSON.parse(fs.readFileSync('questions.json', 'utf-8'));
      joel = _.find(questions, {"identifier": "do_112682561142702080162"});
      questions = _.shuffle(questions);
      questions = _.takeRight(questions,9);
      questions.unshift(joel);
      questions = _.shuffle(questions);
   });

   socket.on('response', function(data){
     console.log();
   })
   
   
   socket.on('next-question', (message) => {
      socket.emit('question', {data: questions[message.index]}) 
   })
});
 


// set and get packet

app.post('/packet/:id', function(req, res){
  packetId = req.params.id;
  res.status(200).send({status: true});
})

app.get('/packet', function(req, res){
  res.status(200).send({id: packetId});
})



var port = process.env.PORT || 3000;
 
http.listen(port, function(){
   console.log('listening in http://localhost:' + port);
});