export default class Errors {

    private constructor() {

    }

    static throwNotSure<T>(value: any, message?: string): T {
        throw new Error(`not sure: ${value} (message: ${message})`);
    }

    static unreachable(message?: string) {
        throw new Error('Method not reachable: ' + message);
    }

    static throwNotImplemented(message: string = 'Method not implemented.') {
        throw new Error(message);
    }

    static throw(message: string) {
        throw new Error(message);
    }

}

export {Errors}
