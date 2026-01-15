// Optimized CSS code export
declare module "*.css" {
    const style: string;
    export default style;
}

// Chrome internal API
declare namespace chrome {
    namespace bookmarks {
        type Bookmark = {
            dateAdded: number,
            folderType?: string,
            id: string,
            index: number,
            parentId: number,
            syncing: boolean,
            title: string,
            url?: string
        }

        type BookmarkTree = Bookmark & { children: (Bookmark | BookmarkSubtree)[] }

        const get: (ids: string | string[], cb: (bookmarks: Bookmark[]) => void) => void;
        const getChildren: (id: string, cb: (bookmarks: Bookmark[]) => void) => void;
        const getSubTree: (id: string, cb: (bookmarks: BookmarkTree[]) => void) => void;
        const getTree: (cb: (bookmarks: BookmarkTree[]) => void) => void;
        const getRecent: (count: number, cb: (bookmarks: Bookmark[]) => void) => void;
        const create: (bookmark: Bookmark, cb?: () => void) => void;
        const move: (id: string, destination: object, cb?: () => void) => void;
        // TOOD: rewrite rest of chrome internal API
    }
}