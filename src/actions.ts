import type { Action } from "./types";

import { readdir } from "fs/promises";
import { join } from "path";


const getActions = async () => {
    const actions = await readdir(join(import.meta.dir, "actions"), { withFileTypes: true })
        .then(d =>
            Promise.all(
                d.filter(f => f.name.endsWith(".ts") && f.isFile())
                .map<Promise<Action>>(async f =>
                    (await import(join(f.parentPath, f.name))).default
                )
            )
        )

    return actions;
}

export default getActions;