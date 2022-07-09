import path from "path"

export const parseEndpointPath = (filePath: string[]) => {
    const {
        endpointPath,
        regexString,
        slugs
    } = filePath.reduce((matched, currentPath) => {
        const pathname = currentPath.includes(".") ?
            path.parse(currentPath).name :
            currentPath

        if (pathname.startsWith("#")) {
            const slug = pathname.slice(1)
            return {
                ...matched,
                regexString: matched.regexString + "\/(.*?)",
                slugs: [...matched.slugs, slug],
                endpointPath: [...matched.endpointPath, pathname]
            }
        }

        return {
            ...matched,
            regexString: matched.regexString + "\/" + pathname,
            endpointPath: [...matched.endpointPath, pathname]
        }
    }, {
        regexString: "",
        endpointPath: [] as string[],
        slugs: [] as string[]
    })

    return {
        endpointPath,
        regex: new RegExp(regexString + "$"),
        slugs,
        filePath: filePath.join(path.sep)
    }
}