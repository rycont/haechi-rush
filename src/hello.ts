import { z } from "zod";
import { handler } from "../rush";

export const GET = handler({
  title: "Say Hello World",
  description: "An example endpoin that returns 'Hello World!'",
  query: {
    validate: z.object({
      x: z.string({
        description: "아니그게말이죠",
      }),
      y: z.string(),
    }),
    example: {
      x: "10",
      y: "20",
    },
  },
  response: {
    scheme: z.number().min(10),
    example: 20,
  },
  async action({ query: { x, y } }) {
    return +x + +y;
  },
});
