import { ZodObject, ZodRawShape, ZodType } from "zod";
import { Handler } from "./types";

export const handler = <
  RequestType extends ZodType,
  ResponseType extends ZodType,
  QueryType extends ZodObject<any>
>(
  params: Handler<RequestType, ResponseType, QueryType>
) => params;
