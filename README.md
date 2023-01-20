# ethers-money

Simplify how you represent Money within ethers.js 

Because it's hard to reason about big numbers that you see on the screen, and every time I want to humanize it, I find myself repetitively making the same utility functions.

# Usage

 * `External` = How it's represented to the Humans (`formatUnits`)
 * `Internal` = How it's represented in the Blockchain (`parseUnits`)

```
Money.ofExternal( 1, 'BTC') == Money.ofInternal( 1**18, 'BTC');
Money.ofExternal( 1, 'USD') == Money.ofInternal( 100, 'USD');
```

```
type InternalAmount          = BigNumber
type ExternalAmount          = FixedNumber
type UnboundedExternalAmount = Decimal
```

## Testing

Using [npm link](https://www.tsmean.com/articles/how-to-write-a-typescript-library/local-consumer) you can easily test whether your changes are working correctly.

```
// NOTE: mocha config seem to throw right now.

npm test
```

# Further reading

You can write a test like this:
https://www.tsmean.com/articles/how-to-write-a-typescript-library/unit-testing
