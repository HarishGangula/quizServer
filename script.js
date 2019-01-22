


angular.module('quizApp', [])
  .controller('quizAppController', function($interval, $http) {
    var quizController = this;
    var baseUrl = ""
    const socket = io();
    quizController.startQuizFlag = true;
    quizController.startQuizTimer = false;
    quizController.showQuestion = false;
    quizController.timer = 1;
    quizController.timerStyle = {'font-size': '200px', 'color': getRandomColor()};
    
    function getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
      
    

    quizController.start =  function() {
        quizController.startQuizFlag = false;
        quizController.startQuizTimer = true;
        var timerInterval = $interval(function(){
            quizController.timer--;
            var color = getRandomColor()
            quizController.timerStyle = {'font-size': '200px', 'color': color};
            
            if(quizController.timer === 0) {
                 $interval.cancel(timerInterval);  timerInterval = undefined;
                 quizController.timerStyle = {'font-size': '100px', 'color': color};
                 quizController.timer = "Loading Questions......"
                 quizController.startQuizCall()
            }
        },1000)
    }

    quizController.startQuizCall = function(){
        quizController.showQuestion = true;
        socket.emit('start-quiz', {name: 'harish'});
        var currentIndex = 0
        
        setTimeout(function(){
            socket.emit('next-question', {index: currentIndex});
            socket.on('question', function(data){
                console.log(data);
            })
        },1000)
        
    }
  });