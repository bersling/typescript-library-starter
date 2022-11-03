import Decimal from "decimal.js";
import { BigNumber } from "ethers";

import _ from 'lodash';

class Checks {

    static assert(arg0: boolean, arg1: string) {
        if (!arg0) {
            throw new Error(arg1);
        }
    }

    static shouldBeOnlyLetters(value:string) {
        if (!/^[a-zA-Z]+$/.test(value)) {
            throw new Error(`${value} should be only letters`);
        }
        return value;
    }

    static shouldBeZero(number: number, message?: string) {
        if (number !== 0) {
            throw new Error(`${message} should be zero`);
        }
        return number;
    }

    static shouldBeString(value:any) {
        if (typeof value !== 'string') {
            throw new Error(`Value should be string`);
        }
        return value;
    }

    static shouldBeNonBlankString(value: any): string {
        if (Checks.shouldBeString(value).trim() === '') {
            throw new Error(`Symbol should be non-blank string`);
        }

        return value;
    }

    static isBigNumberWithinRange(number:BigNumber, range: { min: number; max: number; }) : boolean {
        return number.lt(range.min) ? false : !number.gt(range.max);
    }

    static isNumberWithinRange(number:number, range: { min: number; max: number; }) : boolean {
        return number < range.min ? false : number <= range.max;
    }

    static shouldBeNativeNumberWithinRange(number: number, range: { min: number; max: number; }, message?:string) : number {
        if (Checks.isNumberWithinRange(number, range)) {
            return number;
        }else{
            throw new Error(message);
        }
    }

    // TODO: add unit tests
    static mutuallyExclusive(array:Array<any>, message:string = `should be mutually exclusive`) {
        if (array.filter(v => !!v).length != 1) {
            throw new Error(message);
        }
    }

    static checkExists<T>(value: any, name: string): T {
        if (value === undefined || value === null) {
            throw new Error(`${name} is required`);
        }
        return value;
    }

    static checkInteger<T>(value: any, name?: string): T {
        if (!Number.isInteger(value)) {
            throw new Error(`${name} should be Integer`);
        }
        return value;
    }

    // TODO: test this assumption
    static checkNumericString(string:string) : string {
        // if it crashes, it's bad
        new Decimal(string);
        return string
    }

    static shouldBeFinite(numberOrString:number|string, message?:string) {
        if (_.isString(numberOrString) && !_.isFinite(Number(numberOrString))) {
            throw new Error(`${numberOrString} should be finite`);
        }
        if (_.isNumber(numberOrString) && !_.isFinite(numberOrString)) {
            throw new Error(`${numberOrString} should be finite`);
        }
        return numberOrString;
    }

    // static shouldBeInteger(number:string, message:string) {
    //     if (!Number.isInteger(Number(number))) {
    //         throw new Error(`${number} should be Integer`);
    //     }
    // }

    // static shouldBeFloatString(string:string, message?:string) : number {
    //     if (!Types.isFloatString(string)) {
    //         throw new Error(`${string} should be float string`);
    //     }
    //     return parseFloat(string);
    // }

    static shouldBeNumberString(string:string, message?:string) {
        if (!/^\d+(\.?\d+)?$/.test(string)) {
            throw new Error(`${string} should be numeric string: ${message}`);
        }
        return string;
    }

}

export {Checks}
export default Checks;
