import css from "./style.css"
import ascii from "./ascii.txt"

import { newStyle } from "./helper"


newStyle(css)

const lines = "\n".repeat(5)
console.clear()
console.error(`${lines}${ascii}\n\nLoaded patched new tab!${lines}`)

