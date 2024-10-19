import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { createServer } from "livereload";
import connectLivereload from "connect-livereload";
import hbs from "hbs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import indexRouter from "./routes/index.ts";

// Create a livereload server
const liveReloadServer = createServer();
// Watch for changes in views and public directories

// Get __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

liveReloadServer.watch(join(__dirname, "views"));
liveReloadServer.watch(join(__dirname, "public"));

var app = express();

// view engine setup
app.set("views", join(__dirname, "views"));
app.set("view engine", "hbs");

hbs.registerHelper("json", (context: any) => {
  return JSON.stringify(context);
});
hbs.registerHelper(
  "IsNotFirstChapter",
  (
    aString: string,
    options: {
      fn: (context: any) => any;
      inverse: (context: any) => any;
    }
  ) => {
    const value = parseInt(aString);
    if (Number.isNaN(value)) {
      return options.inverse(this);
    }
    return value > 1 ? options.fn(this) : options.inverse(this);
  }
);

// Use connect-livereload middleware to inject livereload script into the pages
app.use(connectLivereload());

// Setup middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));

// Routes
app.use("/", indexRouter);

// Catch 404 and forward to error handler
app.use(function (req: any, res: any, next: any) {
  next(createError(404));
});

console.log("link for test is ", "http://localhost:3000/");
// Error handler
app.use(function (err: any, req: any, res: any, next: any) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

// Start the livereload server
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

export default app;
