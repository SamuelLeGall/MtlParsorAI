var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

// Create a livereload server
const liveReloadServer = livereload.createServer();
// Watch for changes in views and public directories
liveReloadServer.watch(path.join(__dirname, "views"));
liveReloadServer.watch(path.join(__dirname, "public"));

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// Use connect-livereload middleware to inject livereload script into the pages
app.use(connectLivereload());

// Setup middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", indexRouter);
app.use("/users", usersRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  console.log("link for test is ", "http://localhost:3000/");
  res.status(err.status || 500);
  res.render("error");
});

// Start the livereload server
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

module.exports = app;
