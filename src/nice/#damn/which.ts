import { handler } from "../../../rush";

export default handler({
  title: "Damn",
  description: "An example endpoin that returns 'Damn'",
  async action({ slugs }) {
    return {
      message: "Damn" + slugs.damn,
    };
  },
});
