import { createServer, type AddressInfo, type Server } from "node:net";

import * as Sentry from "@sentry/nextjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { inMemoryMailer, smtpMailer } from "@/server/mailer";

vi.mock("@/env", () => ({
  env: {
    EMAIL_SERVER_HOST: "localhost",
    EMAIL_SERVER_PORT: "1025",
    EMAIL_SERVER_USER: "user",
    EMAIL_SERVER_PASSWORD: "password",
    EMAIL_FROM: "ImprovDB <noreply@improvdb.test>",
  },
}));

vi.mock("@sentry/nextjs", () => ({
  withScope: (callback: (scope: unknown) => void) =>
    callback({ setFingerprint: vi.fn(), setTag: vi.fn() }),
  captureException: vi.fn(),
}));

const email = {
  to: "someone@example.com",
  subject: "Hello",
  html: "<p>Hi</p>",
};

describe("smtpMailer", () => {
  let server: Server;
  let port: number;

  // An SMTP server that rejects every message with a permanent error
  beforeEach(async () => {
    server = createServer((socket) => {
      socket.write("220 test ESMTP\r\n");
      socket.on("data", (data) => {
        const command = data.toString().trim().toUpperCase();
        if (command.startsWith("EHLO") || command.startsWith("HELO")) {
          socket.write("250 test\r\n");
        } else if (command.startsWith("QUIT")) {
          socket.end("221 bye\r\n");
        } else {
          socket.write("554 rejected\r\n");
        }
      });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    port = (server.address() as AddressInfo).port;
    vi.mocked(Sentry.captureException).mockClear();
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("reports a failed send instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const mailer = smtpMailer({ host: "127.0.0.1", port, secure: false });

    await expect(mailer.send(email)).resolves.toBeUndefined();
    expect(Sentry.captureException).toHaveBeenCalledOnce();
  });

  it("sends nothing to an empty recipient list", async () => {
    const connections = vi.fn();
    server.on("connection", connections);
    const mailer = smtpMailer({ host: "127.0.0.1", port, secure: false });

    await mailer.send({ ...email, to: [] });
    expect(connections).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});

describe("inMemoryMailer", () => {
  it("keeps every email it is given", async () => {
    const mailer = inMemoryMailer();
    await mailer.send(email);
    expect(mailer.sent).toEqual([email]);
  });
});
