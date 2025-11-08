import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
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
import {
  AppError,
  AppErrorCodes,
  ErrorCategory,
  ErrorFactory,
  ErrorSeverity,
} from "./models/appError";
import { RedisClient } from "./infrastructure/database/redisClient";

// Watch for changes in views and public directories

// Get __filename and __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// load the redis singleton
const redisClient = RedisClient.getInstance();
await redisClient.connect();

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

// Setup middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));

// Routes

app.use((req, res, next) => {
  // Skip public routes if you want
  const publicViewsPaths = ["/create", "/login"];
  const publicPostPaths = ["/auth/create", "/auth/login"];
  const publicPaths = ["/", ...publicViewsPaths, ...publicPostPaths];
  if (publicPaths.includes(req.path)) return next();

  return verifyJWT()(req, res, next);
});

app.use("/", indexRoute);
app.use("/", authRoute);
app.use("/", usersRoute);
app.use("/", chaptersRoute);

// Apply to all routes
export function verifyJWT() {
  return (req: any, res: any, next: any) => {
    try {
      const userID = req.cookies["userID"];
      const token = req.cookies["accessToken"];
      if (!userID || !token) {
        const error = new AppError(
          `Missing or invalid Authorization headers`,
          AppErrorCodes.ACTION_NOT_ALLOWED,
          ErrorCategory.DOMAIN,
          ErrorSeverity.MEDIUM,
          ErrorFactory.createContext(
            "Service",
            "validateAndNormalizePassword",
            {
              userID: userID,
              accessToken: token,
            },
          ),
          {
            userMessage: `An error occured, try again later.`,
            isRecoverable: false,
          },
        );
        error.logToConsole();
        return res.render("error", {
          title: "Error",
          errorAI: error.getPublicMessage(),
        });
      }

      const resultValidation = new Authentification().verifyAccessToken(
        token,
        userID,
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

// Catch 404 and forward to error handler
app.use(function (_, res: any) {
  return res.render("error", {
    title: "Error",
    errorAI: "Page not found",
  });
});

// Error handler
app.use(function (err: any, req: any, res: any) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  return res.render("error", {
    title: "Error",
    errorAI: "An error Occured",
  });
});

console.log("link for test is ", "http://localhost:3000/");

export default app;
