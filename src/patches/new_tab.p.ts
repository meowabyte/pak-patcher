import type { Patch } from "../types";
import { join } from "path"
import cssPlugin from "./new_tab/cssplugin";

// TODO: resource searching by code
export default {
    id: "29719", // New Tab Bundle file
    async onApply(file) {
        if (file.type !== "application/gzip") return console.warn("Module file doesn't seem to be valid. Skipping")

        const content = Bun.gunzipSync(await file.arrayBuffer())

        const injectCode = await Bun.build({
            entrypoints: [ join(import.meta.dir, "new_tab", "contents", "index.ts") ],
            target: "browser",
            minify: true,
            format: "iife",
            plugins: [ cssPlugin ]
        }).then(r => r.outputs[0]!.text())

        const finalBuf = Buffer.concat([
            Buffer.from(injectCode, "utf-8"),
            content
        ]);

        await file.write(Bun.gzipSync(finalBuf))
    },
} satisfies Patch