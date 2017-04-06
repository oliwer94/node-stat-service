/*jshint esversion: 6 */

require('./config/config');

var express = require('express');
var bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const axios = require('axios');

var { mongoose } = require('./db/mongoose');
var { Stat } = require('./db/models/stat');
var { Score } = require('./db/models/score');
var { compareNumbers } = require('./utils/utils');

var PORT = process.env.PORT;
var app = express();
var userTokens = [];

const liveFeedDisplayLimit = 5;
const ascending = 1;
const desceding = -1;
const maxNoOfUserScore = 10;
const localSocketRoom = "local";
const globalSocketRoom = "global";

const http = require('http');
const socketIO = require('socket.io');
var server = http.createServer(app);
var io = socketIO(server);

//to everyone in the room
//io.to(params.room).emit();
//to everyone but sender in the room
//socket.broadcast.to(params.room).emit();
io.listen("3003");

io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('join', (callback) => {

        //country or region ranking live feed
        socket.join(localSocketRoom);

        //global live feed
        socket.join(globalSocketRoom);

        callback();
    });

    socket.on('disconnect', () => {
        console.log("a user has been disconnected");
    });
});

app.use(bodyParser.json());
app.use(cookieParser());

var updateUserInCache = (token, _userId) => {

    axios.post(process.env.AUTH_API_URL + '/updateUserInCache', {
        token: token,
        id: _userId
    }).catch(function (error) {
        console.log(error);
    });
};

var auth = (req, res, next) => {

    axios.post(process.env.AUTH_API_URL + '/authenticate', {
        token: req.cookies.token
    }).then((response) => {
        req.StatusCode = response.status;
        next();
    }).catch(function (error) {
        console.log(error);
        req.StatusCode = error.response.status;
        next();
    });
};

//GET Scores 
app.get('/', (req, res) => {
    // res.cookie('token', 'asdojasidjasoofu');
    res.send('wow');
});

//GET Scores of user
app.get('/score/:_userId', auth, (req, res) => {

    if (req.StatusCode === 200) {
        if (!ObjectID.isValid(req.params._userId)) {
            return res.sendStatus(400);
        }

        Score.findOne({ '_userId': req.params._userId }).then((score) => {
            if (score) {
                res.send({ score });
            }
            else {
                res.sendStatus(404);
            }
        },
            (e) => {
                res.sendStatus(400);
            }
        );
    }
    else {
        res.sendStatus(req.StatusCode);
    }

});

//GET Stat of user
app.get('/stat/:_userId', auth, (req, res) => {

    if (req.StatusCode === 200) {
        if (!ObjectID.isValid(req.params._userId)) {
            return res.sendStatus(400);
        }

        Stat.findOne({ '_userId': req.params._userId }).then((stat) => {
            if (stat) {
                res.send({ stat });
            }
            else {
                res.sendStatus(404);
            }
        },
            (e) => {
                res.sendStatus(400);
            }
        );
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

app.post('/saveUserToDb', (req, res) => {

    var body = _.pick(req.body, ['_userId']);

    var newStatEntry = new Stat();
    newStatEntry._userId = body._userId;
    newStatEntry.save();

    res.sendStatus(200);
});

//PATCH (UPDATE) - stats
app.patch('/stats/:_userId', auth, (req, res) => {

    if (req.StatusCode === 200) {
        var id = req.params._userId;
        var body = _.pick(req.body, ['statObj', "country"]);

        if (!ObjectID.isValid(req.params._userId)) {
            return res.status(400).send("ID is invalid");
        }

        Stat.findOne({ '_userId': id }).then((stat) => {

            var oldScores = stat.scores.slice(0);

            Object.keys(body.statObj).forEach((key) => {

                if (key !== '_userId' && key !== '_id' && key !== '__v') {
                    if (Array.isArray(body.statObj[key])) {
                        body.statObj[key].forEach((element) => {
                            stat._doc[key].push(element);
                        });
                    }
                    else {
                        stat._doc[key] += body.statObj[key];
                    }
                }
            });

            if (stat.scores.length > maxNoOfUserScore) {
                stat.scores.sort((a, b) => b - a);
                stat.scores = stat.scores.slice(0, maxNoOfUserScore);
            }

            var idObj = stat._id;
            delete stat._id;

            Stat.findByIdAndUpdate(idObj, { $set: stat }, { new: true }).then((newstat) => {
                res.send(newstat);
                if (!_.isEqual(oldScores, stat.scores)) {
                    updateScores(id, stat.scores, body.country);
                }
            });
        });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

//update scores table 
function updateScores(_userId, newscores, country) {

    var globalList = "";
    var localList = "";

    Score.find().sort({ "score": desceding }).limit(liveFeedDisplayLimit).then((scores) => {
        globalList = scores;
    }).then(() => {
        Score.find({ country }).sort({ "score": desceding }).limit(liveFeedDisplayLimit).then((scores) => {
            localList = scores;
        }).then(() => {

            var query = Score.find().remove({ _userId });
            query.remove({ _userId: ObjectID(_userId) }, function () {

                var saves = [];
                newscores.forEach((element, idx, array) => {

                    var newScoreEntry = new Score();
                    newScoreEntry._userId = _userId;
                    newScoreEntry.country = country;
                    newScoreEntry.score = element;
                    saves.push(new Score(newScoreEntry).save());
                });

                return Promise.all(saves)
                    .then(() =>
                        updateLiveFeed(globalList, localList, country));
            });
        });
    });
}

function updateLiveFeed(old_globalList, old_localList, country) {

    var new_globalList = "";
    var new_localList = "";

    Score.find().sort({ "score": desceding }).limit(liveFeedDisplayLimit).then((scores) => {
        new_globalList = scores;
    }).then(() => {
        Score.find({ country }).sort({ "score": desceding }).limit(liveFeedDisplayLimit).then((scores) => {
            new_localList = scores;
        }).then(() => {
            if (!_.isEqual(new_globalList, old_globalList)) {

                io.to(globalSocketRoom).emit(globalSocketRoom, new_globalList);
            }

            if (!_.isEqual(new_localList, old_localList)) {

                io.to(localSocketRoom).emit(localSocketRoom, country, new_localList);
            }
        });
    });
}

app.listen(PORT, () => {
    console.log("Started on port ", PORT);
});

module.exports = { app };