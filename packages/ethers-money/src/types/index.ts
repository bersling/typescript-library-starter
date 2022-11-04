import {isPromise} from "util/types";

export {Numbers} from "./Numbers"

//region Lazy
export type Lazy<T> = T | Promise<T>;

/**
 * if lazy is a promise, then executes async (".then")
 * if lazy is an object, then executes sync (immediately)
 *
 * @param lazy
 * @param fn
 */
export function laze<T>(lazy: Lazy<T>, fn: (item: T) => Lazy<T>): Lazy<T> {
    if (isPromise(lazy)) {
        return lazy.then((item) => fn(item))
    } else {
        return fn(lazy as T)
    }
}
//endregion
