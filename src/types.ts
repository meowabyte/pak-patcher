import type { MetaFile } from "./pak/helper"

type MaybePromise<T = void> = T | Promise<T>

export type Patch = {
    id: `${number}`,
    onApply: (buf: Bun.FileBlob) => MaybePromise<void>
}

export type Action = {
    title: string,
    description?: string,
    onAction: () => MaybePromise
}