// https://chromium.googlesource.com/chromium/src/tools/grit/+/8a23eae/grit/format/data_pack.py

import { createReadStream, createWriteStream, existsSync, statSync } from "fs"
import { join } from "path"
import { once } from "events"
import { env } from "process"
import { rm } from "fs/promises"
import { ALIAS_INDEX_SIZE, DEFAULT_EXTRACT_PATH, Encoding, HEADER_SIZE, META_FILE_NAME, RESOURCE_INDEX_SIZE, type MetaFile } from "./helper"
import { appendFile } from "fs/promises"

type WriterOptions = {
    /** Path of the extracted directory, defaults to the first one found in cwd */
    path?: string,
    /** Should be in debug mode? Defaults to state of `process.env.DEBUG` */
    debug?: boolean
}

export default class Writer {
    path: string = DEFAULT_EXTRACT_PATH;
    file?: Bun.BunFile;
    offset = 0;

    metaFile?: MetaFile;
    get metaFilePath() { return join(this.path, META_FILE_NAME) }

    debug: boolean;

    constructor(options?: WriterOptions) {
        if (options?.path) this.path = options.path
        this.debug = options?.debug ||
            env.DEBUG === "1" ||
            env.DEBUG === "on" ||
            env.DEBUG === "true"

        if (!existsSync(this.path)) throw new Error("No extraction path found!")

        this._debug(`Extracted Path: ${this.path}`)
    }

    private _debug(...msg: any) { if (this.debug) console.debug(...msg) }

    /**
     * Loads metadata of an extracted pak
     * @returns Parsed {@link MetaFile} 
     */
    private async loadMeta(): Promise<MetaFile> {
        if (this.metaFile) return this.metaFile;

        const file = Bun.file(this.metaFilePath)
        if (!await file.exists()) throw new Error("Couldn't find meta file of extracted pak!")

        return file.json()
    }

    /**
     * Writes header to pak file
    */
    private async prepareHeader(): Promise<Buffer> { // this 100% works, please don't touch
        if (!this.file || !this.metaFile) throw new Error("[meta]file not initialized")

        const buf = Buffer.allocUnsafe(HEADER_SIZE)
        
        let off = this.offset;
        off = buf.writeUInt32LE(5, off) // version - 5 - most recent one
        off = buf.writeUInt32LE(Encoding.UTF8, off) // encoding
        off = buf.writeUInt16LE(this.metaFile.resourceMap.length - 1, off) // resource count
        off = buf.writeUInt16LE(this.metaFile.aliasMap.length, off) // resource count

        this.offset = off;

        return buf;
    }

    /**
     * Writes maps to pak file based on metadata.  
     * You can get resource count from {@link Reader.readHeader()}
     */
    private async prepareMaps() {
        if (!this.file || !this.metaFile) throw new Error("[meta]file not initialized")

        const resourceMapBufSize = RESOURCE_INDEX_SIZE * this.metaFile.resourceMap.length,
            aliasMapBufSize = ALIAS_INDEX_SIZE * this.metaFile.aliasMap.length,
            resourceMapBuf = Buffer.allocUnsafe(resourceMapBufSize),
            aliasMapBuf = Buffer.allocUnsafe(aliasMapBufSize)

        // data offset calculation
        const dataInitOffset = this.offset + resourceMapBufSize + aliasMapBufSize
        let dataOffset = dataInitOffset

        // resources
        const resourceTypes = new Map(this.metaFile!.fileTypeMap)
        const resourceIds = this.metaFile.resourceMap
            .map(([id]) => id)
        
        const calculateResourceOffset = (i: number) => {
            if (i === 0) return dataOffset; // Don't calculate first offset

            const prevId = resourceIds[i - 1]!
            const prevType = resourceTypes.get(prevId) as string | null
            const path = join(this.path, `${prevId}${prevType ? `.${prevType}` : ""}`)
            
            return dataOffset = dataOffset + statSync(path).size
        }

        resourceIds.forEach((id, i) => {
            const idN = parseInt(id),
                fileOffset = calculateResourceOffset(i)
            
            let off = RESOURCE_INDEX_SIZE * i
            off = resourceMapBuf.writeUint16LE(idN, off)
            off = resourceMapBuf.writeUint32LE(fileOffset, off)
        })

        this.offset += resourceMapBufSize

        // aliases
        this.metaFile.aliasMap
            .forEach(([id, alias], i) => {
                let off = ALIAS_INDEX_SIZE * i
                off = aliasMapBuf.writeUint16LE(parseInt(id), off)
                off = aliasMapBuf.writeUint16LE(alias, off)
            })

        this.offset += aliasMapBufSize


        return {
            resourceIds, resourceTypes,
            buffer: Buffer.concat([ resourceMapBuf, aliasMapBuf ])
        }
    }

    /**
     * Pack extracted files to .pak in destination
     * @param distPath Destination path.
     */
    async pack(distPath: string) {
        if (!this.metaFile) this.metaFile = await this.loadMeta();

        // cleanup old pack
        await rm(distPath, { force: true, recursive: true })
        this.file = Bun.file(distPath)

        await appendFile(distPath, await this.prepareHeader())
        const { resourceIds, resourceTypes, buffer } = await this.prepareMaps()
        await appendFile(distPath, buffer)


        const w = createWriteStream(distPath, { autoClose: false, start: this.offset, flags: "a+" })
        for (const id of resourceIds) {
            if (id === "0") continue; // indicator id - ignore

            const type = resourceTypes.get(id) as string | null;
            const path = join(this.path, `${id}${typeof type === "string" ? `.${type}` : ""}`)

            await once(createReadStream(path).pipe(w, { end: false }), "unpipe")
            this.offset += Bun.file(path).size
        }

        w.close()
    }
}