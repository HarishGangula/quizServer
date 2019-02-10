let express = require("express");
let app = express();
let http = require("http").Server(app);
let io = require("socket.io")(http);
let axios = require("axios");
let _ = require("lodash");
let fs = require("fs");
var path = require('path');
var bodyParser = require("body-parser");
var proxy = require('express-http-proxy');
var urlHelper = require('url')
var request1 = require("request");
var quizStatus = "NOT_STARTED";

app.use(bodyParser.json());
app.use("/", express.static(__dirname + "/"));

//
// Player proxy - Start
// 

app.use('/content-plugins', proxy('dev.sunbirded.org', {
    https: true,
    proxyReqPathResolver: function(req) {
        return '/content-plugins' + urlHelper.parse(req.url).path
    }
}))

app.use('/assets/public', proxy('dev.sunbirded.org', {
    https: true,
    proxyReqPathResolver: function(req) {
        return '/assets/public' + urlHelper.parse(req.url).path
    }
}))

app.use('/content/preview', proxy('dev.sunbirded.org', {
    https: true,
    proxyReqPathResolver: function(req) {
        return '/content/preview' + urlHelper.parse(req.url).path
    }
}))

//
// Player proxy - End
//

//
//  Multiplayer Quiz - Start
//

io.on("connection", socket => {});

io.on("disconnect", function() {
    io.emit("quiz-ended", { quizId: socket.quizId, event: "end" });
});

const request = require("request-promise");
var quizContext = {
    "stallId": "STA2",
    "stallName": "Classroom",
    "ideaId": "IDE7",
    "ideaName": "Multiplayer Quiz",
    "school": "QSBB higher secondary school",
    "district": "Bangalore"
};

const startQuiz = async function(contentId) {
    console.log('Start quiz command received with content - ' + contentId);
    var data = {};
    data.metadata = await getMetadata(contentId);
    data.body = await getBody(contentId);
    io.emit("startQuiz", data);
    quizStatus = "STARTED";
}

const getMetadata = async contentId => {
    const options = {
        method: "GET",
        url: 'https://dev.sunbirded.org/api/content/v1/read/' + contentId,
        json: true
    };
    let response;
    try {
        response = await request(options);
        
        const allQuestionIds = [];
        if (response.result && response.result.content) {
            return response.result.content;
        }
    } catch (error) {
        console.log(error);
    }
    return {};
};

const getBody = async contentId => {
    const options = {
        method: "GET",
        url: 'https://dev.sunbirded.org/api/content/v1/read/' + contentId + '?fields=body,topics',
        json: true
    };
    let response;
    try {
        response = await request(options);
        
        const allQuestionIds = [];
        if (response.result && response.result.content) {
            quizContext.topics = [response.result.content.topics];
            return response.result.content.body;
        }
    } catch (error) {
        console.log(error);
    }
    return {};
};

app.get("/quiz/start/:contentId", async (req, res) => {
    await startQuiz(req.params.contentId);
    res.json({ "quizStatus": quizStatus });
});

app.get("/quiz/status", (req, res) => {
    res.json({ "quizStatus": "ENDED" });
});

app.post("/action/data/v3/telemetry", function(req, res) {
    
    var events = req.body.events;
    var firstEvent = events[0];
    var userName = _.find(firstEvent.context.cdata, { 'type': 'userName' }).id;
    var userId = _.find(firstEvent.context.cdata, { 'type': 'userId' }).id;
    var context = JSON.parse(JSON.stringify(quizContext));
    context.visitorId = userId;
    context.visitorName = userName;
    context.studentId = userId;
    context.studentName = userName;

    
    var interactions = []
    events.forEach(function(event) {
        if (event.eid === 'ASSESS') {
            interactions.push({
                "eid": "DC_PERFORMANCE",
                "ets": new Date().getTime(),
                "did": "device_001",
                "dimensions": context,
                "edata": {
                    duration: event.edata.duration,
                    value: (event.edata.score/event.edata.item.maxscore) * 100
                }
            });
            
        }
    });
    console.log('Events', JSON.stringify(interactions));
    postTelemetryEvents(interactions, function(error, response, body) {
        if (error) console.log(error);
        console.log(body);
        res.status(200).send({});
    });
});

function postTelemetryEvent(event, cb) {
    console.log('event', JSON.stringify(event));
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