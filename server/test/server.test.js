const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const {app} = require('./../server');
const {Score} = require('./../db/models/score');
const {Stat} = require('./../db/models/stat');
const seed = require('./seed/seed');

var testID = seed.testID;

var testScores = seed.testScores;
var testStats = seed.testStats;

beforeEach((done) => {

    axios.post('http://localhost:3000/removeUser', {
        token: 'asdojasidjasoofu',
        id: testID
    }).catch(function (error) {
        console.log(error);
    });
    axios.post('http://localhost:3000/adduser', {
        token: 'asdojasidjasoofu',
        id: testID
    }).catch(function (error) {
        console.log(error);
    });

    seed.populateStat(done);
});
beforeEach((done) => {
    seed.populateScore(done);
});

//   .set('Cookie', [`token=${testUsers[2].tokens[0].token}`])

describe('GET /score/:_userId', () => {

    it('should return user\'s score', (done) => {

        request(app)
            .get(`/score/${testID}`)
            .set('Cookie', [`token=asdojasidjasoofu`])
            .expect(200)
            .expect((res) => {
                expect(res.body.score._userId).toBe(testID.toHexString());
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }
                Score.find({ '_userId': testID }).then((score) => {
                    expect(score.length).toBe(1);
                    expect(score[0].scores).toEqual([]);
                    return done();
                }).catch((e) => done(e));
            });
    });

    it('should return a 401', (done) => {

        request(app)
            .get(`/score/${testID}`)
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });

});

describe('GET /stat/:_userId', () => {

    it('should return user\'s stat', (done) => {
       request(app)
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

        request(app)
            .get('/stat/${testID}')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});


describe('PATCH /scores/:_userId', () => {

    it('should add to user\'s  score.scores', (done) => {

        request(app)
            .patch(`/scores/${testID}`)
            .set('Cookie', [`token=asdojasidjasoofu`])
            .send({'_userId':testID,'score':3000})
            .expect(200)
            .expect((res) => {
                expect(res.body.newscore._userId).toBe(testID.toHexString());
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }
                Score.findOne({ '_userId': testID }).then((score) => {
                    expect(score.scores.length).toBe(1);
                     expect(score.scores[0]).toEqual(3000);
                    expect
                    return done();
                }).catch((e) => done(e));
            });
    });

    it('should return a 401', (done) => {

        request(app)
            .patch(`/scores/${testID}`)
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe('PATCH /stat/:_userId', () => {

    it('should update user\'s stats', (done) => {
        var statObj = new Stat();
        statObj.totalSkullCount = 10;
       request(app)
            .patch(`/stats/${testID}`)
            .set('Cookie', [`token=asdojasidjasoofu`])
            .send({'statObj':statObj})
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
                    expect
                    return done();
                }).catch((e) => done(e));
            });
    });

    it('should return a 401', (done) => {       

        request(app)
            .patch(`/stats/${testID}`)
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});
