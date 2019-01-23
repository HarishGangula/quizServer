let express = require("express");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
let axios = require("axios");
let _ = require("lodash");
let fs = require("fs");
var bodyParser = require("body-parser");
var request1 = require("request");

var questions;
var responses = [];
var results = [];
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
  io.emit("endQuiz");
  var users = _.map(responses, "user");
  users = _.uniqWith(users, _.isEqual);
  results = [];
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
  var i = 1;
  results.map(r => {
    return (r.rank = i++);
  });
  io.emit("results", { results: results });
  console.log(results);
  res.status(200).send({ results: results });
});

app.post("/userResponse", (req, res) => {
  responses.push(req.body);
  res.end();
});

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

const request = require("request-promise"); //  'request' npm package with Promise support
const getQuestions = async allQuestionIds => {
  const questions = allQuestionIds.map(async questionId => {
    const options = {
      method: "GET",
      url: `https://dev.sunbirded.org/action/assessment/v3/items/read/${questionId}`,
      json: true
    };
    const response = await request(options);
    return response.result.assessment_item;
  });
  return await Promise.all(questions);
};
app.use("/get/:id", async (req, res) => {
  const options = {
    method: "GET",
    url: `https://dev.sunbirded.org/api/content/v1/read/${
      req.params.id
    }?fields=questions`,
    json: true
  };
  let allQuestions;
  try {
    allQuestions = await request(options);
    const allQuestionIds = [];
    allQuestions.result.content.questions.forEach(question => {
      allQuestionIds.push(question.identifier);
    });
    questionMeta = await getQuestions(allQuestionIds);
    res.json(questionMeta);
  } catch (error) {
    console.log(error);
    if (error.error) {
      res.status(404).json(error.error);
    } else {
      res.status(404).json("unhandled erro");
    }
  }
});

app.post("/telemetry", function(req, res) {
  console.log(res.body);
  var options = {
    method: "POST",
    url: "http://52.172.188.118:3000/v1/telemetry",
    headers: {
      "Postman-Token": "8201b334-e622-4920-b760-6c4ab83ad26d",
      "cache-control": "no-cache",
      "Content-Type": "application/json"
    },
    body: req.body,
    json: true
  };

  request1(options, function(error, response, body) {
    if (error) console.log(error);
    res.status(200).send(body);
    console.log(body);
  });
});

var port = process.env.PORT || 3000;

http.listen(port, function() {
  console.log("listening in http://localhost:" + port);
});
