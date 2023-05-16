const createError = require('http-errors');
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const indexRouter = require('./routes/index');
const convertRouter = require('./routes/convert');
const authenticateJWT = require('./middleware/authenticate');

const app = express();

morgan.format('json', (tokens, req, res) => {
  return JSON.stringify({
    time: tokens.date(req, res, 'iso'),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    length: tokens.res(req, res, 'content-length'),
    response: tokens['response-time'](req, res),
  })
})

app.use(morgan('json'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/convert', authenticateJWT, convertRouter);
app.get('/healthz', (req, res) => { res.send('ok'); })

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ message: err.message });
  console.error(err);
});

module.exports = app;
