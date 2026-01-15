// https://chromium.googlesource.com/chromium/src/tools/grit/+/8a23eae/grit/format/data_pack.py

import { existsSync } from "fs"
import { join } from "path"
import { fileTypeFromBuffer } from "file-type"
import { rm } from "fs/promises"
import { mkdir } from "fs/promises"
import { ALIAS_INDEX_SIZE, chunkForEach, DEFAULT_EXTRACT_PATH, Encoding, HEADER_SIZE, META_FILE_NAME, RESOURCE_INDEX_SIZE, type MetaFile } from "./helper"
import { readdir } from "fs/promises"
import { writeFile } from "fs/promises"
import { cwd, env } from "process"

type ReaderOptions = {
    /** Path of the pak file, defaults to the first one found in cwd */
    path?: string,
    /** Should be in debug mode? Defaults to state of `process.env.DEBUG` */
    debug?: boolean
}

type ExtractOptions = {
    /** Destination path of extracted content, defaults to {@link Reader.distPath} */
    distPath?: string,
}

export default class Reader {
    path?: string;
    file?: Bun.BunFile;
    distPath: string = DEFAULT_EXTRACT_PATH;

    debug: boolean;

    constructor(options?: ReaderOptions) {
        if (options?.path) this.path = options.path;
        this.debug = options?.debug ||
            env.DEBUG === "1" ||
            env.DEBUG === "on" ||
            env.DEBUG === "true"
    }

    private _debug(...msg: any) { if (this.debug) console.debug(...msg) }

    /**
     * Returns header metadata of the file
    */
    private async readHeader(): Promise<{
        /** Version of the pak API */
        version: number;
        /** Encoding that this pak might contain */
        encoding: Encoding;
        /** Number of resources */
        resourceCount: number;
        /** Number of aliases */
        aliasCount: number;
    }> {
        if (!this.file) throw new Error("file not initialized")

        const header = Buffer.from(
            await this.file!.slice(0, HEADER_SIZE).arrayBuffer()
        )

        const version: number = header.readUInt32LE(0) // version
        if (version !== 5) throw new Error("only .pak v5 currently supported")

        const encoding = header.readUInt32LE(4), // encoding
            resourceCount = header.readUint16LE(8), // resourceCount
            aliasCount = header.readUint16LE(10) // aliasCount
            
        this._debug({ version, encoding, resourceCount, aliasCount })
        return { version, encoding, resourceCount, aliasCount }
    }

    /**
     * Reads maps from file based on it's count.  
     * You can get resource count from {@link Reader.readHeader()}
     */
    private async readMaps({ resourceCount, aliasCount }: { resourceCount: number, aliasCount: number }): Promise<{
        /** Resource map containing [id, offsetOfResource] */
        resourceMap: MetaFile["resourceMap"];
        /** Alias map containing [id, aliasOfResource] */
        aliasMap: MetaFile["aliasMap"];
    }> {
        if (!this.file) throw new Error("file not initialized")

        let offset = HEADER_SIZE;

        // resources
        const resourceMapBufSize = RESOURCE_INDEX_SIZE * (resourceCount + 1),
            resourceMapBuf = Buffer.from(
                await this.file!.slice(offset, offset + resourceMapBufSize).arrayBuffer()
            )

        offset += resourceMapBufSize

        const resourceMap: MetaFile["resourceMap"] = Array.from(
            { length: resourceCount + 1 },
            (_, i) => {
                const off = RESOURCE_INDEX_SIZE * i,
                    id = resourceMapBuf.readUint16LE(off),
                    offset = resourceMapBuf.readUint32LE(off + 2)
        
                return [ String(id), offset ]
            }
        )

        // aliases
        const aliasMapBufSize = ALIAS_INDEX_SIZE * aliasCount,
            aliasMapBuf = Buffer.from(
                await this.file!.slice(offset, offset + aliasMapBufSize).arrayBuffer()
            )
        offset += aliasMapBufSize

        const aliasMap: MetaFile["aliasMap"] = Array.from(
            { length: aliasCount },
            (_, i) => {
                const off = ALIAS_INDEX_SIZE * i,
                    id = aliasMapBuf.readUint16LE(off),
                    index = aliasMapBuf.readUint16LE(off + 2)

                return [ String(id), index ]
            }
        )

        return { resourceMap, aliasMap }
    }

    /**
     * Finds .pak file if {@link Reader.path} hasn't been set
     * @returns Path of the .pak file
     */
    private async findPak(): Promise<string> {
        if (this.path && existsSync(this.path)) return this.path;

        const path = await readdir(cwd())
            .then(d => d.find(n => n.endsWith(".pak")))

        if (!path) throw new Error("No pak files provided/found!")
        this._debug(`Found "${path}"`)

        return path
    }

    /**
     * Extracts file from path to destination
     * @param distPath Destination path. Defaults to {@link Reader.distPath}
     */
    async extract(options?: ExtractOptions) {
        if (!this.path) this.path = await this.findPak();
        if (options?.distPath) this.distPath = options.distPath;

        // cleanup old extraction
        const cleanupPromise = rm(this.distPath, { force: true, recursive: true })
            .then(() =>
                mkdir(this.distPath, { recursive: true })
            )

        this.file = Bun.file(this.path)
        if (!await this.file.exists()) throw new Error("The file doesn't exist!")

        const { resourceCount, aliasCount } = await this.readHeader();
        const { resourceMap, aliasMap } = await this.readMaps({ resourceCount, aliasCount })
        
        
        await cleanupPromise // Wait for cleanup to end before starting extraction
        
        // resource extracting
        const fileTypeMap: MetaFile["fileTypeMap"] =
        await chunkForEach(
            Array.from({ length: resourceCount }),
            10,
            async (_, i) => {
                const [id, offset] = resourceMap[i]!,
                    extractPath = join(this.distPath, String(id)),
                    size = resourceMap[i + 1]![1] - offset                    

                const buf = await this.file!.slice(offset, offset + size).arrayBuffer()
                const type = await fileTypeFromBuffer(buf)
                await Bun.write(
                    `${extractPath}${type?.ext ? `.${type.ext}` : ""}`,
                    buf
                )

                return [
                    id,
                    typeof type?.ext === "string" ? type.ext : null
                ]
            }
        )

        // write meta to file
        await writeFile(
            join(this.distPath, META_FILE_NAME),
            JSON.stringify({ resourceMap, aliasMap, fileTypeMap })
        )
    }
}