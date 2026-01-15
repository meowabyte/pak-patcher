import type { Action } from "../types"

import { args, rl } from "../helper"
import { Writer } from "../pak"


const pack = async () => {
    const path = (args.arg?.[0] ?? await rl.question("extracted pak file path (defaults to first found in cwd): ")) || undefined
    const distPath = args.arg?.[1] ?? await rl.question("final pak path: ")
    if (!distPath.endsWith(".pak")) throw new Error("File must end with .pak!")

    console.log("Packing...")
    const writer = new Writer({ path })
    await writer.pack(distPath)
    console.log("Done!")
}

export default {
    title: "Pack extracted .pak",
    description: "Packs script extracted .pak file back to it's original form",
    onAction: pack
} satisfies Action;