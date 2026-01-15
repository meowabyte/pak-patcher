import getActions from "./actions"
import { args, rl } from "./helper"


const actions = await getActions()

const PROMPT = [
    "Select action:",
    ...actions.map(({ title, description }, i) => `${i + 1}) ${title}${description ? `- ${description}` : ""}`)
].join("\n")


let answer: number | null = null;
if (args.action) {
    answer = parseInt(args.action) - 1
    if (isNaN(answer)) throw new Error("Invalid action number!")
}
while (
    answer === null ||
    isNaN(answer) ||
    answer < 0 ||
    answer >= actions.length
) {
    console.clear()
    answer = parseInt(await rl.question(`${PROMPT}\n\n> `)) - 1
}

const { onAction } = actions[answer]!;
await onAction()


rl.close()