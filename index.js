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
var periodId;
var classContext = {};
var currentQuestion;
var topicData = {};

app.use(bodyParser.json());

app.use("/", express.static(__dirname + "/"));

//
//  Multiplayer Quiz - Start
//

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

const request = require("request-promise");
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

//
//  Multiplayer Quiz - End
//

//
//  Classroom APIs - Start
//

app.post("/packet/:id/:periodId", function(req, res) {
    packetId = req.params.id;
    classContext.periodId = req.params.periodId;
    var periodData = periodMap[classContext.periodId];
    classContext.grade = periodData.grade;
    classContext.subject = periodData.subject;
    classStudents = _.shuffle(JSON.parse(JSON.stringify(periodData.students)));
    console.log('context', classContext);
    res.status(200).send({ status: true });
});


var periodMap = {
    "PTCH1_2": {
        "grade": "Class 3",
        "subject": "EVS",
        "students": [
            {"studentId": "STU1", "studentName": "Nandu"}, 
            {"studentId": "STU2", "studentName": "Vedanth"},
            {"studentId": "STU3", "studentName": "Aashna"},
            {"studentId": "STU4", "studentName": "Akira"},
            {"studentId": "STU5", "studentName": "Vandhana"}
        ]
    },
    "PTCH2_2": {
        "grade": "Class 4",
        "subject": "Geography",
        "students": [
            {"studentId": "STU6", "studentName": "Anu"}, 
            {"studentId": "STU7", "studentName": "Deepa"},
            {"studentId": "STU8", "studentName": "Deepak"},
            {"studentId": "STU9", "studentName": "Manoj"},
            {"studentId": "STU10", "studentName": "Hari"}
        ]
    },
    "PTCH3_2": {
        "grade": "Class 4",
        "subject": "EVS",
        "students": [
            {"studentId": "STU6", "studentName": "Anu"}, 
            {"studentId": "STU7", "studentName": "Deepa"},
            {"studentId": "STU8", "studentName": "Deepak"},
            {"studentId": "STU9", "studentName": "Manoj"},
            {"studentId": "STU10", "studentName": "Hari"}
        ]
    },
    "PTCH4_2": {
        "grade": "Class 5",
        "subject": "Geography",
        "students": [
            {"studentId": "STU11", "studentName": "Pritha"},
            {"studentId": "STU12", "studentName": "Bindu"},
            {"studentId": "STU13", "studentName": "Neel"},
            {"studentId": "STU14", "studentName": "Harsha"},
            {"studentId": "STU15", "studentName": "Harshita"}
        ]
    },
    "PTCH5_2": {
        "grade": "Class 8",
        "subject": "Science",
        "students": [
            {"studentId": "STU16", "studentName": "Rajesh"},
            {"studentId": "STU17", "studentName": "Mohana"},
            {"studentId": "STU18", "studentName": "Ramya"},
            {"studentId": "STU19", "studentName": "Banu"},
            {"studentId": "STU20", "studentName": "Boominathan"}
        ]
    }
}

var classContext = {
    "stallId": "STA2",
    "stallName": "Classroom",
    "ideaId": "IDE6",
    "ideaName": "APPU Classroom",
    "school": "QSBB higher secondary school",
    "district": "Bangalore"
};
var classContexts = {};

var classStudents = [];

app.post("/classroom/start/:id", function(req, res) {

    var context = JSON.parse(JSON.stringify(classContext));
    context.visitorId = req.body.visitorId;
    context.visitorName = req.body.visitorName;
    var student = classStudents.pop();
    context.studentId = student.studentId;
    context.studentName = student.studentName;

    classContexts[req.params.id] = context;
    console.log('class start context', context);
    postTelemetryEvent({
        "eid": "DC_ATTENDANCE",
        "ets": new Date().getTime(),
        "did": "device_001",
        "dimensions": context,
        "edata": {
            "value": 100
        }
    }, function(error, response, body) {
        if (error) console.log(error);
        console.log(body);
        res.status(200).send({ id: packetId });
    })
});

app.delete("/packet", function(req, res) {
    packetId = undefined;
    res.status(200).send({ deleted: true });
});

app.post("/classroom/telemetry/:id", function(req, res) {

    context = classContexts[req.params.id];
    console.log('class telemetry context', context);
    var events = req.body.events;
    var interactions = []
    events.forEach(function(event) {
        var topic = _.find(event.context.cdata, _.matchesProperty('type', 'topic'));
        if(topic) {
            var topicId = topic[0].id;
            if(!topicData[topicId]) topicData[topicId] = {eventsCount: 0, score: 0, maxscore: 0};
            topicData[topicId].eventsCount = topicData[topicId].eventsCount + 1;
            if(event.eid === 'ASSESS') {
                topicData[topicId].score = topicData[topicId].score + event.edata.score;
                topicData[topicId].maxscore = topicData[topicId].score + event.edata.maxscore;
            }    
        }
        
        interactions.push({
            "eid": "DC_INTERACT",
            "ets": event.ets,
            "did": event.context.did,
            "dimensions": _.assign(context, {topics: [topicId]}),
            "edata": {}
        })
    });
    postTelemetryEvents(events, function(error, response, body) {
        if (error) console.log(error);
        console.log(body);
        res.status(200).send({});
    });
});

app.get("/classroom/end/:id", function(req, res) {

    context = classContexts[req.params.id];
    console.log('class end context', context);
    var events = [];
    _.keysIn(topicData).forEach(function(key) {
        var data = topicData[key];
        events.push({
            "eid": "DC_ENGAGEMENT",
            "ets": new Date().getTime(),
            "did": "device_001",
            "dimensions": _.assign(context, {topics: [key]}),
            "edata": {
                "value": data.eventsCount > 100 ? 100 : data.eventsCount
            }
        });
        events.push({
            "eid": "DC_PERFORMANCE",
            "ets": new Date().getTime(),
            "did": "device_001",
            "dimensions": _.assign(context, {topics: [key]}),
            "edata": {
                "value": _.ceil((data.score * 100)/ data.maxscore)
            }
        });
    });
    postTelemetryEvents(events, function(error, response, body) {
        if (error) console.log(error);
        console.log(body);
        res.status(200).send({});
    })
});

app.use("/get/:id", async (req, res) => {
    const options = {
        method: "GET",
        url: `https://dev.sunbirded.org/api/content/v1/read/${req.params.id}?fields=questions`,
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

//
//  Classroom APIs - End
//

function postTelemetryEvent(event, cb) {
    postTelemetryEvents([event], cb);
}

function postTelemetryEvents(events, cb) {
    var options = {
        method: "POST",
        url: "http://52.172.188.118:3000/v1/telemetry",
        headers: {
            "Postman-Token": "8201b334-e622-4920-b760-6c4ab83ad26d",
            "cache-control": "no-cache",
            "Content-Type": "application/json"
        },
        body: { events: events },
        json: true
    };

    request1(options, cb);
}

app.post("/telemetry", function(req, res) {

    postTelemetryEvents(req.body, function(error, response, body) {
        if (error) console.log(error);
        console.log(body);
        res.status(200).send(body);
    });
});

var port = process.env.PORT || 3000;

http.listen(port, function() {
    console.log("listening in http://localhost:" + port);
});