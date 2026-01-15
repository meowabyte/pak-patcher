import type { Action, Patch } from "../types"

import { readdir } from "fs/promises"
import { basename, join } from "path"
import { args, rl } from "../helper"
import { Reader, Writer } from "../pak"
import { META_FILE_NAME, type MetaFile } from "../pak/helper"


const PATCH_FILE_EXT = ".p.ts" as const

const patch = async () => {
    const patches = await readdir(join(import.meta.dir, "..", "patches"), { withFileTypes: true })
        .then(async d => {
            const paths = d.filter(f =>
                f.name.endsWith(PATCH_FILE_EXT) &&
                f.isFile()
            )

            return new Map(
                await Promise.all(
                    paths.map<Promise<[string, Patch]>>(async f =>
                        [
                            f.name.slice(0, -PATCH_FILE_EXT.length),
                            (await import(join(f.parentPath, f.name))).default
                        ]
                    )
                )
            )

        })

    const path = (args.arg?.[0] ?? await rl.question("pak file path (defaults to first found in cwd): ")) || undefined
    const distPath = (args.arg?.[1] ?? await rl.question("destination pak file path (defaults to 'PATCH_{original name}'): ")) || undefined

    const PROMPT = [
        "Pick patches:",
        ...patches.keys().map((k, i) => `${i + 1}) ${k}`),
        "(1 2 3 4^)"
    ].join("\n")

    let patchChoices: number[] | null = null;
    if (args.arg?.[2])
        patchChoices = args.arg[2].split(",")
            .map(s => parseInt(s) - 1)
            .filter(n => !isNaN(n) && n >= 0 && n < patches.size)

    while (patchChoices === null) {
        console.clear()
        patchChoices = await rl.question(`${PROMPT}\n\n> `)
            .then(a => {
                const formatted = a.split(" ")
                    .map(s => parseInt(s) - 1)
                    .filter(n => !isNaN(n) && n >= 0 && n < patches.size)
                return formatted.length > 0 ? formatted : null
            })

    }

    console.log("Extracting...")
    const reader = new Reader({ path })
    await reader.extract()

    const meta: MetaFile = await Bun.file(join(reader.distPath, META_FILE_NAME)).json(),
        typesMap = new Map(meta.fileTypeMap)

    console.log("Applying patches...")
    const patchNames = patches.keys().toArray()
    for (const patchId of patchChoices) {
        const patchName = patchNames[patchId]!,
            { id, onApply } = patches.get(patchName)!,
            type = typesMap.get(id) as string | null,
            resourcePath = join(reader.distPath, `${id}${typeof type === "string" ? `.${type}` : ""}`),
            resourceFile = Bun.file(resourcePath)

        if (!await resourceFile.exists()) {
            console.warn(`No path of resource "${id}" found! Skipping patch "${patchName}"`)
            continue;
        }

        console.log(`Applying "${patchName}"...`)
        await onApply(resourceFile)
    }

    console.log("Writing back...")
    const writer = new Writer()
    const fileName = basename(reader.path!)
    await writer.pack(join(process.cwd(), (distPath && distPath.endsWith(".pak")) ? distPath : `PATCH_${fileName}`))
    console.log("Done!")
}

export default {
    title: "Patch .pak file",
    description: "Patches .pak file using specified patches.",
    onAction: patch
} satisfies Action;