import { handler } from "../../handler";

export default handler({
  response: {
    type: "raw",
  },
  action({ send, setHeader }) {
    setHeader("Content-Type", "text/event-stream");
    setHeader("Cache-Control", "no-cache");
    setHeader("Connection", "keep-alive");

    send("\n");

    send("event: data\n");
    send("data: Initializing\n\n");

    send("event: data\n");
    send("data: Bye Bye\n\n");

    return "";
  },
});
