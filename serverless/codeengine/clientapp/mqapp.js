/**
 * Copyright 2021 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

 // This is an Node.js express application that provide a web app and associated
 // api that perform IBM MQ get / put operations.

var createError = require('http-errors');
const express = require('express');
const pug = require('pug');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev'));


// The Web page routes and API can be found here.
const approutes = require('./routes/approutes');

// Set Logging options
let debug_info = require('debug')('mqapp-app:info');
let debug_warn = require('debug')('mqapp-app:warn');

//view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', approutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  debug_warn('Returning a 404');
  next(createError(404));
});


module.exports = app;
