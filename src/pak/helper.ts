import { join } from "path";

export type MetaFile = {
    resourceMap: [string, number][],
    aliasMap: [string, number][],
    fileTypeMap: [string, string | null][]
}

export enum Encoding {
    BINARY,
    UTF8,
    UTF16
}

export const DEFAULT_EXTRACT_PATH = join(process.cwd(), "extr");
export const META_FILE_NAME = "__meta.json"

export const HEADER_SIZE = 4 + 4 + 2 + 2 // [version, encoding, resources, aliases]
export const RESOURCE_INDEX_SIZE = 2 + 4 // [id, offset]
export const ALIAS_INDEX_SIZE = 2 + 2 // [id, alias]


export const chunkForEach = async <T, R>(arr: T[], n: number, func: (item: T, index: number) => (R | Promise<R>)) => {
    let chunk: T[] = []
    const chunks = arr.reduce<T[][]>((newArr, v, i) => {
        chunk.push(v)
        if (chunk.length >= n || i === arr.length - 1) {
            newArr.push(chunk)
            chunk = []
        }
        return newArr
    }, [])

    let i = 0;
    const results: R[] = []
    for (const c of chunks) {
        i = results.push(
            ...await Promise.all(c.map((item, ci) => func(item, ci + i)))
        )
    }
    
    return results;
}