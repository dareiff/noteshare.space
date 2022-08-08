import "dotenv/config";
import express, { Express, Request, Response } from "express";
import { EncryptedNote } from "@prisma/client";
import { addDays } from "./util";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import logger from "./logger";
import prisma from "./client";
import bodyParser from "body-parser";
import { NotePostRequest } from "./model/NotePostRequest";
import { validateOrReject } from "class-validator";
import EventLogger from "./EventLogger";

// Initialize middleware clients
const app: Express = express();
app.use(express.json());

// configure logging
app.use(
  pinoHttp({
    logger: logger,
  })
);

// configure Helmet and CORS
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: process.env.ENVIRONMENT == "dev" ? "cross-origin" : "same-origin",
    },
  })
);

// Apply rate limiting
const postLimiter = rateLimit({
  windowMs: parseFloat(process.env.POST_LIMIT_WINDOW_SECONDS as string) * 1000,
  max: parseInt(process.env.POST_LIMIT as string), // Limit each IP to X requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const getLimiter = rateLimit({
  windowMs: parseFloat(process.env.GET_LIMIT_WINDOW_SECONDS as string) * 1000,
  max: parseInt(process.env.GET_LIMIT as string), // Limit each IP to X requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply 400kB upload limit on POST
app.use(bodyParser.json({ limit: "400k" }));

// Get encrypted note
app.get("/api/note/:id", getLimiter, (req: Request, res: Response, next) => {
  prisma.encryptedNote
    .findUnique({
      where: { id: req.params.id },
    })
    .then(async (note) => {
      if (note != null) {
        await EventLogger.readEvent({
          success: true,
          host: req.hostname,
          note_id: note.id,
          size_bytes: note.ciphertext.length + note.hmac.length,
        });
        res.send(note);
      } else {
        await EventLogger.readEvent({
          success: false,
          host: req.hostname,
          note_id: req.params.id,
          error: "Note not found",
        });
        res.status(404).send();
      }
    })
    .catch(async (err) => {
      await EventLogger.readEvent({
        success: false,
        host: req.hostname,
        note_id: req.params.id,
        error: err.message,
      });
      next(err);
    });
});

// Post new encrypted note
app.post("/api/note/", postLimiter, (req: Request, res: Response, next) => {
  const notePostRequest = new NotePostRequest();
  Object.assign(notePostRequest, req.body);
  validateOrReject(notePostRequest).catch((err) => {
    res.status(400).send(err.message);
  });
  const note = notePostRequest as EncryptedNote;
  const EXPIRE_WINDOW_DAYS = 30;
  prisma.encryptedNote
    .create({
      data: {
        ...note,
        expire_time: addDays(new Date(), EXPIRE_WINDOW_DAYS),
      },
    })
    .then(async (savedNote) => {
      await EventLogger.writeEvent({
        success: true,
        host: req.hostname,
        note_id: savedNote.id,
        size_bytes: savedNote.ciphertext.length + savedNote.hmac.length,
        expire_window_days: EXPIRE_WINDOW_DAYS,
      });
      res.json({
        view_url: `${process.env.FRONTEND_URL}/note/${savedNote.id}`,
        expire_time: savedNote.expire_time,
      });
    })
    .catch(async (err) => {
      await EventLogger.writeEvent({
        success: false,
        host: req.hostname,
        error: err.message,
      });
      next(err);
    });
});

// Clean up expired notes periodically
export async function cleanExpiredNotes(): Promise<number> {
  logger.info("[Cleanup] Cleaning up expired notes...");

  const toDelete = await prisma.encryptedNote.findMany({
    where: {
      expire_time: {
        lte: new Date(),
      },
    },
  });

  return prisma.encryptedNote
    .deleteMany({
      where: { id: { in: toDelete.map((note) => note.id) } },
    })
    .then(async (deleted) => {
      const logs = toDelete.map(async (note) => {
        logger.info(
          `[Cleanup] Deleted note ${note.id} with size ${
            note.ciphertext.length + note.hmac.length
          } bytes`
        );
        return EventLogger.purgeEvent({
          success: true,
          note_id: note.id,
          size_bytes: note.ciphertext.length + note.hmac.length,
        });
      });
      await Promise.all(logs);
      logger.info(`[Cleanup] Deleted ${deleted.count} expired notes.`);
      return deleted.count;
    })
    .catch((err) => {
      logger.error(`[Cleanup] Error cleaning expired notes:`);
      logger.error(err);
      return -1;
    });
}

const interval =
  Math.max(parseInt(<string>process.env.CLEANUP_INTERVAL_SECONDS) || 1, 1) *
  1000;
setInterval(cleanExpiredNotes, interval);

export default app;
