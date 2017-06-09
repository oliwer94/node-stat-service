/*jshint esversion: 6 */
const { ObjectID } = require("mongodb");
const { Score } = require('./../../db/models/score');
const { Stat } = require('./../../db/models/stat');

var testID = new ObjectID();


var testScores =
  {
    "_userId": testID,
    "username": "oliwer",
    "country": "Denmark"
  };

var testStats =
  {
    "_userId": testID,
    "username": "oliwer",
    "country": "Denmark"
  };

const populateScore = (done) => {
  Score.remove({}).then(() => {
    var scoreOne = new Score(testScores).save();

    return Promise.all([scoreOne]);
  }).then(() => done());
};

const populateStat = (done) => {
  Stat.remove({}).then(() => {
    var statOne = new Stat(testStats).save();
    return Promise.all([statOne]);
  }).then(() => done());
};

module.exports = {
  populateScore, populateStat, testStats, testID, testScores
};