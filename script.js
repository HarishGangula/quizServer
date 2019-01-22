


angular.module('quizApp', ['ngSanitize'])
  .controller('quizAppController', function($interval, $timeout, $scope) {
    var quizController = this;
    var totalQuestions = 10;
    var questionTime  = 5;
    quizController.currentIndex = 0;
    const socket = io();
    quizController.startQuizFlag = true;
    quizController.startQuizTimer = false;
    quizController.showQuestion = false;
    quizController.showDashboard = false;

    quizController.timer = 10;
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
        quizController.startQuizTimer = false;
        quizController.showDashboard = false;
        socket.emit('start-quiz', {name: 'harish'});
        quizController.currentIndex = 0
        quizController.loadQuestion()
    }

    socket.on('question', function(data){
        quizController.showQuestion = true;
        var question = _.get(JSON.parse(_.get(data, 'data.body')), 'data.data.question');
        console.log(question)
        $scope.questionTitle = question.text;
        if(question.image){
            $scope.image = 'https://dev.ekstep.in'+ question.image;
        } else {
            $scope.image = '';
        }
        $scope.$apply();
        quizController.startQuestionTimer()
    })

    quizController.loadQuestion = function(){
            if(quizController.currentIndex <= totalQuestions-1){
                socket.emit('next-question', {index: quizController.currentIndex});   
            } else {
                quizController.showQuestion = false;
                quizController.showDashboard = true;
            }
    }

    quizController.startQuestionTimer = function(){
        quizController.quizQuestionTime = questionTime;
        var timerInterval = $interval(function(){
            quizController.quizQuestionTime = quizController.quizQuestionTime - 1;
            if(quizController.quizQuestionTime === 0) {
                $interval.cancel(timerInterval);  timerInterval = undefined;
                quizController.currentIndex = quizController.currentIndex+1;
                quizController.loadQuestion()
            }
        },1000)
    }

  });