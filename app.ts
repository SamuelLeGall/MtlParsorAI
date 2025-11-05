import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { createServer } from "livereload";
import connectLivereload from "connect-livereload";
import hbs from "hbs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import indexRoute from "./routes/index";
import authRoute from "./routes/auth";
import usersRoute from "./routes/users";
import chaptersRoute from "./routes/chapters";

import { destination } from "./models/contexte";
import { Authentification } from "./business/auth/Authentification";
import { ResultFactory } from "./models/response";
import { ErrorFactory } from "./models/appError";

// Create a livereload server
const liveReloadServer = createServer();
// Watch for changes in views and public directories

// Get __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

liveReloadServer.watch(join(__dirname, "views"));
liveReloadServer.watch(join(__dirname, "public"));

const app = express();

// view engine setup
app.set("views", join(__dirname, "views"));
app.set("view engine", "hbs");

const redisClient = RedisClient.getInstance();
await redisClient.connect();

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
    },
  ) => {
    if (!destination) {
      return options.inverse(this);
    }
    let chapterNumber =
      destination.params.find((el) => el.code === "CHAPTER_NUMBER")?.value ?? 0;
    if (typeof chapterNumber === "string") {
      chapterNumber = parseInt(chapterNumber);
    }
    if (Number.isNaN(chapterNumber)) {
      return options.inverse(this);
    }
    return chapterNumber > 1 ? options.fn(this) : options.inverse(this);
  },
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
app.use("/", indexRoute);
app.use("/auth", authRoute);
app.use("/users", usersRoute);
app.use("/chapters", chaptersRoute);

// Apply to all routes
export function verifyJWT(expectedUserIDParam: string) {
  return (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Missing or invalid Authorization header" });
      }

      const token = authHeader.split(" ")[1];

      const resultValidation = new Authentification().verifyAccessToken(
        token,
        expectedUserIDParam,
      );
      if (ResultFactory.isError(resultValidation)) {
        const [, errorValidation] = resultValidation;
        errorValidation.logToConsole();
        return res
          .status(errorValidation.code === "UNEXPECTED_ERROR" ? 500 : 403)
          .send(errorValidation.getPublicMessage());
      }

      // Attach user info to request
      const [data] = resultValidation;
      req.user = { userID: data.userID };

      next();
    } catch (e) {
      const error = ErrorFactory.unexpectedError(
        ErrorFactory.createContext("Service", "verifyJWT", {}),
        e,
      );
      error.logToConsole();
      return res.status(500).json({ message: "Unexpected server error" });
    }
  };
}
app.use((req, res, next) => {
  // Skip public routes if you want
  const publicPaths = ["/", "/create", "/login"];
  if (publicPaths.includes(req.path)) return next();

  return verifyJWT("userID")(req, res, next);
});

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
