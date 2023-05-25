const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const Sentry = require('@sentry/node');

const indexRouter = require('./routes/index');
const convertRouter = require('./routes/convert');
const authenticateJWT = require('./middleware/authenticate');

const app = express();

Sentry.init({
  dsn: "https://d3ec18297b214262b8226f2de1cd2f89@o46394.ingest.sentry.io/4505242785415168",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
    // Automatically instrument Node.js libraries and frameworks
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

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
app.use(cors());

// RequestHandler creates a separate execution context, so that all
// transactions/spans/breadcrumbs are isolated across requests
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use('/', indexRouter);
app.use('/convert', authenticateJWT, convertRouter);
app.get('/healthz', (req, res) => { res.send('ok'); })

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

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
