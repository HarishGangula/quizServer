let express = require("express");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
let _ = require("lodash");
let fs = require("fs");
var bodyParser = require("body-parser");
var request = require("request");
const requestPromise = require("request-promise"); //  'request' npm package with Promise support
const path = require("path");

var questions;
var responses = [];
var results = [];
var packetId;
var periodId;
var currentQuestion;

app.use(bodyParser.json());

app.use("/", express.static(__dirname + "/"));

io.on("connection", socket => { });

io.on("disconnect", function () {
  io.emit("quiz-ended", { quizId: socket.quizId, event: "end" });
});

app.get("/startQuiz", (req, res) => {
  responses = [];
  questions = JSON.parse(fs.readFileSync("questions.json", "utf-8"));
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
  _.forEach(users, function (user) {
    var userResult = user;
    userResult.time = 0;
    userResult.score = 0;
    _.forEach(responses, function (response) {
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

app.post("/packet/:id/:periodId", function (req, res) {
  packetId = req.params.id;
  periodId = req.params.periodId;
  res.status(200).send({ status: true });
});

app.get("/packet/:studentId", function (req, res) {
  // Generate attendance event
  res.status(200).send({ id: packetId });
});

app.delete("/packet", function (req, res) {
  packetId = undefined;
  res.status(200).send({ deleted: true });
});


app.post("/telemetry", function (req, res) {
  var options = {
    method: "POST",
    url: "http://52.172.188.118:3000/v1/telemetry",
    headers: {
      "cache-control": "no-cache",
      "Postman-Token":
        "d3005745-61cb-46e7-b254-94af6e266a12,ef05bf97-e656-409c-889b-71753ba02799",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI2NTU0NDQ5ZWI0MGQ0YTI4ODQ3YzAzYWZlNmJjMmEyOCJ9.YhnTaDw_xvf8Q5S66QiO71-5WeqLaTPv-vvNZSwBqLk"
    },
    body: req.body,
    json: true
  };
  console.log(JSON.stringify(options));
  request(options, function (error, response, body) {
    if (error) console.log("telemetry error,", error);
    console.log("telemetry success, ", body);
    res.status(200).send(body);
  });
});


// get questions and store file


const getQuestions = async allQuestionIds => {
  const questions = allQuestionIds.map(async questionId => {
    const options = {
      method: "GET",
      url: `https://dev.ekstep.in/api/assessment/v3/items/read/${questionId}`,
      json: true
    };
    const response = await requestPromise(options);
    return response.result.assessment_item;
  });
  return await Promise.all(questions);
};

async function loadQuestions(contentId) {
  const options = {
    method: "GET",
    url: `https://dev.ekstep.in/api/content/v3/read/${contentId}?fields=questions`,
    json: true
  };
  let allQuestions;
  try {
    allQuestions = await requestPromise(options);
    const allQuestionIds = [];
    allQuestions.result.content.questions.forEach(question => {
      allQuestionIds.push(question.identifier);
    });
    questionMeta = await getQuestions(allQuestionIds);
    console.log(questionMeta);
    fs.writeFileSync(path.join(__dirname, './questions.json'), JSON.stringify(questionMeta), 'utf8')
  } catch (error) {
    console.log('Error while loading questions: ', error);
  }
}

loadQuestions('do_112682538715676672114')

var port = process.env.PORT || 3000;

http.listen(port, function () {
  console.log("listening in http://localhost:" + port);
});
