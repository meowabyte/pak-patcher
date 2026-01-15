import { stdin, stdout } from "process"
import { createInterface } from "readline/promises"
import { parseArgs } from "util"

export const rl = createInterface(stdin, stdout)

export const { values: args } = parseArgs({
    args: Bun.argv,
    options: {
        action: {
            type: "string",
            short: "e"
        },
        arg: {
            type: "string",
            multiple: true,
            short: "a"
        }
    },
    allowPositionals: true
})