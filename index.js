let express  = require('express');
let app      = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let axios = require('axios');
let  _ = require('lodash');
let fs = require('fs');
var questions = [];
var packetId;

app.use('/', express.static(__dirname+'/'))
io.on('connection', (socket) => {
  
  socket.on('disconnect', function(){
    io.emit('quiz-ended', {quizId: socket.quizId, event: 'end'});   
  });
 
  
  socket.on('start-quiz', (message) => {
    console.log(message)
    //get 10 questions include joel question
    axios.get('https://dev.sunbirded.org/api/content/v1/read/do_112682538715676672114', {
      params: {
        fields: "questions"
      }
    })
    .then(function (response) {
      questions = _.get(response, 'data.result.content.questions')
      joel = _.find(questions, {"identifier": "do_112682561142702080162"});
      questions = _.shuffle(questions);
      questions = _.takeRight(questions,9);
      questions.push(joel);
      questions = _.shuffle(questions);
      
    })
    .catch(function (error) {
      console.log('Error while getting questions', error);
    });
  
    //store in a var
    // io.emit('message', {text: message.text, from: socket.nickname, created: new Date()});    
   });
   
   
   socket.on('next-question', (message) => {
     console.log(questions)
      socket.emit('question', {data: questions[message.index], next: true}) 
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