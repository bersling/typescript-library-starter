// type CurrencyLike = string | CurrencyUnit
import Checks from "./utils/Checks";
import util from "util";
import Digits, {SafeDigits, UnsafeDigits} from "./types/Digits";
import Errors from "./utils/Errors";
import {orThrow} from "./utils";
import _ from "lodash";

export type CurrencyLike = string |
    CurrencyUnit |
    { currency: CurrencyLike } |
    { currencyUnit: CurrencyLike } |
    { symbol: string }

const DEBUG = false;

const SUPPORTED_CURRENCIES: { [key: string]: { name: string, digits: UnsafeDigits } } = {
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

    name: string;
    symbol: string;
    digits: SafeDigits;

    get decimals() {
        return this.digits.parsed;
    }

    //region protected ctor({ name, symbol, digits })
    private constructor({name, symbol, digits}: { name: string | undefined, symbol: string, digits: UnsafeDigits }) {
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

    //region static helpers

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

    static find(symbol: string): CurrencyUnit | undefined {
        if (ALL[symbol])
            return ALL[symbol];
        if (!SUPPORTED_CURRENCIES[symbol])
            return undefined;
        try {
            return ALL[symbol] = CurrencyUnit.uncheckedCreate({
                name: SUPPORTED_CURRENCIES[symbol]?.name || symbol,
                digits: SUPPORTED_CURRENCIES[symbol]?.digits,
                symbol: symbol
            });
        } finally {
            DEBUG && console.trace(`created CurrencyUnit.find: ${symbol}`)
        }
    }

    static shouldBeCurrencyUnit(like: CurrencyUnit | CurrencyLike | any, message = `shouldBeCurrencyUnit: ${like}`): CurrencyUnit {
        if (like instanceof CurrencyUnit) return like
        return Errors.throwNotSure(like, message)
    }

    static orThrow(like: CurrencyLike, optionalMessage: string = `CurrencyUnit.orThrow: ${like}`): CurrencyUnit {
        if (like instanceof CurrencyUnit)
            return like;

        const symbol = this.asSymbol(like);
        const found = this.find(symbol)

        return this.shouldBeCurrencyUnit(
            found,
            optionalMessage)

        // const symbol = this.shouldBeSymbolString(this.optSymbol(like))
        // if (typeof like === 'string')
        //     return this.orThrow(
        //         CurrencyUnit.find(like)!!,
        //         optionalMessage);

        // const any = (val: any) => val

        // const possibilities = [
        //     (like as { symbol: string }).symbol,
        //     (like as { currency: CurrencyLike }).currency,
        //     (like as { currencyUnit: CurrencyLike }).currencyUnit,
        //     // any(like).symbol,
        //     // any(like).currency,
        //     // any(like).currencyUnit,
        // ]
        //     .filter(thing => !!thing)
        //     .map(thing => !thing || CurrencyUnit.find(thing))
        // // .filter(thing => !!thing)
        // // .find()

        // if ((like as { symbol: string }).symbol)
        //     return this.orThrow((like as { symbol: string }).symbol);
        //
        // if ((like as { currency: CurrencyLike }).currency) {
        //     return this.orThrow((like as { currency: CurrencyLike }).currency);
        // }
        //
        // if ((like as { currencyUnit: CurrencyLike }).currencyUnit) {
        //     return this.orThrow((like as { currencyUnit: CurrencyLike }).currencyUnit);
        // }

        return Errors.throwNotSure(like, `CurrencyUnit.orThrow: ${like}`);
    }

    static exists(symbol: CurrencyLike) {
        return !!ALL[this.asSymbol(symbol)];
    }

    static tryTo(like: CurrencyLike): CurrencyUnit | undefined {
        if (like instanceof CurrencyUnit) return like;
        if (typeof like === 'string') return CurrencyUnit.find(like);
        if ((like as { currency: CurrencyLike }).currency)
            return CurrencyUnit.tryTo((like as { currency: CurrencyLike }).currency);
        if ((like as { currencyUnit: CurrencyLike }).currencyUnit)
            return CurrencyUnit.tryTo((like as { currencyUnit: CurrencyLike }).currencyUnit);
        return undefined;
    }

    static optLike(like: CurrencyLike | any | undefined) {
        return this.isLikeAndExists(like) ? this.tryTo(like) : undefined;
    }

    static isLikeAndExists(like: any) {
        return this.isLike(like) && this.exists(like);
    }

    static isLike(symbol: CurrencyLike | any): boolean {
        if (!symbol) return false;
        if (symbol instanceof CurrencyUnit) return true;
        if (typeof symbol === 'string') return true;    // TODO: some sort of parsing/format checks

        if ((symbol as { currency: CurrencyLike }).currency)
            return this.isLike((symbol as { currency: CurrencyLike }).currency);
        if ((symbol as { currencyUnit: CurrencyLike }).currencyUnit)
            return this.isLike((symbol as { currencyUnit: CurrencyLike }).currencyUnit);
        return false;
    }

    //region Symbols
    static SYMBOL_FORMAT = /^[A-Z]{2,5}$/

    static isSymbolStringFormat(string: string | any) {
        if (!string) return false;
        if (typeof string !== 'string') return false
        return this.SYMBOL_FORMAT.test(string)
    }

    static optSymbolString(like: CurrencyLike | any) {
        if (!like) return undefined
        if (like instanceof CurrencyUnit) return like.symbol
        if (CurrencyUnit.isSymbolStringFormat(like)) return like
    }

    static shouldBeSymbolString(like: string | any): string {
        Checks.assert(
            CurrencyUnit.isSymbolStringFormat(like),
            `this.isSymbolStringFormat(${like})`)
        return like;
    }

    //endregion

    static asSymbol(like: CurrencyLike): string {
        return this.shouldBeSymbolString(
            this.optSymbol(like))
    }

    static optSymbol(like: CurrencyLike): string | undefined {
        return this.sniffSymbols(like)
            .map(this.optSymbolString)
            .filter(symbol => !!symbol) // nuke undefined
            .pop()
    }

    // static pullSymbol(like: CurrencyLike) {
    //     if (!like) return undefined;
    //     if (like instanceof CurrencyUnit) return like.symbol
    //
    //     this.sniffSymbols(like)
    //         .map()
    // }

    static sniffSymbols(like: CurrencyLike) {
        if (!like) return []

        return _.uniq([
            // ((like instanceof CurrencyUnit) ? like : undefined),
            ((typeof like === 'string') ? like : undefined),
            (like as { symbol: any }).symbol,
            (like as { currency: any }).currency,
            (like as { currencyUnit: any }).currencyUnit
        ])
            .filter(thing => !!thing) // filter undefined
            .filter(thing => (thing instanceof CurrencyUnit) || (this.isSymbolStringFormat(thing as string)))
    }

    //endregion

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

    static register({name, symbol, digits}: {name:string, symbol:string, digits:UnsafeDigits}) {
        SUPPORTED_CURRENCIES[symbol] = {name, digits}
    }

    static find(symbol: string) {
        return orThrow(CurrencyUnit.find(symbol),
            `Currencies.find: ${symbol}`);
    }

    static shouldBeDifferentCurrency(param: CurrencyLike, big: CurrencyLike) {
        big = CurrencyUnit.asSymbol(big)
        param = CurrencyUnit.asSymbol(param)
        if (big === param) {
            return;
        }

        throw new Error(`shouldBeDifferentCurrency: ${param} === ${big}`);
    }
}

export {Currencies}
