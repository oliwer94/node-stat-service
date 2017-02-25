require('./config/config');

var express = require('express');
var bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

var {mongoose} = require('./db/mongoose');
var {Stat} = require('./db/models/stat');
var {Score} = require('./db/models/score');
var {compareNumbers} = require('./utils/utils');

var PORT = process.env.PORT;
var app = express();
var userTokens = [{ token: 'asdojasidjasoofu', id: '12s32df43' }];

app.use(bodyParser.json());
app.use(cookieParser());

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
}

//GET Scores 
app.get('/', (req, res) => {
    res.cookie('token', 'asdojasidjasoofu');
    res.send('wow');
});

//GET Scores 
app.get('/score/:_userId', authenticate, (req, res) => {
     Score.findById(req.user.id).then((score) => {
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
    if (!ObjectID.isValid(req.params.id)) {
        return res.sendStatus(400);
    }

    Stat.findById(req.params.id).then((stat) => {
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

app.post('/addUser', (req, res) => {
    userTokens.push({ id: req.body.id, token: req.body.token });
    res.send(200);
    console.log(userTokens);
    console.log("-------------------------------------");
});

app.post('/removeUser', (req, res) => {
    userTokens = userTokens.filter((user) => user.id !== req.body.id && user.token !== req.body.token);
    res.send(200);
    console.log(userTokens);
    console.log("-------------------------------------");
});

//Auth needed for the methods from here

//PATCH (UPDATE) - scores
app.patch('/scores/:_userId', authenticate, (req, res) => {
    res.send('PATCH SCORES');
    var id = req.params.id;
    var body = _.pick(req.body, ['_userId', 'score']);

    if (!ObjectID.isValid(req.params._userId)) {
        return res.status(400).send("ID is invalid");
    }

    Score.findById(id).then((score) => {

        score.scores.push(body.score);
        score.scores.sort(compareNumbers);

        if (score.scores.legnth > 10) {
            var min = score.scores[9];
            score.scores.filter((sc) => sc >= min);
        }

        Score.findByIdAndUpdate(id, { $set: score }, { new: true }).then((newscore) => {
            res.send({ newscore });
        });
    });
});

//PATCH (UPDATE) - scores
app.patch('/stats/:_userId', authenticate, (req, res) => {
    var id = req.params.id;
    var body = _.pick(req.body, ['statObj']);

    if (!ObjectID.isValid(req.params._userId)) {
        return res.status(400).send("ID is invalid");
    }

    Stat.findById(id).then((stat) => {

        Object.keys(stat).forEach((key) => {
            if (key !== '_userId') {
                stat[key] += body[key];
            }
        });

        Score.findByIdAndUpdate(id, { $set: stat }, { new: true }).then((newstat) => {
            res.send({ newstat });
        });
    });
});



app.listen(PORT, () => {
    console.log("Started on port ", PORT);
});

module.exports = { app };