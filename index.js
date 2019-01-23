let express = require("express");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
let axios = require("axios");
let _ = require("lodash");
let fs = require("fs");
var bodyParser = require("body-parser");

var questions;
var responses = [];
var packetId;
var currentQuestion;

app.use(bodyParser.json());

app.use("/", express.static(__dirname + "/"));

io.on("connection", socket => {});

io.on("disconnect", function() {
  io.emit("quiz-ended", { quizId: socket.quizId, event: "end" });
});

app.get("/startQuiz", (req, res) => {
  responses = [];
  questions = JSON.parse(fs.readFileSync("questions.json", "utf-8"));
  joel = _.find(questions, { identifier: "do_112682561142702080162" });
  questions = _.shuffle(questions);
  questions = _.takeRight(questions, 9);
  questions.unshift(joel);
  questions = _.shuffle(questions);
  io.emit("startQuiz", {});
  res.end();
});

app.get("/nextQuestion/:id", (req, res) => {
  var id = parseInt(req.params.id, 10);
  currentQuestion = questions[id];
  io.emit("question", { data: currentQuestion });
  res.end();
});

app.get("/endQuiz", (req, res) => {
  var users = _.map(responses, "user");
  users = _.uniqWith(users, _.isEqual);
  console.log("users ", users);
  var results = [];

  _.forEach(users, function(user) {
    var userResult = user;
    userResult.time = 0;
    userResult.score = 0;
    _.forEach(responses, function(response) {
      if (user.code === response.user.code) {
        userResult.time = userResult.time + response.option.time;
        if (response.option.isCorrect) {
          userResult.score++;
        }
      }
    });
    userResult.score = (userResult.score / 10) * 100;
    results.push(userResult);
  });
  results = _.orderBy(results, ["score", "time"], ["desc", "asc"]);
  // users = _.uniqBy(users, "code");
  // var results = [];
  // _.forEach(users, function(user) {
  //   var data = user;
  //   var userQuiz = userGroup[data.code];
  //   data.score = 0;
  //   if (userQuiz && userQuiz.length) {
  //     data.score = (userQuiz.length / 10) * 100;
  //   }
  //   data.time = 0;
  //   _.forEach(userQuiz, function(q) {
  //     data.time = data.time + q.option.time;
  //   });
  //   results.push(data);
  // });

  io.emit("endQuiz", { results: results });
  res.end();
});

app.post("/userResponse", (req, res) => {
  responses.push(req.body);
  res.end();
});

// set and get packet

app.post("/packet/:id", function(req, res) {
  packetId = req.params.id;
  res.status(200).send({ status: true });
});

app.get("/packet", function(req, res) {
  res.status(200).send({ id: packetId });
});

app.delete("/packet", function(req, res) {
  packetId = undefined;
  res.status(200).send({ deleted: true });
});

var port = process.env.PORT || 3000;

http.listen(port, function() {
  console.log("listening in http://localhost:" + port);
});
