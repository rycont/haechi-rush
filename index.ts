import { rush } from "./rush";

rush(__dirname + "/src", {
  swagger: {
    path: "sw",
  },
  port: 5000,
  address: "127.0.0.1",
  cors: "*",
});
