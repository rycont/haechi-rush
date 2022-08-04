import { string, z, ZodError } from "zod";
import chokidar from "chokidar";
import http from "http";
import path from "path";
import { Endpoint, Methods, RushConfig } from "./types";
import { swaggerFrontendEndpoint, swaggerGenerator } from "./builtinHandlers";
import { RushError } from "./rushError";
import { getBodyData } from "./utils/bodyParser";
import { pathToEndpoint } from "./utils/pathToEndpoint";

export * from "./handler";

const hasToString = (
  d: any
): d is {
  toString(): string;
} => (d as any)?.toString instanceof Function;

const sendResponse = (
  result: any,
  res: http.ServerResponse,
  headerPot: Record<string, string | number>,
  config: {
    isRaw?: boolean;
  } = {}
) => {
  if (config.isRaw) {
    if (Object.keys(headerPot).length > 0) {
      res.writeHead(200, headerPot);
    }
    res.write(result);

    return
  }

  if (result === undefined) return;

  if (typeof result === "object") {
    res.writeHead(200, { "Content-Type": "application/json", ...headerPot });
    res.write(JSON.stringify(result));

    return;
  }

  if (typeof result === "string" || typeof result === "number") {
    res.writeHead(200, { "Content-Type": "text/plain", ...headerPot });
  }

  if (hasToString(result)) {
    res.write(result.toString());

    return;
  }

  res.write(result);
};

export const rush = async (
  dirName: string,
  _config: Partial<RushConfig> = {}
) => {
  console.log("Preparing for rush...");

  const config = {
    port: 3000,
    address: "localhost",
    cors: "allowAll",
    ..._config,
    swagger: {
      path: "docs",
      disabled: false,
      ..._config.swagger,
    },
  };

  let loadedEndpoints: Endpoint[] = config.swagger?.disabled
    ? []
    : [swaggerFrontendEndpoint(config), swaggerGenerator(config)];

  chokidar
    .watch(dirName)
    .on("add", async (filePath) => {
      const relativePath = path.relative(dirName, filePath);
      console.log(`Add: "${relativePath}"`);

      loadedEndpoints = [
        ...loadedEndpoints,
        await pathToEndpoint(dirName, filePath),
      ];
    })
    .on("change", async (filePath) => {
      const relativePath = path.relative(dirName, filePath);
      const index = loadedEndpoints.findIndex(
        (endpoint) => endpoint.path.filePath === relativePath
      );

      console.log(`Reloaded: "${relativePath}"`);
      delete require.cache[filePath];

      loadedEndpoints = [
        ...loadedEndpoints.slice(0, index),
        await pathToEndpoint(dirName, filePath),
        ...loadedEndpoints.slice(index + 1),
      ];
    })
    .on("unlink", (filePath) => {
      const relativePath = path.relative(dirName, filePath);
      const index = loadedEndpoints.findIndex(
        (endpoint) => endpoint.path.filePath === relativePath
      );

      console.log(`Removed: "${relativePath}"`);
      delete require.cache[filePath];

      loadedEndpoints = [
        ...loadedEndpoints.slice(0, index),
        ...loadedEndpoints.slice(index + 1),
      ];
    });

  console.log(`Haechi is rushing on ${config.address}:${config.port}`);
  console.log(
    `Document is available on ${config.address}:${config.port}/${config.swagger.path}`
  );

  http
    .createServer(async (req, res) => {
      let headerPot = config.cors
        ? {
          "Access-Control-Allow-Origin": config.cors,
        }
        : ({} as {});

      try {
        if (!req.url || !req.method)
          throw new RushError("Request is not valid");

        const url = new URL("http://localhost" + req.url);
        const query = Object.fromEntries(url.searchParams.entries());

        let matchedPath: RegExpMatchArray | null = null;

        const matchedEndpoint = loadedEndpoints.find(
          (handlers) => (matchedPath = url.pathname.match(handlers.path.regex))
        );
        if (!matchedEndpoint) throw new RushError("Cannot find endpoint");

        const handlerSlugLength = matchedEndpoint.path.slugs.length;

        if (
          (handlerSlugLength && !matchedPath) ||
          handlerSlugLength + 1 !== matchedPath!.length
        ) {
          throw new RushError("Bad slugs", 400);
        }

        const slugs = matchedEndpoint.path.slugs.reduce(
          (matched, slug, index) => ({
            ...matched,
            [slug]: matchedPath![index + 1]!,
          }),
          {} as Record<string, string>
        );

        const handler =
          matchedEndpoint.methods[req.method as Methods] ||
          matchedEndpoint.methods.DEFAULT;

        if (!handler)
          throw new RushError(
            `"${req.method
            }" is not allowed method. Avaliable methods are ${Object.keys(
              matchedEndpoint.methods
            ).join(", ")}`,
            405
          );

        if (handler.title === "Swagger Spec") {
          const result = await handler.action({
            headers: req.headers,
            slugs,
            setHeader(key, value) {
              headerPot = {
                ...headerPot,
                [key]: value,
              };
            },
            send(value) {
              sendResponse(value, res, headerPot);
            },
            body: loadedEndpoints,
            query,
          });

          sendResponse(result, res, headerPot);
        } else {
          const bodyData = await getBodyData(req);

          try {
            handler.body?.validate.parse(bodyData);
            handler.query?.validate.parse(query);

            const result = await handler.action({
              headers: req.headers,
              body: (handler.body?.validate &&
                (bodyData as z.infer<typeof handler.body.validate>))!,
              slugs,
              query,
              setHeader(key, value) {
                headerPot = {
                  ...headerPot,
                  [key]: value,
                };
              },
              send(value) {
                sendResponse(value, res, headerPot, {
                  isRaw: handler.response?.type === "raw",
                });
                headerPot = {};
              },
            });

            sendResponse(result, res, headerPot, {
              isRaw: handler.response?.type === "raw",
            });
          } catch (e) {
            if (e instanceof ZodError) {
              throw new RushError("Validation error occured", 400, {
                fields: e.errors,
              });
            } else throw e;
          }
        }

        res.end();
      } catch (e) {
        if (e instanceof RushError) {
          res.writeHead(e.code, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              message: e.message,
              metadata: e.metadata,
              code: e.code,
            })
          );
        } else if (e instanceof Error) {
          res.writeHead(500, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              message: e.message,
              code: 500,
            })
          );
        } else if (hasToString(e)) {
          res.writeHead(500, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              message: e.toString(),
              code: 500,
            })
          );
        } else {
          res.writeHead(500, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              message: "Something bad happened. But no message was presented.",
              code: 500,
            })
          );
        }
      }
    })
    .listen(_config.port);
};
