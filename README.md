# @haechi/rush: Tactful Backend framework

- Just call it "Rush"

Focus to writing logics. Rush will do every nuisance thing for you.

## Features

- 🔍 NextJS like directory based routing
- 🔥 Hot Reloading per endpoint
- 📜 Generate document automatically with Swagger
- 🦾 Fully typed & validated request body, url query. Works with Zod

## Get started with minimal example!

1. Install library

```
yarn add @haechi/rush
```

2. Create a directory "src" in the root of the project.
3. Create first endpointfile "hello.ts" in the directory "src"

```typescript
// /src/hello.ts

import { z } from "zod";
import { handler } from "../rush";

export default handler({
  async action(props) {
    return `Hi, I'm running!`;
  },
});
```

4. Create starting point file "index.ts" in the root of the project

```typescript
// /index.ts

import { rush } from "./rush";

rush(__dirname + "/src");
```

5. It's now ready to rush!

```
yarn ts-node ./index.ts
```

## Full example of endpoint

```typescript
import { z } from "zod";
import { handler } from "../rush";

export const get = handler({
  title: "Say Hello",
  description: "You can be greeted by using this endpoint",
  query: {
    validate: z.object({
      name: z.string().min(2),
    }),
    example: {
      name: "Haechi",
    },
  },
  response: {
    scheme: z.string(),
    example: "Hi, Haechi!",
  },
  async action(props) {
    return `Hi, ${props.query.name}`;
  },
});

export const post = handler({
  title: "Set greeting message",
  description: "You can set greeting message by using this endpoint",
  body: {
    validate: z.object({
      prefix: z.string(),
    }),
    example: {
      prefix: "Hello, ",
    },
  },
  response: {
    scheme: z.object({
      message: z.string(),
      status: z.number(),
    }),
    example: "But nothing has changed",
  },
  async action(props) {
    if (!props.header.Authorization) {
      console.log("Coward is trying to change greeting message 🤣");
      props.setHeader("You", "Coward");
    } else {
      console.log("Somebody is trying to change greeting message");
    }

    return {
      message: `But nothing has changed`,
      status: -300,
    };
  },
});
```

## Auto Documentation

Generated document is avaliable on "/docs" endpoint. If you want to use /docs endpoint, you can change document path. In index.ts,

```typescript
rush(__dirname + "/src", {
  swagger: {
    path: "sw",
  },
});
```

Following above, you can change swagger serving path.

## Additional Features

- You can simply set CORS header with config

```typescript
rush(__dirname + "/src", {
  cors: "https://rycont.ninja",
});
```
