/*jshint esversion: 6 */
require('./config/config');
var express = require('express');
var bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const cors = require("cors");

var { mongoose } = require('./db/mongoose');
var { Stat } = require('./db/models/stat');
var { Score, ScoreSchema } = require('./db/models/score');
var { compareNumbers } = require('./utils/utils');
/*
const populateSweden = (done) => {
    mongoose.model("TestCountry", ScoreSchema, "TestCountry");
    mongoose.model("TestCountry").remove({}).then(() => {
        var data = [];
        for (var i = 1; i < 58; i++) {

            var user = mongoose.model("TestCountry", ScoreSchema, "TestCountry")();
            user._userId = new ObjectID();
            user.country = "TestCountry";
            user.username = "Test" + i;
            user.score = i * 10;
            data.push(user.save());
        }

        return Promise.all(
            data
        );
    });
};

populateSweden();*/


var PORT = process.env.PORT;
var app = express();
var userTokens = [];

const liveFeedDisplayLimit = 5;
const ascending = 1;
const desceding = -1;
const maxNoOfUserScore = 10;
const localSocketRoom = "local";
const globalSocketRoom = "global";
const localPOSTURL = 'room/';

const http = require('http');
var server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ credentials: true, origin: true }));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.CORS); //<-- you can change this with a specific url like http://localhost:4200
    res.header("Access-Control-Allow-Credentials", "true");
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", 'token,Authorization,Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});

var auth = (req, res, next) => {

    var token = req.cookies.token || req.body.token || req.header('token');

    axios.post(process.env.AUTH_API_URL + '/authenticate', {
        token
    }).then((response) => {
        req.StatusCode = response.status;
        next();
    }).catch(function (error) {
        console.log(error.message);
        req.StatusCode = error.response.status;
        next();
    });
};

app.get('/ping', (req, res) => {
    res.send("stat service is up and running");
});

//GET Scores 
app.get('/', (req, res) => {
    // res.cookie('token', 'asdojasidjasoofu');
    res.send('wow');
});

//GET get top x score of y Nation
app.get('/national_top_x/:number/:country', auth, (req, res) => {
    if (req.StatusCode === 200) {
        mongoose.model(req.params.country).find({}).sort({ "score": desceding }).limit(parseInt(req.params.number, 10)).then((scores) => {
            if (scores !== undefined) {
                res.send(scores);
            }
        }).catch((err) => { console.log(err); });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

//GET get top x score of global
app.get('/global_top_x/:number', auth, (req, res) => {
    if (req.StatusCode === 200) {
        mongoose.model("Global").find({}).sort({ "score": desceding }).limit(parseInt(req.params.number, 10)).then((scores) => {
            if (scores !== undefined) {
                res.send(scores);
            }
        }).catch((err) => { console.log(err); });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

//GET user's global rank
app.get('/global_rank/:_userId', auth, (req, res) => {

    //TODO: fix rank where they have the same scores so 1-2-3-4-5-6 -> 1-1-3-4-4-6  or something like that

    if (req.StatusCode === 200) {
        if (!ObjectID.isValid(req.params._userId)) {
            return res.sendStatus(400);
        }
        var maxScore;
        Stat.findOne({ '_userId': req.params._userId }).then((stat) => {
            maxScore = Math.max(...stat._doc.scores);
        }).then(() => {
            Score.count({ 'score': { $gt: maxScore } }).then((score) => {
                if (score !== undefined) {
                    score = score + 1;
                    res.send({ score });
                }
            });
        }).catch((err) => { console.log(err); });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

//GET user's global rank
app.get('/global_rankings/:offset', auth, (req, res) => {
    if (req.StatusCode === 200) {
        mongoose.model("Global").find({}).sort({ "score": desceding }).skip(Number.parseFloat(req.params.offset)).limit(liveFeedDisplayLimit * 2).then((scores) => {

            var data = [];

            scores.forEach(element => {
                var obj = {}
                obj.username = element.username;
                obj.score = element.score;
                obj.country = element.country;
                data.push(obj);

            })

            res.send({ data });
        }).catch((err) => { console.log(err); });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

//GET user's global rank
app.get('/local_rankings/:country/:offset', auth, (req, res) => {
    if (req.StatusCode === 200) {
        mongoose.model(req.params.country).find({}).sort({ "score": desceding }).skip(Number.parseFloat(req.params.offset)).limit(liveFeedDisplayLimit * 2).then((scores) => {

            var data = [];

            scores.forEach(element => {
                var obj = {}
                obj.username = element.username;
                obj.score = element.score;
                data.push(obj);
            })

            res.send({ data });
        }).catch((err) => { console.log(err); });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});
//GET user's global rank
app.get('/page_numbers/:country', auth, (req, res) => {
    if (req.StatusCode === 200) {

        mongoose.model("Global").find({}).then((scores_global) => {
            mongoose.model(req.params.country).find({}).then((scores) => {
                res.send({ "global": scores_global.length, "local": scores.length });
            });
        }).catch((err) => { console.log(err); });

    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

//GET user's national rank
app.get('/local_rank/:_userId', auth, (req, res) => {

    //TODO: fix rank where they have the same scores so 1-2-3-4-5-6 -> 1-1-3-4-4-6  or something like that

    if (req.StatusCode === 200) {
        if (!ObjectID.isValid(req.params._userId)) {
            return res.sendStatus(400);
        }
        var maxScore;
        Stat.findOne({ '_userId': req.params._userId }).then((stat) => {

            maxScore = Math.max(...stat._doc.scores);
            country = stat._doc.country;
        }).then(() => {

            mongoose.model(country).count({ 'score': { $gt: maxScore } }).then((score) => {
                if (score !== undefined) {
                    score = score + 1;
                    res.send({ score });
                }
            });
        }).catch((err) => { console.log(err); });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

//GET X nation's leaderboard
app.get('/nation_leaderboard/:country', auth, (req, res) => {

    if (req.StatusCode === 200) {
        mongoose.model(req.params.country).find({}).then((scores) => {
            if (scores !== undefined) {
                res.send(scores);
            }
        }).catch((err) => { console.log(err); });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

//GET Global Leaderboard
app.get('/leaderboard/global', auth, (req, res) => {
    if (req.StatusCode === 200) {
        mongoose.model("Global").find({}).then((scores) => {
            if (scores !== undefined) {
                res.send(scores);
            }
        }).catch((err) => { console.log(err); });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

//GET Scores of user 
app.get('/score/:_userId', auth, (req, res) => {

    if (req.StatusCode === 200) {
        if (!ObjectID.isValid(req.params._userId)) {
            return res.sendStatus(400);
        }

        Stat.findOne({ '_userId': req.params._userId }).then((stat) => {
            if (stat) {
                res.send(stat.scores);
            }
            else {
                res.sendStatus(404);
            }
        },
            (e) => {
                res.sendStatus(400);
            }
        ).catch((err) => { console.log(err); });
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
        ).catch((err) => { console.log(err); });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

app.post('/saveUserToDb', (req, res) => {

    var body = _.pick(req.body, ['_userId', 'country', 'username']);

    var newStatEntry = new Stat();
    newStatEntry._userId = body._userId;
    newStatEntry.country = body.country;
    newStatEntry.username = body.username;
    newStatEntry.save();

    res.sendStatus(200);
});

//PATCH (UPDATE) - stats
app.post('/stats/:_userId', auth, (req, res) => {
    if (req.StatusCode === 200) {
        var id = req.params._userId;
        var body = _.pick(req.body, ['statObj']);
        var obj = JSON.parse(body.statObj);
         body.statObj = obj;
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
                        if (key.toLocaleLowerCase().indexOf("total") >= 0) {
                            stat._doc[key] += body.statObj[key];
                        }
                        else {
                            stat._doc[key] = (stat._doc[key] > body.statObj[key]) ? stat._doc[key] : body.statObj[key];
                        }
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

                if (!_.isEqual(Math.max(...oldScores), Math.max(...stat.scores))) {
                    updateScores(id, Math.max(...stat.scores), stat.country, stat.username);
                }
            });
        }).catch((err) => { console.log(err); });
    }
    else {
        res.sendStatus(req.StatusCode);
    }
});

//update scores table 
function updateScores(_userId, newscore, country, username) {

    // if(mongoose.modelNames
    mongoose.connection.db.listCollections({ name: country })
        .next(function (err, collinfo) {
            if (err) {

            }
            mongoose.model(country, ScoreSchema, country);
        });

    var globalList = "";
    var localList = "";

    Score.find().sort({ "score": desceding }).limit(liveFeedDisplayLimit).then((scores) => {
        globalList = scores;
    }).then(() => {
        mongoose.model(country).find({}).sort({ "score": desceding }).limit(liveFeedDisplayLimit).then((scores) => {
            localList = scores;
        }).then(() => {

            Score.findOne({ _userId }).then((score) => {

                if (score === null) {

                    var newScoreEntry = new Score();
                    newScoreEntry._userId = _userId;
                    newScoreEntry.country = country;
                    newScoreEntry.score = newscore;
                    newScoreEntry.username = username;
                    newScoreEntry.save().then(() => {
                        updateLiveFeed_Global(globalList);
                    });
                }
                else {
                    var idObj = score._id;
                    score.score = newscore;
                    delete score._id;

                    Score.findByIdAndUpdate(idObj, { $set: score }, { new: true }).then((newMaxScore) => {
                        updateLiveFeed_Global(globalList);
                    });
                }
            });

            mongoose.model(country).findOne({ _userId }).then((score) => {

                if (score === null) {

                    var newScoreEntry = mongoose.model(country, ScoreSchema, country)();
                    newScoreEntry._userId = _userId;
                    newScoreEntry.country = country;
                    newScoreEntry.score = newscore;
                    newScoreEntry.username = username;
                    newScoreEntry.save().then(() => {
                        updateLiveFeed_Local(localList, country);
                    });
                }
                else {
                    var idObj = score._id;
                    score.score = newscore;
                    delete score._id;

                    mongoose.model(country).findByIdAndUpdate(idObj, { $set: score }, { new: true }).then((newMaxScore) => {
                        updateLiveFeed_Local(localList, country);
                    });
                }
            });
        });
    });
}

function updateLiveFeed_Global(old_globalList) {

    var new_globalList = "";

    Score.find().sort({ "score": desceding }).limit(liveFeedDisplayLimit).then((scores) => {
        new_globalList = scores;
    }).then(() => {
        if (!_.isEqual(new_globalList, old_globalList)) {
            axiosPost(globalSocketRoom, new_globalList);
        }
    });
}

function updateLiveFeed_Local(old_localList, country) {

    var new_localList = "";

    Score.find({ country }).sort({ "score": desceding }).limit(liveFeedDisplayLimit).then((scores) => {
        new_localList = scores;
    }).then(() => {

        if (!_.isEqual(new_localList, old_localList)) {
            axiosPost(localPOSTURL + country, new_localList);
        }
    });
}

function axiosPost(room, data) {
    axios.post(process.env.LIVEFEED_API_URL + `/${room}`, {
        data
    }).catch(function (error) {
        console.log(error.status);
    });
}

app.listen(PORT, () => {
    console.log("Started on port ", PORT);
});

mongoose.connection.on('open', function () {
    mongoose.connection.db.listCollections().toArray(function (err, names) {
        if (err) {
            console.log(err);
        } else {
            names.forEach(element => {
                mongoose.model(element.name, ScoreSchema, element.name);
            });
        }
    });
});

module.exports = { app };