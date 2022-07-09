import { readFile } from "fs/promises";
import { handler } from "./handler";
import { parseEndpointPath } from "./utils/parseEndpointPath";
import { generateSchema } from "@anatine/zod-openapi";
import immer from "immer";
import { Handler, Endpoint, METHODS, RushConfig } from "./types";

interface SwaggerPath {
  summary: string;
  description: string;
  tags?: string[];
  parameters?: {
    in: string;
    schema: ReturnType<typeof generateSchema>;
    example?: Record<string, any>;
    examples?: Record<string, any>;
  }[];
  responses: {
    200: {};
  };
}

const handlerToDocument = (
  handler: Handler,
  endpoint: Endpoint
): SwaggerPath => {
  return {
    summary: handler.title || endpoint.path.filePath,
    description: handler.description || "",
    parameters: handler.body
      ? [
          {
            in: "body",
            schema: {
              ...(handler.body?.validate &&
                generateSchema(handler.body.validate, true)),
              example: handler.body.example,
            },
          },
        ]
      : handler.query?.validate
      ? Object.entries(generateSchema(handler.query?.validate).properties).map(
          ([key, value]) => ({
            in: "query",
            name: key,
            schema: value,
          })
        )
      : [],
    responses: {
      "200": {
        examples: {
          "application/json": handler.response?.example,
        },
        schema:
          handler.response?.scheme &&
          generateSchema(handler.response?.scheme, true),
      },
    },
    tags: endpoint.path.endpointPath.slice(0, 1),
  };
};

export const swaggerGenerator = (config: RushConfig) => ({
  methods: {
    GET: handler({
      title: "Swagger Spec",
      action({ body: _body }) {
        const body = _body as Endpoint[];
        const paths = body.reduce(
          (match, endpoint) => ({
            ...match,
            ["/" + endpoint.path.endpointPath.join("/")]: {
              ...(endpoint.methods.DEFAULT &&
                METHODS.reduce((matched, current) => {
                  return immer(matched, (draft) => {
                    draft[current.toLowerCase()] = handlerToDocument(
                      endpoint.methods.DEFAULT,
                      endpoint
                    );
                  });
                }, {} as Record<string, SwaggerPath>)),
              ...METHODS.reduce((matched, current) => {
                if (!(current in endpoint.methods)) return matched;

                return immer(matched, (draft) => {
                  draft[current.toLowerCase()] = handlerToDocument(
                    endpoint.methods[current],
                    endpoint
                  );
                });
              }, {} as Record<string, SwaggerPath>),
            },
          }),
          {}
        );

        return {
          swagger: "2.0",
          info: {
            version: "1.0.0",
            title: "Haechi Rush API",
          },
          host: `http://${config.address}:${config.port}/${config.swagger
            .path!}`,
          basePath: "/",
          paths,
        };
      },
    }),
  },
  path: parseEndpointPath([config.swagger.path!, "spec"]),
});

export const swaggerFrontendEndpoint = (config: RushConfig) => ({
  methods: {
    GET: handler({
      title: "Swagger Document",
      description: "serving swagger documentation page",
      async action({ setHeader }) {
        const swaggerTemplate = await readFile("./swagger.html", "utf8");

        setHeader("Content-Type", "text/html");

        return swaggerTemplate.replace(
          "%SWAGGER%",
          `http://${config.address}:${config.port}/${config.swagger.path!}/spec`
        );
      },
    }),
  },
  path: parseEndpointPath([config.swagger.path!]),
});
