import http from "http";
import { RushError } from "../rushError";

export const getBodyData = (req: http.IncomingMessage) =>
  new Promise((ok, error) => {
    let body = "";

    req.on("data", (d) => (body += d));
    req.on("error", error);
    req.on("end", () => {
      if (
        req.headers["content-type"] === "application/json" ||
        ["[", "{"].includes(body.trim()[0])
      ) {
        try {
          const jsonBody = JSON.parse(body);
          ok(jsonBody);
        } catch (e) {
          if (req.headers["content-type"] === "application/json") {
            error(
              new RushError(`JSON Body is not valid, body content was ${body}`)
            );
          }

          ok(body);
        }
      } else ok(body);
    });
  });
