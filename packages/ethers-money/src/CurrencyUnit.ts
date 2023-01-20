// type CurrencyLike = string | CurrencyUnit
import Checks from "./utils/Checks";
import util from "util";
import Digits, {SafeDigits, UnsafeDigits} from "./types/Digits";
import Errors from "./utils/Errors";
import _ from "lodash";
import {BigNumber} from "./types/Numbers";
import Money from "./Money";
import {Optional} from "./types";

export type CurrencyLike = string |
    CurrencyUnit |
    { currency: CurrencyLike } |
    { currencyUnit: CurrencyLike } |
    { symbol: string }

const DEBUG = false;

const REGISTRATIONS: { [key: string]: { name: string, digits: UnsafeDigits } } = {
    AVAX: {name: 'Native Avalanche', digits: 18},
    WAVAX: {name: 'Wrapped Avalanche', digits: 18},

    USD: {name: 'Dollars', digits: {formatted: 2, parsed: 2}},
    USDC: {name: 'Circle USD', digits: {formatted: 2, parsed: 6}},

    MIM: {name: 'Magic Internet Money', digits: {formatted: 2, parsed: 18}},
    DAI: {name: 'DAI', digits: 18},

    BTC: {name: 'Bitcoin', digits: 18},

    ETH: {name: 'Ethereum', digits: 18},
    WETH: {name: 'Wrapped Ethereum', digits: 18},

    LP: {name: 'Generic LP', digits: 18},

}

const ALL: { [key: string]: CurrencyUnit } = {};

//region export class CurrencyUnit
export class CurrencyUnit {

    // static ether:number = 18;
    /*finney:number = 15;
    szabo:number = 12;
    gwei:number = 9;
    mwei:number = 6;
    kwei:number = 3;
    wei:number = 0;*/

    //region props: name, symbol, digits, decimals
    name: string;
    symbol: string;
    digits: SafeDigits;

    get decimals() {
        return this.digits.parsed;
    }
    //endregion

    //region protected constructor({ name, symbol, digits })
    constructor({name, symbol, digits}: { name: string | undefined, symbol: string, digits: UnsafeDigits }) {
        this.digits = Digits.to(digits);
        this.name = name || `CurrencyUnit`;
        this.symbol = symbol;

        Checks.shouldBeNonBlankString(symbol);
        // Checks.shouldBeOnlyLetters(symbol);
        Checks.shouldBeNativeNumberWithinRange(symbol.length, {
            min: 2,
            max: 20
            // max: 4 TODO: why max: 4? it doesn't pass this check and throws
        });
    }

    //endregion

    //region toString/valueOf/inspect/toJSON/equals/assertEquals
    toJSON() {
        return this.toString();
    }

    toString() {
        return this.symbol;
    }

    valueOf() {
        return this.toString();
    }

    [util.inspect.custom]() {
        return this.toString();
    }

    equals(other: CurrencyUnit) {
        return this.toString() === other.toString() && this.digits.equals(other.digits);
    }

    assertEquals(other: CurrencyUnit) {
        if (this.equals(other)) return this;
        throw new Error(`CurrencyUnit.orThrow: ${this.symbol} != ${other.symbol}`);
    }

    //endregion

    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////

    //region static helpers (create / exists)

    static orSkip(like: Optional<CurrencyLike>) {
        if (!like) return undefined
        if (like instanceof CurrencyUnit) return like
        return Currencies.optRegistered(CurrencyUnit.optSymbol(like))
    }

    static orThrow(like: CurrencyLike, optionalMessage: string = `CurrencyUnit.orThrow: ${like}`): CurrencyUnit {
        if (like instanceof CurrencyUnit) return like;
        return this.shouldBeCurrencyUnit(
            this.orSkip(this.asSymbol(like)),
            optionalMessage)
    }

    //region Symbols
    static SYMBOL_FORMAT = /^[A-Z]{2,5}$/

    static isSymbolStringFormat(string: string | any) {
        if (!string) return false;
        if (typeof string !== 'string') return false
        return this.SYMBOL_FORMAT.test(string)
    }

    static shouldBeSymbolString(like: string | any, message = `shouldBeSymbolString: ${like}`): string {
        Checks.assert(
            CurrencyUnit.isSymbolStringFormat(like),
            message)
        return like;
    }

    static asSymbol(like: CurrencyLike): string {
        return this.shouldBeSymbolString(this.optSymbol(like))
    }

    static optSymbol(like: CurrencyLike): string | undefined {
        const returnIf = (thing: string | undefined) => ((CurrencyUnit.isSymbolStringFormat(thing)) ? thing : undefined)
        if (!like) return undefined
        if (like instanceof CurrencyUnit) return returnIf(like.symbol)
        if (typeof like === 'string') return returnIf(like as string)
        return returnIf(
            this._pluckLikeProps(like)
                .map(thing => this.optSymbol(thing))
                .filter(thing => !_.isNil(thing))
                .shift())
    }

    static withSymbol<T>(like: CurrencyLike, fn: (thing: string) => T): T {
        return fn(CurrencyUnit.asSymbol(like))
    }

    //endregion

    //region pulls

    private static _pluckLikeProps(like: CurrencyLike): any[] {
        if (!like) return []
        if (typeof like === 'string') return [like]
        if (like instanceof CurrencyUnit) return [like]

        return _.uniq([
            (like as { symbol: any }).symbol,
            (like as { currency: any }).currency,
            (like as { currencyUnit: any }).currencyUnit
        ])
            .filter(thing => !_.isNil(thing))
    }

    //endregion

    //region with (execute)
    static withCurrency<T>(like: CurrencyLike, fn: (thing: CurrencyUnit) => T): T {
        return this.withSymbol(like,
            (thing: string) => fn(CurrencyUnit.orThrow(thing)))
    }

    //endregion

    //region Like

    static optLike(like: CurrencyLike): Optional<CurrencyUnit> {
        if (like instanceof CurrencyUnit) return like;
        if (typeof like === 'string') return CurrencyUnit.orSkip(like);
        return this._pluckLikeProps(like)
            .map(thing => CurrencyUnit.orSkip(thing))
            .filter(thing => !_.isNil(thing))
            .shift()
    }

    static isLike(symbol: CurrencyLike | any): boolean {
        if (!symbol) return false;
        if (symbol instanceof CurrencyUnit) return true;
        if (typeof symbol === 'string') return this.isSymbolStringFormat(symbol)

        // if ((symbol as { currency: CurrencyLike }).currency)
        //     return this.isLike((symbol as { currency: CurrencyLike }).currency);
        // if ((symbol as { currencyUnit: CurrencyLike }).currencyUnit)
        //     return this.isLike((symbol as { currencyUnit: CurrencyLike }).currencyUnit);
        return !!this._pluckLikeProps(symbol)
            .find(thing => this.isLike(thing));
    }

    //endregion

    static shouldBeCurrencyUnit(like: CurrencyLike | any, message = `shouldBeCurrencyUnit: ${like}`): CurrencyUnit {
        if (like instanceof CurrencyUnit) return like
        return Errors.throwNotSure(like, message)
    }

}

//endregion

export default class Currencies {

    // static BTC = CurrencyUnit.BTC!!;
    // static ETH = CurrencyUnit.ETH!!;
    // static USD = CurrencyUnit.USD!!;
    // static AVAX = CurrencyUnit.AVAX!!;

    static BTC = CurrencyUnit.orThrow('BTC');
    static ETH = CurrencyUnit.orThrow('ETH');

    static USD = CurrencyUnit.orThrow('USD');
    static MIM = CurrencyUnit.orThrow('MIM');
    static USDC = CurrencyUnit.orThrow('USDC');

    static AVAX = CurrencyUnit.orThrow('AVAX');
    static WAVAX = CurrencyUnit.orThrow('WAVAX');

    static LP = CurrencyUnit.orThrow('LP');    /// GENERAL LP

    static register({name, symbol, digits}: { name: string, symbol: string, digits: UnsafeDigits }) {
        REGISTRATIONS[symbol] = {name, digits}
    }

    private static uncheckedCreate({
                                       name,
                                       symbol,
                                       digits
                                   }: { name: string | undefined, symbol: string, digits: UnsafeDigits }): CurrencyUnit {
        if (ALL[symbol])
            return ALL[symbol];
        return ALL[symbol] = new CurrencyUnit({
            name,
            symbol,
            digits: Digits.to(digits)
        });
    }

    static isRegistered(like: CurrencyLike) {
        return CurrencyUnit.withSymbol(like,
            symbol => !!ALL[CurrencyUnit.asSymbol(symbol)]);
    }

    static getRegistered(symbol: string): CurrencyUnit {
        return CurrencyUnit.shouldBeCurrencyUnit(
            Currencies.optRegistered(symbol))
    }

    static optRegistered(symbol: Optional<string>): Optional<CurrencyUnit> {
        if (!symbol) return undefined
        if (ALL[symbol])
            return ALL[symbol];
        if (!REGISTRATIONS[symbol])
            return undefined;
        try {
            return ALL[symbol] = Currencies.uncheckedCreate({
                name: REGISTRATIONS[symbol]?.name || symbol,
                digits: REGISTRATIONS[symbol]?.digits,
                symbol: symbol
            });
        } finally {
            DEBUG && console.trace(`created CurrencyUnit.find: ${symbol}`)
        }
    }

    static shouldBeDifferentCurrency(param: CurrencyLike, big: CurrencyLike) {
        big = CurrencyUnit.asSymbol(big)
        param = CurrencyUnit.asSymbol(param)
        if (big === param) {
            return;
        }

        throw new Error(`shouldBeDifferentCurrency: ${param} === ${big}`);
    }

    static of(formattedValue: string | BigNumber, currency: CurrencyLike) {
        if (formattedValue instanceof BigNumber) {
            return Money.ofInternal(currency, formattedValue);
        } else {
            return Money.ofExternal(currency, formattedValue);
        }
    };

    static ofUSD(formattedValue: string | BigNumber) {
        return Currencies.of(formattedValue, Currencies.USD)
    };
}

export {Currencies}
