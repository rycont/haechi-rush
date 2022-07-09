import { readFile } from "fs/promises";
import { METHODS } from "http";
import path from "path";
import { Endpoint, Handler, Methods } from "../types";
import { parseEndpointPath } from "./parseEndpointPath";

const isScriptableContent = (filePath: string) =>
  [".ts", ".tsx", ".js", ".jsx", ".json"].some((ext) => filePath.endsWith(ext));

const keysToLowerCase = (obj: Record<string, unknown>) =>
  Object.entries(obj).reduce(
    (matched, [key, value]) => ({
      ...matched,
      [key.toUpperCase()]: value,
    }),
    {}
  );

export const pathToEndpoint = async (
  dirName: string,
  filePath: string
): Promise<Endpoint> => {
  const pathConfig = parseEndpointPath(
    path.relative(dirName, filePath).split(path.sep)
  );

  const content = isScriptableContent(filePath)
    ? require(filePath)
    : await readFile(filePath, "utf-8");

  if (
    typeof content === "object" &&
    (METHODS.some((method) => content[method]) || content.default)
  )
    return {
      methods: keysToLowerCase(content) as Record<"DEFAULT" | Methods, Handler>,
      path: pathConfig,
    };

  return {
    methods: {
      GET: {
        action() {
          return content;
        },
      },
    },
    path: pathConfig,
  };
};
