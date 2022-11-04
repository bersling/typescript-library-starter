import _ from 'lodash';
import {ethers} from "ethers";

import Numbers, {BigNumber, Decimal, FixedFormat, NumberLike} from "./Numbers";
import Checks from "../utils/Checks";
import {RoundingMode} from "../utils/Math";
import Errors from "../utils/Errors";

export type DigitsSpec = { parsed: number, formatted: number }
export type UnsafeDigits = string | number | DigitsSpec;

//region export class SafeDigits implements Digits
export class SafeDigits implements Digits {

    // TODO: think of ways decimals could be checked for safety
    // TODO: check the range / bounds (i.e. no decimals larger than 100 and less than 5????)

    public readonly parsed: number;
    public readonly formatted: number;
    // public readonly fmt: string;
    public readonly fmt: FixedFormat;

    private constructor({parsed, formatted}: { parsed: number, formatted: number, }) {
        this.parsed = parsed;
        this.formatted = formatted;
        //////////// THIS IS NOT ACTIVE/USED/WORKING YET
        this.fmt = FixedFormat.from(`fixed`) // this is what "fixed" is in the docs
        // this.fmt = FixedFormat.from(`fixed128x${parsed}`) // this is what "fixed" is in the docs
        ////////////////////////////////////////////////
    }

    parseUnits(amount: string): BigNumber {
        return ethers.utils.parseUnits(
            Numbers.toNumericString(amount),
            this.parsed);
    }

    formatUnits(value: BigNumber): string {
        return ethers.utils.formatUnits(
            value,
            this.parsed);
    }

    internalize(externalAmount: NumberLike): BigNumber {
        return this.parseUnits(
            Numbers.toNumericString(externalAmount)
        );
    }

    externalize(value: BigNumber): string {
        // return this.formatUnits(value);
        return Numbers.toRoundedDecimalPlaces(
            new Decimal(this.formatUnits(value)),
            {
                decimals: this.parsed,
                rounding: RoundingMode.UNNECESSARY
            });
    }

    render(externalDecimal: Decimal): string {
        return Numbers.toRoundedDecimalPlaces(externalDecimal,
            {
                decimals: this.formatted,
                rounding: RoundingMode.TRUNCATE
            });
        // return `${externalDecimal.toDecimalPlaces(
        //     this.formatted,
        //     RoundingMode.UNNECESSARY)}`;
        // } else {
        //     return `${externalDecimal.toFixed(this.formatted)}`;
        // }
    }

    equals(other: SafeDigits) {
        return this.parsed === other.parsed &&
            this.formatted === other.formatted;
    }

    static of(parsed: number, formatted: number = parsed): SafeDigits {
        // TODO: do sanity checks here
        return new SafeDigits({
            parsed,
            formatted
        });
    }

    toString() {
        return `${this.parsed}/${this.formatted}`;
    }

}

//endregion

//region export default class Digits
export default class Digits {

    // public readonly storage: number;
    // public readonly display: number;
    //
    // private constructor(storage: number, display: number) {
    //     // NOTE: this should never get called
    //     this.storage = 1;
    //     this.display = 1;
    // }

    static to(digits: UnsafeDigits): SafeDigits {
        if (digits instanceof SafeDigits) {
            return digits;
        }

        if (Number.isSafeInteger(digits)) {
            return Digits.of(digits as number);
        }

        // TODO: check "is integer" here.
        if (Numbers.isNativeNumber((digits as DigitsSpec).parsed)) {
            const spec = digits as DigitsSpec;
            return Digits.of(spec.parsed, spec.formatted);
        }

        throw new Error(`Cannot convert ${digits} to Digits`);
    }

    static checkRange(value: number) {
        Numbers.shouldBeWithinRange(value, {min: 2, max: 18}, `OutOfRangeException: ${value}`);
        return value;
    }

    // type UnsafeDigits = string | number | DigitsSpec;
    static of(parsed: UnsafeDigits, formatted?: number): SafeDigits {
        if (parsed instanceof SafeDigits) {
            // if (!_.isUndefined(formatted)) throw 'cannot accept both an object and number'
            if (!_.isUndefined(formatted))
                return Digits.of(parsed.parsed, formatted);
            else
                return parsed;
        }

        if (_.isObject(parsed)) {
            return Digits.of(parsed.parsed, formatted || parsed.formatted);
        }

        // Checks.shouldBeDefined(parsed)
        if (Numbers.isFiniteNativeNumber(parsed))
            return SafeDigits.of(
                Digits.checkRange(parsed as number),
                Digits.checkRange(formatted || parsed as number));

        if (_.isString(parsed))
            return Digits.of(
                Numbers.safeFloat(parsed),
                formatted);

        // static of(parsed: number, formatted: number = 4) {
        // return SafeDigits.of(parsed, formatted);
        return Errors.throwNotSure(`parsed:${parsed}, formatted:${formatted}`);
    }

};
//endregion
