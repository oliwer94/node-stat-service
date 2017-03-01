require('./config/config');

var express = require('express');
var bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
var cache = require('persistent-cache');

var {mongoose} = require('./db/mongoose');
var {Stat} = require('./db/models/stat');
var {Score} = require('./db/models/score');
var {compareNumbers} = require('./utils/utils');

var PORT = process.env.PORT;
var app = express();
var userTokens = [];

var mycache = cache({
    //duration: 1000 * 3600 * 24 //one day
    duration: 1000 * 60 * 10 // 10 mins
});
app.use(bodyParser.json());
app.use(cookieParser());

var authenticate = (req, res, next) => {
    var token = req.cookies.token;
    var value = mycache.getSync(token);
    if (value !== undefined) {

        next();
    }
    else {
        res.sendStatus(401);
    }
}

//GET Scores 
app.get('/', (req, res) => {
    res.cookie('token', 'asdojasidjasoofu');
    res.send('wow');
});

//GET Scores 
app.get('/score/:_userId', authenticate, (req, res) => {

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
});

//GET Stats
app.get('/stat/:_userId', authenticate, (req, res) => {
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
});

app.post('/saveUserToDb', (req, res) => {

    var body = _.pick(req.body, ['_userId']);

    var newStatEntry = new Stat();
    newStatEntry._userId = body._userId;

    var newScoreEntry = new Score();
    newScoreEntry._userId = body._userId;

    newStatEntry.save();
    newScoreEntry.save();

    res.sendStatus(200);

});

app.post('/addUser', (req, res) => {
    mycache.putSync(req.body.token, { "_userId": req.body.id });
    if (process.env.NODE_ENV === "test") {
        return res.status(200).send({ "token": req.body.token, "id": mycache.getSync(req.body.token) });
    }
    res.sendStatus(200);
});

app.post('/removeUser', (req, res) => {

    if (mycache.getSync(req.body.token) !== undefined) {
        mycache.deleteSync(req.body.token);
        if (process.env.NODE_ENV === "test") {
            return res.status(200).send({ "token": req.body.token, "id": mycache.getSync(req.body.token) });
        }
        res.sendStatus(200);
    }
    else
    {
        res.sendStatus(404)
    }

});

//Auth needed for the methods from here

//PATCH (UPDATE) - scores
app.patch('/scores/:_userId', authenticate, (req, res) => {
    // res.send('PATCH SCORES');
    var id = req.params._userId;
    var body = _.pick(req.body, ['_userId', 'score']);

    if (!ObjectID.isValid(req.params._userId)) {
        return res.status(400).send("ID is invalid");
    }

    Score.findOne({ '_userId': id }).then((score) => {

        score.scores.push(body.score);
        score.scores.sort(compareNumbers);

        if (score.scores.length > 10) {
            var min = score.scores[9];
            score.scores.filter((sc) => sc >= min);
        }

        Score.findByIdAndUpdate(score._id, { $set: score }, { new: true }).then((newscore) => {
            res.status(200).send({ newscore });
        });
    });
});

//PATCH (UPDATE) - scores
app.patch('/stats/:_userId', authenticate, (req, res) => {
    var id = req.params._userId;
    var body = _.pick(req.body, ['statObj']);

    if (!ObjectID.isValid(req.params._userId)) {
        return res.status(400).send("ID is invalid");
    }

    Stat.findOne({ '_userId': id }).then((stat) => {

        Object.keys(body.statObj).forEach((key) => {
            if (key !== '_userId' && key !== '_id' && key !== '__v') {
                stat._doc[key] += body.statObj[key];
            }
        });

        Stat.findByIdAndUpdate(stat._id, { $set: stat }, { new: true }).then((newstat) => {
            res.send({ newstat });
        });
    });
});

app.listen(PORT, () => {
    console.log("Started on port ", PORT);
});

module.exports = { app };

/*
//silly cache solution
var authenticate = (req, res, next) => {
    if (req.cookies.token) {
        var user_entry = userTokens.filter(function (user) { return user.token === req.cookies.token })[0];
        if (user_entry && _.includes(user_entry, req.cookies.token)) {
            next();
        }
        else {
            res.sendStatus(401);
        }
    }
    else {
        res.sendStatus(401);
    }
}*/

/*
function isUserIncluded(token, id) {

    var user_entries = userTokens.filter((user) => user.token === token && user.id === id);

    if (user_entries.length === 1) {
        return true;
    }
    else {
        return false;
    }
}

app.post('/addUser', (req, res) => {
    var isIncluded = isUserIncluded(req.body.token, req.body.id);

    if (!isIncluded) {
        userTokens.push({ id: req.body.id, token: req.body.token });

        res.sendStatus(200);
        console.log(userTokens);
        console.log("User has been added to the online list---------------------------");
    }
    else {
        res.sendStatus(404);
        console.log(userTokens);
        console.log("User not found");

    }
});

app.post('/removeUser', (req, res) => {

    var isIncluded = isUserIncluded(req.body.token, req.body.id);

    if (isIncluded) {
        userTokens = userTokens.filter((user) =>  user.token !== req.body.token);

        res.sendStatus(200);
        console.log(userTokens);
        console.log("User has been removed from the online list---------------------------");


    }
    else {
        res.sendStatus(404);
        console.log(userTokens);
        console.log("User not found");
    }



});*/