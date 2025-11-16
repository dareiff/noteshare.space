import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deleteExpiredNotes } from "./deleteExpiredNotes";
import * as noteDao from "../db/note.dao";
import EventLogger from "../logging/EventLogger";
import logger from "../logging/logger";

vi.mock("../db/note.dao");
vi.mock("../logging/EventLogger");

vi.spyOn(logger, "error");

describe("deleteExpiredNotes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call note dao", async () => {
    // mock note dao
    const mockedDao = vi.mocked(noteDao);
    mockedDao.getExpiredNotes.mockResolvedValue([
      {
        id: "test",
        ciphertext: "test",
        hmac: "test",
        iv: null,
        insert_time: new Date(),
        expire_time: new Date(),
        crypto_version: "v1",
        secret_token: "secret_token",
      },
    ]);
    mockedDao.deleteNotes.mockResolvedValue(1);

    // test task call
    await deleteExpiredNotes();
    expect(mockedDao.getExpiredNotes).toHaveBeenCalledOnce();
    expect(mockedDao.deleteNotes).toHaveBeenCalledWith(["test"]);
    expect(logger.error).not.toHaveBeenCalled();
    expect(vi.mocked(EventLogger).purgeEvent).toHaveBeenCalledOnce();
  });
});
