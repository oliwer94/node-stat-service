/*jshint esversion: 6 */
const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const sinon = require('sinon');
var auth = require('./../auth/authentication');

var agent;

var _app;// = require('./../server');
const { Score } = require('./../db/models/score');
const { Stat } = require('./../db/models/stat');
const seed = require('./seed/seed');

var testID = seed.testID;

var testScores = seed.testScores;
var testStats = seed.testStats;



beforeEach((done) => {


    //important to stub before we load our app
    ensureAuthenticatedSpy = sinon.stub(auth, 'auth').callsFake(
        function (res, req, next) {
            req.StatusCode = 200;
            req.req.StatusCode = 200;
            next();
        }
    );;
    //this ensures we call our next() function on our middleware
    ensureAuthenticatedSpy.callsArg(2);

    // agent = require('supertest');
    var { app } = require('./../server');
    _app = app;

    seed.populateStat(done);

});
beforeEach((done) => {
    seed.populateScore(done);
});
//.set('Cookie', [`token=${testUsers[2].tokens[0].token}`])
var ensureAuthenticatedSpy;

before(function () {


});


describe('GET anything without token', () => {

    /* 
     afterEach(() => {
         //assert that our middleware was called once for each test
         sinon.assert.calledOnce(ensureAuthenticatedSpy);
 
         ensureAuthenticatedSpy.reset();
     })*/

    it('should return a 401', (done) => {
        request(_app)
            .get(`/score/${testID}`)
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});/*

describe('GET /stat/:_userId', () => {

    it('should return user\'s stat', (done) => {
        request(_app)
            .get(`/stat/${testID}`)
            .set('Cookie', [`token=asdojasidjasoofu`])
            .expect(200)
            .expect((res) => {
                expect(res.body.stat._userId).toBe(testID.toHexString());
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }
                Stat.find({ '_userId': testID }).then((stat) => {
                    expect(stat.length).toBe(1);
                    return done();
                }).catch((e) => done(e));
            });
    });

    it('should return a 401', (done) => {

        request(_app)
            .get('/stat/${testID}')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});*/
/*
describe('PATCH /stat/:_userId', () => {

    it('should update user\'s stats', (done) => {
        var statObj = new Stat();
        statObj.totalSkullCount = 10;
        request(_app)
            .patch(`/stats/${testID}`)
            .set('Cookie', [`token=asdojasidjasoofu`])
            .send({ 'statObj': statObj })
            .expect(200)
            .expect((res) => {
                expect(res.body.newstat._userId).toBe(testID.toHexString());
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }
                Stat.findOne({ '_userId': testID }).then((stat) => {
                    expect(stat.totalSkullCount).toBe(10);
                    return done();
                }).catch((e) => done(e));
            });
    });

    it('should return a 401', (done) => {

        request(_app)
            .patch(`/stats/${testID}`)
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe('POST /saveUserToDb', () => {

    it('should create a new stat entry in the db', (done) => {

        request(_app)
            .post(`/saveUserToDb`)
            .send({ '_userId': new ObjectID() })
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                }
                Stat.find().then((stats) => {
                    expect(stats.length).toBe(2);
                    return done();
                }).catch((e) => done(e));
            });
    });

    it('should create a new score entry in the db', (done) => {

        request(_app)
            .post(`/saveUserToDb`)
            .send({ '_userId': new ObjectID() })
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                }
                Score.find().then((scores) => {
                    expect(scores.length).toBe(2);
                    return done();
                }).catch((e) => done(e));
            });
    });
});*/