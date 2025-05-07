import type { CollectionEntry } from "astro:content";

function throttle<T extends (...args: unknown[]) => void>(
    func: T,
    interval: number
): T {
    let lastTime = 0;
    return function (this: void, ...args: Parameters<T>) {
        const now = Date.now();

        if (now - lastTime >= interval) {
            func.apply(this, args);
            lastTime = now;
        }
    } as T;
}

function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let timer: ReturnType<typeof setTimeout> | null = null;

    return function (this: void, ...args: Parameters<T>) {
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    } as T;
}



function sortByPostDate(list: CollectionEntry<"drawingImages" | "posts">[], type: "ascending" | "descending" = "descending") {
    if (type == "ascending") {
        return list.sort((a, b) => new Date(a.data.createdAt).valueOf() - new Date(b.data.createdAt).valueOf());
    }
    if (type == "descending") {
        return list.sort((a, b) => new Date(b.data.createdAt).valueOf() - new Date(a.data.createdAt).valueOf());
    }
}







export { throttle, debounce, sortByPostDate };