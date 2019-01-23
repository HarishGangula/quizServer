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
  // prepare data
  io.emit("endQuiz", { score: 5 });
});

app.post("/userResponse", (req, res) => {
  console.log(req.body);
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
