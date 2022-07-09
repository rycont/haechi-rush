import { handler } from "../../rush"

export default handler({
    title: "What",
    description: "An example endpoin that returns 'What'",
    async action() {
        return "What"
    }
})
