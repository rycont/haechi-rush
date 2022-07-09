export class RushError extends Error {
    code: number
    metadata: any

    constructor(message: string, code: number = 500, metadata?: any) {
        super(message)
        this.code = code
        this.metadata = metadata
    }
}