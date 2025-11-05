import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import hbs from "hbs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import indexRouter from "./routes/index";
import { destination } from "./models/contexte";

// Watch for changes in views and public directories

// Get __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ----------- DEV ONLY: Livereload -----------
if (process.env.NODE_ENV === "development") {
  // dynamic imports only in dev
  const { createServer } = await import("livereload");
  const connectLivereload = (await import("connect-livereload")).default;

  // Create livereload server
  const liveReloadServer = createServer({
    exts: ["hbs", "html", "css", "js", "png", "jpg"],
  });

  // Watch folders
  liveReloadServer.watch(join(__dirname, "views"));
  liveReloadServer.watch(join(__dirname, "public"));

  // Inject livereload script
  app.use(connectLivereload());

  // Refresh on connection
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });
}

// view engine setup
app.set("views", join(__dirname, "views"));
app.set("view engine", "hbs");

hbs.registerHelper("json", (context: any) => {
  return JSON.stringify(context);
});
hbs.registerHelper(
  "IsNotFirstChapter",
  (
    destination: destination,
    options: {
      fn: (context: any) => any;
      inverse: (context: any) => any;
    }
  ) => {
    let chapterNumber =
      destination.params.find((el) => el.code === "CHAPTER_NUMBER")?.value ?? 0;
    if (typeof chapterNumber === "string") {
      chapterNumber = parseInt(chapterNumber);
    }
    if (Number.isNaN(chapterNumber)) {
      return options.inverse(this);
    }
    return chapterNumber > 1 ? options.fn(this) : options.inverse(this);
  }
);

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

export default app;
