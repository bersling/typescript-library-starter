import {expect} from "chai"
import {describe, it} from "mocha"
import {CurrencyUnit} from "../src/CurrencyUnit";

describe('hello', () => {

    it('world', () =>
        expect(CurrencyUnit.asSymbol('USD')).to.equal('USD'))

})

describe('CurrencyUnit', function () {

    const toCurrencyCombinations = (symbol: string) =>
        [
            symbol,
            CurrencyUnit.orThrow(symbol),
            {currency: symbol},
            {currency: CurrencyUnit.orThrow(symbol)},
            {currencyUnit: symbol},
            {currencyUnit: CurrencyUnit.orThrow(symbol)},
            {symbol: symbol}]

    describe('withSymbol', function () {
        it('asdf', () => {
            expect(CurrencyUnit.withSymbol('BTC', (thing) => thing)).eq('BTC')
        })
    });

    describe('pullProps', function () {

    });

    describe('optLike', function () {
        toCurrencyCombinations('BTC')
            .forEach(thing =>
            it(`like: ${JSON.stringify(thing)}`, () =>
                expect(CurrencyUnit.optLike(thing)?.symbol)
                    .eq('BTC')))
    });

    describe('isLike', function () {
        toCurrencyCombinations('BTC')
            .forEach(thing =>
            it(`like: ${JSON.stringify(thing)}`, () =>
                expect(CurrencyUnit.isLike(thing)).true))
    });

    describe('asSymbol', function () {

        toCurrencyCombinations('BTC')
            .forEach(thing =>
                it(`test: ${JSON.stringify(thing)}`, () =>
                    expect(CurrencyUnit.asSymbol(thing))
                        .to.equal('BTC')))

    });

    describe('optSymbol', function () {

        toCurrencyCombinations('BTC')
            .forEach(thing =>
                it(`test: ${JSON.stringify(thing)}`, () =>
                    expect(CurrencyUnit.optSymbol(thing))
                        .to.equal('BTC')))

        // it('world', () =>
        //     expect(CurrencyUnit.optSymbol('USD')).to.equal('USD'))
        // it('world', () =>
        //     expect(CurrencyUnit.optSymbol({currency:'USD'})).to.equal('USD'))
        // it('world', () =>
        //     expect(CurrencyUnit.optSymbol({currency:'USD'})).to.equal('USD'))
    });

});
