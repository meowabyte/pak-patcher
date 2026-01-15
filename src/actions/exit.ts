import type { Action } from "../types";

import { exit } from "process"

export default {
    title: "Exit",
    onAction: () => exit(0)
} satisfies Action;