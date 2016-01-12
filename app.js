/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'),
    app = express(),
    vcapServices = require('vcap_services'),
    extend = require('util')._extend,
    watson = require('watson-developer-cloud'),
    bluemix = require('./config/bluemix'),
    i18n = require('i18next');

//i18n settings
require('./config/i18n')(app);

// Bootstrap application settings
require('./config/express')(app);

// For local development, replace username and password
var config = extend({
    version: 'v1',
    "password": 'yourpassword',
    "url": 'yoururl',
    "username": 'yourname'
}, vcapServices.getCredentials('speech_to_text'));

var authService = watson.authorization(config);

app.get('/', function (req, res) {
    res.render('index', { ct: req._csrfToken });
});

app.get('/moxtra', function (req, res) {
    res.render('moxtra', { ct: req._csrfToken });
});

app.get('/meet', function (req, res) {
    res.render('meet', { ct: req._csrfToken });
});

// Get token using your credentials
app.post('/api/token', function (req, res, next) {
    authService.getToken({ url: config.url }, function (err, token) {
        if (err)
            next(err);
        else
            res.send(token);
    });
});

// if bluemix credentials exists, then override local
var credentials = extend({
    version: 'v2',
    "password": 'yourpassowrd',
    "url": 'someurl',
    "username": 'yourname'
}, bluemix.getServiceCreds('personality_insights')); // VCAP_SERVICES

// Create the service wrapper
var personalityInsights = watson.personality_insights(credentials);

app.post('/', function (req, res, next) {
    var parameters = extend(req.body, { acceptLanguage: i18n.lng() });

    personalityInsights.profile(parameters, function (err, profile) {
        if (err)
            return next(err);
        else
            return res.json(profile);
    });
});

app.get('/personality/', function (req, res, next) {
    res.render('personality', { ct: req._csrfToken });
});

// error-handler settings
require('./config/error-handler')(app);

// var port = process.env.VCAP_APP_PORT || 3000;
var port = process.env.PORT || 3000;
app.listen(port);
console.log('listening at:', port);
