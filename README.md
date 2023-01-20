# ethers-money

Simplify how you represent Money within ethers.js 

Because it's hard to reason about big numbers that you see on the screen, and every time I want to humanize it, I find myself repetitively making the same utility functions.

Inspired by [joda-money](https://www.joda.org/joda-money/)

# Usage

 * `External` = How it's represented to the Humans (`formatUnits`)
 * `Internal` = How it's represented in the Blockchain (`parseUnits`)

```
Money.ofExternal( 1, 'BTC') == Money.ofInternal( 1**18, 'BTC');
Money.ofExternal( 1, 'USD') == Money.ofInternal( 100, 'USD');

Money.ofExternal(1, 'BTC).toString() == "1.00000000000000000 BTC"
Money.ofExternal(1, 'USD).toString() == "1.00 USD"
```

```
type InternalAmount          = BigNumber
type ExternalAmount          = FixedNumber
type UnboundedExternalAmount = Decimal
```

## Amounts

The core purpose of this library is to access the underlying amount.

 * Amount = String (per terminology of ethers.js)
 * Unsafe = [Float](https://www.google.com/search?q=why+you+shouldnt+use+floats)
 * Decimal = [Decimal.js](https://mikemcl.github.io/decimal.js/)
 * Number = [BigNumber](https://docs.ethers.org/v5/api/utils/bignumber)
 * Fixed = [FixedNumber](https://docs.ethers.org/v5/api/utils/fixednumber/)

```
Amount = String (same terminology of ethers.js)
Number = BigNumber (as used by ethers.js)
Decimal = Decimal
```

```
class Money {

    get internalAmount(): string {
        return this.internalNumber.toString();
    }

    get internalNumber(): BigNumber {
        return BigMoney.toRoundedInternalAmount(this, this.roundingMode);
    }

    get externalAmount(): string {
        return this.currencyUnit.digits.externalize(this.internalNumber);
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

    get externalUnsafe(): number {
        return Numbers.checkFloat(
            this.externalFixed.toUnsafeFloat());
    }
}
```

## Numbers
```
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
```

## Testing

Using [npm link](https://www.tsmean.com/articles/how-to-write-a-typescript-library/local-consumer) you can easily test whether your changes are working correctly.

```
// NOTE: mocha config seem to throw right now.

npm test
```

Learnings:
https://www.tsmean.com/articles/how-to-write-a-typescript-library/unit-testing
