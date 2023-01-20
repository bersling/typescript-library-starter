import util from "util";
import Currencies, {CurrencyLike, CurrencyUnit} from './CurrencyUnit';
import Numbers, {BigNumber, BigNumberLike, Decimal, FixedNumber, NativeNumberLike, NumberLike} from "./types/Numbers";
import {RoundingMode, UnsafeMath} from "./utils/Math";
import {Lazy} from "./types";
import {isPromise} from "util/types";

export type InternalAmount = BigNumber
export type ExternalAmount = FixedNumber
export type UnboundedExternalAmount = Decimal

export interface MoneyLike {
    internalAmount: BigNumberLike,
    currencyUnit: CurrencyLike
}

export interface BigMoneyProvider {
    toBigMoney(): BigMoney;

    get currencyUnit(): CurrencyUnit;
}

// TODO: does it make sense to set this? What's the default value?
// We don't really KNOW what to put here, so here are some "probably good" values:
// type UnboundedExternalAmount
export const ExternalDecimal: Decimal.Constructor = Decimal.clone({
    rounding: Decimal.ROUND_HALF_EVEN,  // WARNING: we really should be INTENTIONAL about when we round.
    precision: 32,                      // 32 = max u can have with 128 bits (Solidity Limit)
    toExpPos: 40,                       //
    toExpNeg: -20,                      //

    // The negative exponent limit, i.e. the exponent value below which underflow to zero occurs.
    minE: -20,                          // well, solidity is actually limited to -18 (1e-18) (I put 20 to give padding?)
    // The positive exponent limit, i.e. the exponent value above which overflow to Infinity occurs.
    maxE: 40,                           // well, solidity is actually
    // uint256 max = 115792089237316195423570985008687907853269984665640564039457584007913129639935
    //              (78 chars)
    // int256 is max 39 chars
});

export abstract class MoneyMath implements BigMoneyProvider {

    abstract get currencyUnit(): CurrencyUnit

    abstract toBigMoney(): BigMoney;

    get roundingMode() {
        return RoundingMode.TRUNCATE;
    }

    equals(other: BigMoneyProvider) {
        this.currencyUnit.assertEquals(other.currencyUnit);
        return this.toBigMoney().unboundedExternalAmount.eq(
            other.toBigMoney().unboundedExternalAmount);
    }

    _checkedExec<T>(other: BigMoneyProvider, fn: (amount: BigMoney) => T): T {
        this.currencyUnit.assertEquals(other.currencyUnit);
        return fn(other.toBigMoney());
    }

    _execMath(them: UnboundedExternalAmount, fn: UnsafeMath): BigMoney {
        return BigMoney.withAmount(
            this,
            fn(them, this.toBigMoney().unboundedExternalAmount)
            // .toString() // TODO: noticed this - must it be a string??
        );
    }

    _unwrapAmount(other: BigMoneyProvider): UnboundedExternalAmount {
        return this._checkedExec(
            other,
            (money) => money.unboundedExternalAmount);
    }

    checkedMath(other: BigMoneyProvider, fn: UnsafeMath): BigMoney {
        // checked = check same currency
        return this._checkedExec(other, (money) =>
            this.uncheckedMath(
                this._unwrapAmount(money),
                fn
            ));
    }

    uncheckedMath(other: UnboundedExternalAmount, fn: UnsafeMath): BigMoney {
        // unchecked = ignore currency
        return this._execMath(
            other,
            fn
        );
    }

    // OPERATIONS


}

//region export class BigMoney
export class BigMoney extends MoneyMath {

    public readonly unboundedExternalAmount: UnboundedExternalAmount;
    public readonly currencyUnit: CurrencyUnit;

    protected constructor(unboundedExternalAmount: UnboundedExternalAmount, currencyUnit: CurrencyUnit) {
        super();
        this.unboundedExternalAmount = unboundedExternalAmount;
        this.currencyUnit = currencyUnit;
    }

    //region Amounts
    get externalDecimal(): UnboundedExternalAmount {
        return this.unboundedExternalAmount;
    }

    get externalNumber(): FixedNumber {
        return Numbers.decimalToFixedNumber(
            this.externalDecimal,
            Numbers.DEF_NUMOPTS);
    }

    //endregion

    abs(): BigMoney {
        return BigMoney.withAmount(
            this,
            this.unboundedExternalAmount.abs()
        );
    }

    //region BigMoneyProvider
    toBigMoney(): BigMoney {
        return this;
    }

    toMoney(roundingMode: RoundingMode): Money {
        return BigMoney.toMoney(this, roundingMode);
    }

    //endregion

    //region toString() / toJSON() / inspect()
    toString(): string {
        return `${Numbers.toAtLeastDecimalPlaces(
            this.unboundedExternalAmount,
            this.currencyUnit.digits.parsed)} ${this.currencyUnit}`;
        // return `${this.unboundedExternalAmount.toString()} ${this.currencyUnit.toString()}`;
        // // return `${this.currencyUnit.digits.formatDecimal(this.externalDecimal)} ${this.currencyUnit.symbol}`;
        // // return `${this.externalDecimal.toDecimalPlaces(this.currencyUnit.digits.formatted)} ${this.currencyUnit}`;
        // if (this.externalDecimal.decimalPlaces() > this.currencyUnit.digits.formatted) {
        //     return `${this.externalDecimal} ${this.currencyUnit}`;
        // } else {
        //     return `${this.externalDecimal.toFixed(this.currencyUnit.digits.formatted)} ${this.currencyUnit}`;
        // }
        // // return `${this.externalDecimal.toFixed(this.currencyUnit.digits.parsed)} ${this.currencyUnit}`;
    }

    toJSON() {
        return {
            external: this.unboundedExternalAmount,
            humanized: this.toString(),
            currencyUnit: this.currencyUnit.toString()
        };
    }

    [util.inspect.custom]() {
        return this.toString();
    }

    //endregion

    //region Math
    add(other: BigMoneyProvider) {
        return this.checkedMath(
            other,
            (them, self) => self.add(them)
        );
    }

    sub(other: BigMoneyProvider) {
        return this.checkedMath(
            other,
            (them, self) => self.sub(them));
    }

    div(other: BigMoneyProvider): BigMoney {
        return this.checkedMath(
            other,
            (them, self) => self.div(them));
    }

    mul(other: BigMoneyProvider): BigMoney {
        return this.checkedMath(
            other,
            (them, self) => self.mul(them)
        );
    }

    externalDiv(other: NumberLike) {
        Numbers.preventBigNumber(other, `unlikely that you want to divide by a ${typeof other}`);
        return this.uncheckedMath(
            BigMoney.toUnboundedExternalAmount(other),
            (them, self) => self.div(them));
        // this.externalNumber.divUnsafe(amount));
    }

    externalMul(other: NumberLike) {
        Numbers.preventBigNumber(other, `unlikely that you want to divide by a ${typeof other}`);
        return this.uncheckedMath(
            BigMoney.toUnboundedExternalAmount(other),
            (them, self) => self.mul(them));
    }

    //endregion

    //region Conversion
    // TODO: we need to test this function
    /**
     * 2 BTC @ $100ea
     * "convert 2 BTC into USD": (2 BTC).convert(100 USD) = "200 USD"
     * @param price
     */
    convert(price: BigMoneyProvider): BigMoney {
        Currencies.shouldBeDifferentCurrency(this, price);
        /// 1000000000000000000 ($1) * 2500 ($25) =

        // TODO: this needs to consider currency/directionality.

        const result = BigMoney.likeExternal(
            price,
            BigMoney.toExternalDecimal(price).mul(
                    BigMoney.toExternalDecimal(this)));

        console.log(`[${this}].convert(${price}) = ${result}`);

        return result;
    }

    //endregion


    //region Static

    static likeExternal(other: BigMoneyProvider, amount: UnboundedExternalAmount): BigMoney {
        return BigMoney.ofExternal(amount, Money.currencyOf(other));
    }

    static ofExternal(amount: NumberLike, currency: CurrencyLike): BigMoney {
        return new BigMoney(
            BigMoney.toUnboundedExternalAmount(amount),
            CurrencyUnit.orThrow(currency));
    }

    static withAmount(similar: BigMoneyProvider, externalAmount: NumberLike) {
        return BigMoney.ofExternal(
            externalAmount,
            similar.currencyUnit
        );
    }

    static isBigMoneyProvider(thing:any) {
        if (!thing) return false;
        const bmp = (thing as BigMoneyProvider);
        if (!bmp) return false; // TODO: is this necessary?
        return (typeof bmp.toBigMoney === 'function' && CurrencyUnit.isLike(bmp.currencyUnit))
    }

    static toMoney(mp: BigMoneyProvider, rounding: RoundingMode): Money {
        const m = mp.toBigMoney();
        return Money.ofExternal(m.currencyUnit, BigMoney.toRoundedExternalAmount(mp, rounding));
    }

    //////////////////////////////////////////////////

    static toExternalDecimal(money: BigMoneyProvider) {
        return money.toBigMoney().externalDecimal
    }

    static toUnboundedExternalAmount(amount: NumberLike|BigMoneyProvider): UnboundedExternalAmount {
        if (this.isBigMoneyProvider(amount)) {
            return BigMoney.toUnboundedExternalAmount(
                (amount as BigMoneyProvider).toBigMoney().unboundedExternalAmount)
        } else {
            return new ExternalDecimal(
                Numbers.toNumericString(amount.toString()));
        }
    }

    static toRoundedInternalAmount(mp: BigMoneyProvider, roundingMode: RoundingMode): InternalAmount {
        return mp.toBigMoney().currencyUnit.digits.internalize(
            BigMoney.toRoundedExternalAmount(
                mp, roundingMode));
    }

    static toRoundedExternalAmount(mp: BigMoneyProvider, rounding: RoundingMode): string {
        return BigMoney.withBigMoney(mp, (money) =>
            Numbers.toRoundedDecimalPlaces(
                money.unboundedExternalAmount,
                {
                    decimals: money.currencyUnit.digits.parsed,
                    rounding,
                }
            ))
    }

    static withBigMoney<T>(provider: BigMoneyProvider, fn: (money:BigMoney) => T): T{
        return fn(provider.toBigMoney())
    }

    //endregion

    //////////////////////////////////////////////////

}

//endregion

//region export class Money
export class Money extends MoneyMath {

    //region protected constructor(money: BigMoney)
    protected constructor(money: BigMoney) {
        super();
        this.big = money;
        this.val = this.big.toString();
    }

    // protected constructor({amount, currencyUnit}: MoneyLike) {
    //     FixedNumber.fromValue()
    //     this.internalAmount = amount;
    //     this.currencyUnit = currencyUnit;
    //     this.money = new BigMoney({
    //         amount,
    //         currencyUnit
    //     });
    // }
    //endregion

    //region MoneyProvider { toBigMoney() : BigMoney } | currencyUnit
    big: BigMoney;
    readonly val: string;

    toBigMoney(): BigMoney {
        return this.big;
    }

    get currencyUnit() {
        return this.big.currencyUnit;
    };
    //endregion

    //region amounts
    get internalAmount(): string {
        return this.internalNumber.toString();
    }

    get internalNumber(): BigNumber {
        return BigMoney.toRoundedInternalAmount(this, this.roundingMode);
    }

    get externalUnsafe(): number {
        return Numbers.checkFloat(
            this.externalFixed.toUnsafeFloat());
    }

    get externalDecimal(): Decimal {
        return new Decimal(this.externalFixed.toString());
    }

    get externalFixed(): FixedNumber {
        return FixedNumber.fromValue(
            this.internalNumber,
            this.currencyUnit.digits.parsed,
            this.currencyUnit.digits.fmt);
    }

    get externalAmount(): string {
        return this.currencyUnit.digits.externalize(this.internalNumber);
    }

    get renderedAmount(): string {
        // TODO: concept of render makes no sense.
        // TODO: "external" is the same thing as "rendered" ?
        return this.currencyUnit.digits.render(this.externalDecimal);
    }

    //endregion

    //region Math

    abs() {
        return Money.likeInternal(this, this.internalNumber.abs());
    }

    mul(money: Money, roundingMode = this.roundingMode) {
        return this.toBigMoney().mul(money).toMoney(roundingMode)
    }

    add(money: Money, rounding: RoundingMode = RoundingMode.ROUND_HALF_EVEN): Money {
        return this.toBigMoney().add(money).toMoney(rounding);
    }

    //endregion

    convert(price: Money, rounding: RoundingMode = RoundingMode.TRUNCATE): Money {
        return this.toBigMoney().convert(price).toMoney(rounding);
    }

    //region Comparison

    eq(other: Money): boolean {
        // if not the same currency, return false
        if (!this.currencyUnit.equals(other.currencyUnit)) {
            return false;
        }
        return this.internalNumber.eq(other.internalNumber);
    }

    get isZero() {
        return this.internalNumber.eq(0);
    }

    get isPositive() {
        return !this.isNegative; // TODO: this returns true for zero
    }

    get isNegative() {
        return this.internalNumber.lt(0);
    }

    //region lt, lte, lt0, lte0
    lt(other: Money) {
        this.currencyUnit.assertEquals(other.currencyUnit);
        return this.internalNumber.lt(other.internalNumber);
    }

    lte(other: Money) {
        return this.lt(other) || this.eq(other);
    }

    lt0() {
        return this.internalNumber.lt(0);
    }

    lte0() {
        return this.internalNumber.lte(0);
    }

    //endregion

    //region gt, gte, gt0, gte0
    gt(other: Money) {
        return !(this.lt(other) || this.eq(other));
    }

    gte(other: Money) {
        return this.gt(other) || this.eq(other);
    }

    gt0() {
        return this.internalNumber.gt(0);
    }

    gte0() {
        return this.internalNumber.gte(0);
    }

    //endregion

    //endregion

    //region toString() / toJSON() / inspect() / valueOf()
    toString(): string {
        // return Money.humanizeString(this);
        return `${
            Numbers.toAtLeastDecimalPlaces(
                this.externalDecimal,
                this.currencyUnit.digits.formatted)
        } ${this.currencyUnit}`;
        // return `${
        //     Numbers.toRoundedDecimalPlaces(this.externalDecimal, {
        //         decimals: this.currencyUnit.digits.formatted,
        //         rounding: RoundingMode.UNNECESSARY
        //     })
        // } ${this.currencyUnit}`;
        // } ${this.currencyUnit}`;
        // return `${this.externalDecimal.toDecimalPlaces(this.currencyUnit.digits.formatted, RoundingMode.UNNECESSARY)} ${this.currencyUnit.toString()}`;
        // return `${this.externalDecimal.toFixed(this.currencyUnit.digits.formatted)} ${this.currencyUnit.toString()}`;
    }

    toJSON() {
        return this.toString();
        // return {
        //     internal: this.internalNumber.toString(),
        //     external: Money.formattedAmount(this),
        //     humanized: this.toString(),
        //     currencyUnit: this.currencyUnit.toString()
        // };
    }

    valueOf() {
        return this.toString();
    }

    [util.inspect.custom]() {
        return this.toString();
        // return this.toJSON();
    }

    //endregion

    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////

    static formattedAmount({
                               currencyUnit,
                               internalAmount
                           }: MoneyLike): string {
        return this.currencyOf(currencyUnit)
            .digits.formatUnits(
                Numbers.toBigNumber(internalAmount));
    }

    static renderedAmount({
                              currencyUnit,
                              internalAmount
                          }: MoneyLike): string {
        return this.currencyOf(currencyUnit)
            .digits.externalize(
                Numbers.toBigNumber(internalAmount));
    }

    // static humanizeString(money: Money) {
    //     return `${this.renderedAmount(money)} ${money.currencyUnit}`;
    // }

    ////////////////////////////////////////////////////////////

    static currencyOf(like: CurrencyLike | BigMoneyProvider): CurrencyUnit {
        if ((like as BigMoneyProvider).toBigMoney) {
            return CurrencyUnit.orThrow((like as BigMoneyProvider).toBigMoney().currencyUnit);
        }

        return CurrencyUnit.orThrow(like as CurrencyLike);
    }

    static externalize(amount: BigNumber, currency: CurrencyLike | BigMoneyProvider): string {
        return Money.currencyOf(currency).digits.externalize(
            amount
        );
    }

    static internalize(amount: NumberLike, currency: CurrencyLike | BigMoneyProvider): BigNumber {
        return Money.currencyOf(currency).digits.internalize(
            // TODO: is there a better way to check length safety?
            amount.toString()
        );
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static ofExternal(currency: CurrencyLike, amount: NumberLike) {
        const unit = Money.currencyOf(currency);
        return Money.ofInternal(unit, unit.digits.internalize(
            amount.toString()));
    }

    static ofInternal(currency: CurrencyLike, amount: BigNumberLike) {
        const unit = CurrencyUnit.orThrow(currency) as CurrencyUnit;
        return new Money(
            BigMoney.ofExternal(
                unit.digits.externalize(
                    Numbers.toBigNumber(amount)),
                unit));
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static likeExternal(other: Money, amount: NumberLike) {
        return Money.ofExternal(other.currencyUnit, amount);
    }

    static likeInternal(other: Money, amount: BigNumber) {
        return Money.ofInternal(other.currencyUnit, amount);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // toString

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // static one(currency: CurrencyLike) {
    //     return Money.ofExternal(currency, 1);
    // }

    // static async lazyInternal(lazy: Lazy<BigNumber>, currency: CurrencyLike) {
    //     return Money.ofInternal(currency, (await lazy));
    // }
    //
    // static async lazyExternal(lazy: Lazy<NumberLike>, currency: CurrencyLike) {
    //     return Money.ofExternal(currency, (await lazy));
    // }

}

//endregion

export default Money;


