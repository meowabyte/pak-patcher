export const newStyle = (style: string) => {
    const doc: HTMLStyleElement = document.querySelector("style[data-meow]") ?? (() => {
        const el = document.createElement("style")
        el.dataset["meow"] = ""
        document.head.prepend(el)
        return el
    })()

    doc.textContent += `\n${style}`.trim()
}