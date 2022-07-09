import { z, ZodObject, ZodRawShape, ZodType } from "zod";

export type RushHeader = Record<string, string | string[] | undefined>;

// export interface HandlerProps<T extends ZodRawShape = any> {
//     title?: string
//     description?: string
//     responseSchema?: ZodObject<T>
//     example?: {
//         response?: z.infer<ZodObject<T>>
//     }
//     action(data: {
//         headers: RushHeader
//         setHeader: (key: string, value: string) => void
//         slugs: Record<string, string>
//         send: (value: any) => void
//     }): unknown
// }

export interface Handler<
  RequestType extends ZodType = any,
  ResponseType extends ZodType = any,
  QueryType extends ZodObject<any> = any
> {
  title?: string;
  description?: string;
  body?: {
    validate?: RequestType;
    example?: z.infer<RequestType>;
  };
  response?: {
    scheme?: ResponseType;
    example?: z.infer<ResponseType>;
  };
  query?: {
    validate?: QueryType;
    example?: z.infer<QueryType>;
  };
  action(data: {
    body: z.infer<RequestType>;
    slugs: Record<string, string>;
    setHeader: (key: string, value: string) => void;
    headers: RushHeader;
    query: z.infer<QueryType>;
    send: (
      value:
        | Promise<z.infer<ResponseType>>
        | z.infer<ResponseType>
        | null
        | undefined
    ) => void;
  }): Promise<z.infer<ResponseType>> | z.infer<ResponseType> | null | undefined;
}

export interface PathProps {
  endpointPath: string[];
  regex: RegExp;
  slugs: string[];
  filePath: string;
}

export interface Endpoint<T extends ZodType = any> {
  path: PathProps;
  methods: Record<string, Handler<T>>;
}

export const METHODS = ["POST", "GET", "PUT", "PATCH", "DELETE"] as const;

export type Methods = typeof METHODS[number];

export interface RushConfig {
  swagger: Partial<{
    disabled: boolean;
    path: string;
  }>;
  port: number;
  address: string;
  cors: "*" | string;
}
