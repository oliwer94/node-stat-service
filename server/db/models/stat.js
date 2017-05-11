var mongoose = require('mongoose');
const {ObjectID} = require('mongodb');

var StatSchema = new mongoose.Schema(
    {
        _userId: {
            type:  mongoose.Schema.Types.ObjectId,
            required: true,
            minlength: 1,
            unique: true           
        },
        country:{
            type: String,
            required: true
        },
        scores:[],
        timePlayedTotal: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        longestGame: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        totalScoreEarned: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostScoreInOneGame: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostScoreInOneLife: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        totalLivesLost: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostLivesLostInOneGame: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        totalAsteroidsDestroyed: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostAsteroidsDestroyedInOneGame: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostAsteroidsDestroyedInOneLife: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        totalBombCount: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostBombCountInOneGame: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostBombCountInOneLife: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        totalMediKitCount: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostMediKitCountInOneGame: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostMediKitCountInOneLife: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        totalLightningCount: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostLightningCountInOneGame: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostLightningCountInOneLife: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        totalSkullCount: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostSkullCountInOneGame: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        },
        mostSkullCountInOneLife: {
            type: Number,
            minlength: 1,
            trim: true,
            default: 0
        }
    });

var Stat = mongoose.model("Stat", StatSchema);

module.exports = { Stat };
