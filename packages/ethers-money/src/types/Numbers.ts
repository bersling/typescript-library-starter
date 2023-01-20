import _ from 'lodash'
import { BigNumber, BigNumberish, FixedNumber } from "ethers";
import { Decimal } from "decimal.js";
import { FixedFormat } from "@ethersproject/bignumber";
import {RoundingMode} from "../utils/Math";

import Rounding = Decimal.Rounding

import Checks from "../utils/Checks";
import Errors from "../utils/Errors";

export type NativeNumberLike = number | string;
export type BigNumberLike = NativeNumberLike | BigNumber | BigNumberish;
export type NumberLike = FixedNumber | NativeNumberLike | Decimal
export type NumberRange = { min: number, max: number }

export enum NumberType {
    FLOAT = 'float',
    INTEGER = 'integer',
    BIG_NUMBER = 'bigNumber',
}

//region class SafetyBounds
export type SafetyBounds = {
    type: NumberType;
    range: NumberRange;
}
//endregion

//region class SafeNumber<T extends NumberLike>
class SafeNumber<T extends NumberLike> {

    readonly bounds: SafetyBounds;
    readonly value: T;

    constructor(value: T, {type, range}: SafetyBounds) {
        // TODO: the caller should have done these checks? (type converts?)
        this.value = value;
        this.bounds = {type, range};

        // TODO: check this....
        // Checks.assert(this.bounds.isCompatibleValue(value), 'value is not compatible with bounds');
        Numbers.shouldBeWithinRange(this.value, this.bounds.range);
    }

    static of<T extends NumberLike>(value: T, bounds: SafetyBounds) {
        // TODO: check this shit
        return new SafeNumber<T>(value, bounds);
    }
}

//endregion

const DEFAULT_FIXED_NUMBER_FORMAT = FixedFormat.from('fixed128x18');

const DEFAULT_ROUNDOPS = {
    decimals: DEFAULT_FIXED_NUMBER_FORMAT.decimals,
    rounding: RoundingMode.UNNECESSARY
};

const DEFAULT_NUMOPTS = {
    decimals: DEFAULT_ROUNDOPS.decimals,
    rounding: DEFAULT_ROUNDOPS.rounding,
    fmt: DEFAULT_FIXED_NUMBER_FORMAT
}

//region export default class Numbers
export default class Numbers {

    static DEFAULT_FIXED_NUMBER_FORMAT = DEFAULT_FIXED_NUMBER_FORMAT;
    static DEFAULT_ROUNDOPS = DEFAULT_ROUNDOPS;
    static DEF_NUMOPTS = DEFAULT_NUMOPTS;

    ////////////////////////////////////////////////////////////
    // DECIMAL / FIXED NUMBER
    static decimalToFixedNumber(
        dec: Decimal,
        {
            decimals = DEFAULT_ROUNDOPS.decimals,
            rounding = DEFAULT_ROUNDOPS.rounding,
            fmt = DEFAULT_FIXED_NUMBER_FORMAT
        }: { decimals?: number, rounding?: RoundingMode, fmt: FixedFormat }): FixedNumber {
        return this.toFixedNumber(
            this.toRoundedDecimalPlaces(
                dec,
                {decimals, rounding}
            ),
            fmt
        );
    }

    static toTruncatedDecimalPlaces(decimal:Decimal, decimals: number): string {
        const str = decimal.toFixed(decimals * 2)
        const dot = str.indexOf('.')
        return str.substring(0, dot) + str.substring(dot, dot + decimals + 1)
    }

    static toAtLeastDecimalPlaces(decimal: Decimal, decimals: number): string {
        if (decimal.decimalPlaces() < decimals)
            return this.toRoundedDecimalPlaces(decimal, {decimals});
        return decimal.toString();
    }

    static toRoundedDecimalPlaces(decimal: Decimal, {
        decimals = DEFAULT_ROUNDOPS.decimals,
        rounding = DEFAULT_ROUNDOPS.rounding
    }: { decimals: number, rounding?: RoundingMode }): string {
        if (rounding === RoundingMode.TRUNCATE) {
            return this.toTruncatedDecimalPlaces(
                decimal,
                decimals);
        } else if (rounding === RoundingMode.UNNECESSARY) {
            // detect if we need to round
            if (decimal.decimalPlaces() > decimals)
                throw new Error(`Rounding would be necessary but RoundingMode.UNNECESSARY was chosen (decimal places are too high: ${decimal.toString()} for ${decimals})`);
            if (decimal.decimalPlaces() < decimals)
                return decimal.toFixed(decimals);
            if (decimal.decimalPlaces() === decimals)
                return decimal.toString();
        }

        if (decimal.decimalPlaces() > decimals)
            return decimal.toDecimalPlaces(decimals, rounding /* "Rounding" */ as Rounding).toString();
        if (decimal.decimalPlaces() < decimals)
            return decimal.toFixed(decimals);
        if (decimal.decimalPlaces() === decimals)
            return decimal.toString();

        throw new Error(`Unexpected decimal places: ${decimal.toString()}`);
    }

    ////////////////////////////////////////////////////////////
    static isNativeNumber(value: any): boolean {
        return typeof value === 'number'; //|| value instanceof BigNumber;
    }

    ////////////////////////////////////////////////////////////

    static isFiniteNativeNumber(value: any): boolean {
        return _.isNumber(value) && _.isFinite(value);
    }

    static shouldBeWithinRange(value: NumberLike, {min, max}: NumberRange, message?: string) {
        // make sure the value is within the bounds
        Checks.assert(value >= min, `${value} must be greater than or equal to ${min}: ${message}`);
        Checks.assert(value <= max, `${value} must be less than or equal to ${max}: ${message}`);
    }

    static toNativeNumber(numberLike: NumberLike): number {
        if (typeof numberLike === 'number') {
            return numberLike;
        }
        if (typeof numberLike === 'string') {
            return this.safeFloat(numberLike);
        }
        if (numberLike instanceof BigNumber) {
            return numberLike.toNumber();
        }
        throw new Error(`Cannot convert ${numberLike} to number`);
    }

    static toFixedNumber(num: NumberLike, fmt: FixedFormat|string): FixedNumber {
        if (num instanceof FixedNumber) {
            return num;
        }

        // if (num instanceof BigNumber) {
        //     // Warning, dubiously missing "decimals" param here
        //     return FixedNumber.from(num, fmt);
        // }

        if (typeof num === 'number') {
            return FixedNumber.from(num, fmt);
        }

        if (typeof num === 'string') {
            return FixedNumber.fromString(num, fmt);
        }

        return Errors.throwNotSure(`Cannot convert ${num} to FixedNumber`);
    }

    static checkFloat(f: number) {
        Checks.assert(!isNaN(f), `${f} is not a number`);
        Checks.assert(_.isNumber(f), `${f} is not a number`);
        Checks.assert(_.isFinite(f), `${f} is not a number`);
        return f;
    }

    static safeFloat(string: string) {
        // TODO: lots of safety checks
        return this.checkFloat(
            parseFloat(string));
    }

    static preventBigNumber(other: NumberLike, message: string) {
        if (other instanceof BigNumber) {
            throw new Error(message);
        }
        return other;
    }

    static toNumericString(amount: NumberLike) {
        amount = amount.toString();
        // check if it crashes
        // this.safeFloat(amount);
        return amount;
    }

    static toBigNumber(amount: BigNumberLike) {
        try {
            return BigNumber.from(amount);
        } catch (e) {
            throw new Error(`Cannot convert ${amount} to BigNumber`);
        }
    }

    static toDecimalWithDefault(amount: Decimal|undefined, number: NumberLike = 0) {
        if (amount instanceof Decimal) {
            return amount;
        }
        return new Decimal((number).toString());
    }
}
//endregion

export {Numbers}
export {BigNumber, BigNumberish, FixedNumber, FixedFormat}

export {Decimal}
