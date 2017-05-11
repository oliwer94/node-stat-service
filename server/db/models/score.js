var mongoose = require('mongoose');


var ScoreSchema = new mongoose.Schema(
    {
        _userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            minlength: 1                    
        },
        score: Number,
        country:{
            type: String,
            required: true
        }
    });

var Score = mongoose.model("Global", ScoreSchema,"Global");

module.exports = { Score,ScoreSchema };
