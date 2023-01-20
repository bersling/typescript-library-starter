import _ from "lodash"

export const orThrow = <T>(value: T|undefined, message = 'Unexpected error'): T => {
    if (_.isNil(value) || _.isNaN(value)) throw new Error(message)
    return value
}
