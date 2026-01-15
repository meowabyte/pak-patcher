import type { BunPlugin } from "bun"
import { readFile } from "fs/promises"
import { transform } from "lightningcss"

export default {
    name: "cssMinify",
    target: "browser",
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async ({ path: p }) => {
            const { code } = transform({
                code: await readFile(p),
                filename: "",
                minify: true,
            })

            return { loader: "text", contents: code }
        })
    }
} satisfies BunPlugin