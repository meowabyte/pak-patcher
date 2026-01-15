import type { Action } from "../types"

import { args, rl } from "../helper"
import { Reader } from "../pak"


const extract = async () => {
    const path = (args.arg?.[0] ?? await rl.question("pak file path (defaults to first found in cwd): ")) || undefined
    const distPath = (args.arg?.[1] ?? await rl.question("extraction path (defaults to \"extr\" in cwd): ")) || undefined

    console.log("Extracting...")
    const reader = new Reader({ path })
    await reader.extract({ distPath })
    console.log("Done!")
}

export default {
    title: "Extract.pak",
    description: "Analyzes and then extracts .pak file",
    onAction: extract
} satisfies Action;