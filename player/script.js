angular
  .module("quizApp", ["ngSanitize"])
  .controller("quizAppController", function ($interval, $timeout, $scope) {
    var quizController = this;
    var totalQuestions = 10;
    var questionTime = 2;
    $scope.results = [];
    quizController.currentIndex = 0;
    quizController.startQuizFlag = true;
    quizController.startQuizTimer = false;
    quizController.showQuestion = false;
    quizController.showDashboard = false;

    quizController.timer = 10;
    quizController.timerStyle = {
      "font-size": "200px",
      color: getRandomColor()
    };

    function getRandomColor() {
      var letters = "0123456789ABCDEF";
      var color = "#";
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    quizController.start = function () {
      quizController.startQuizFlag = false;
      quizController.startQuizTimer = true;
      var timerInterval = $interval(function () {
        quizController.timer--;
        var color = getRandomColor();
        quizController.timerStyle = { "font-size": "200px", color: color };

        if (quizController.timer === 0) {
          $interval.cancel(timerInterval);
          timerInterval = undefined;
          quizController.timerStyle = { "font-size": "100px", color: color };
          quizController.timer = "Loading Questions......";
          quizController.startQuizCall();
        }
      }, 1000);
    };

    quizController.startQuizCall = function () {
      $scope.results = [];
      quizController.startQuizTimer = false;
      quizController.showDashboard = false;
      var settings = {
        async: true,
        crossDomain: true,
        url: "/startQuiz",
        method: "GET",
        headers: {
          "cache-control": "no-cache",
          "Postman-Token": "db5c7de3-b651-4c92-9d3e-5483bf07af55"
        }
      };
      $.ajax(settings).done(function (response) {
        quizController.currentIndex = 0;
        quizController.loadQuestion(quizController.currentIndex);
      });
    };

    socket.on("question", function (data) {
      console.log(data);
      quizController.showQuestion = true;
      var question = _.get(
        JSON.parse(_.get(data, "data.body")),
        "data.data.question"
      );
      $scope.questionTitle = question.text;

      if (question.image) {
        $scope.image = "https://dev.ekstep.in" + question.image;
      } else {
        $scope.image = "";
      }
      $scope.$apply();
      quizController.startQuestionTimer();
    });

    quizController.loadQuestion = function () {
      if (quizController.currentIndex <= totalQuestions - 1) {
        var settings = {
          async: true,
          crossDomain: true,
          url: "/nextQuestion/" + quizController.currentIndex,
          method: "GET",
          headers: {
            "cache-control": "no-cache",
            "Postman-Token": "9c93e14f-7f79-4f5b-81fe-b4853b8b7000"
          }
        };

        $.ajax(settings).done(function (response) {
          console.log(response);
        });
      } else {
        var settings = {
          async: true,
          crossDomain: true,
          url: "/endQuiz",
          method: "GET",
          headers: {
            "cache-control": "no-cache",
            "Postman-Token": "db5c7de3-b651-4c92-9d3e-5483bf07af55"
          }
        };
        $.ajax(settings).done(function (response) {
          $scope.results = response.results;
          $scope.sendPerformance(response.results);
          $scope.$apply();
        });
        quizController.showQuestion = false;
        quizController.showDashboard = true;
      }
    };

    quizController.startQuestionTimer = function () {
      quizController.quizQuestionTime = questionTime;
      var timerInterval = $interval(function () {
        quizController.quizQuestionTime = quizController.quizQuestionTime - 1;
        if (quizController.quizQuestionTime === 0) {
          $interval.cancel(timerInterval);
          timerInterval = undefined;
          quizController.currentIndex = quizController.currentIndex + 1;
          quizController.loadQuestion();
        }
      }, 1000);
    };

    $scope.sendPerformance = function (results) {
      var events = [];
      _.forEach(results, function (r) {
        var event = {
          eid: "DC_PERFORMANCE",
          ets: new Date().getTime(),
          dimensions: {
            visitorId: r.code,
            stallId: "STA2",
            ideaId: "IDE7",
            visitorName: _.get(r, "name"),
            stallName: "Classroom",
            ideaName: "Multiplayer Quiz",
            school: _.get(r, "school"),
            district: _.get(r, "district")
          },
          edata: {
            type: "classroom",
            mode: "play",
            duration: r.time / 1000,
            value: r.score
          }
        };
        events.push(event);
      });
      var telemetryData = {
        events: events
      };
      $.ajax({
        async: true,
        crossDomain: true,
        method: "POST",
        url: "/telemetry",
        data: JSON.stringify(telemetryData),
        dataType: "json",
        contentType: "application/json"
      }).done(function (data) {
        console.log(data);
      });
    };
  });
