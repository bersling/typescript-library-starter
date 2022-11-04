import { expect } from "chai"
import { describe, it} from "mocha"
import {CurrencyUnit} from "../src/CurrencyUnit";

describe('hello', () => {

    it('world', () =>
        expect(CurrencyUnit.asSymbol('USD')).to.equal('USD'))
})
