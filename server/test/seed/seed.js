const {ObjectID} = require("mongodb");
const {Score} = require('./../../db/models/score');
const {Stat} = require('./../../db/models/stat');

var testID = new ObjectID();


var testScores = [
    { _userId:testID},    
    ];

var testStats = [
    { _userId:testID},   
    ];

const populateScore = (done) => {
  Score.remove({}).then(() => {
    var scoreOne = new Score(testScores[0]).save();   

    return Promise.all([scoreOne])
  }).then(() => done());
};

const  populateStat  = (done) => {
  Stat.remove({}).then(() => {
    var statOne = new Stat(testStats[0]).save();    
    return Promise.all([statOne])
  }).then(() => done());
};

module.exports = {
    populateScore,populateStat,testStats,testID,testScores
}