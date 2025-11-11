// src/types/express.d.ts
import "express";
import { UserDB } from "./users";

declare global {
  namespace Express {
    interface UserPayload {
      userID: UserDB["id"];
    }

    interface Request extends express.Request {
      user?: UserPayload;
    }
  }
}
