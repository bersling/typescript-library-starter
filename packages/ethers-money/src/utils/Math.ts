import {UnboundedExternalAmount} from "../Money";

export type UnsafeMath = (them: UnboundedExternalAmount, self: UnboundedExternalAmount) => UnboundedExternalAmount;

//region export enum RoundingMode
export enum RoundingMode {
    //
    // http://mikemcl.github.io/decimal.js
    //
    // export type Rounding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    //
    // ROUND_UP	0	Rounds away from zero
    // ROUND_DOWN	1	Rounds towards zero
    // ROUND_CEIL	2	Rounds towards Infinity
    // ROUND_FLOOR	3	Rounds towards -Infinity
    // ROUND_HALF_UP	4	Rounds towards nearest neighbour.
    //     If equidistant, rounds away from zero
    // ROUND_HALF_DOWN	5	Rounds towards nearest neighbour.
    //     If equidistant, rounds towards zero
    // ROUND_HALF_EVEN	6	Rounds towards nearest neighbour.
    //     If equidistant, rounds towards even neighbour
    // ROUND_HALF_CEIL	7	Rounds towards nearest neighbour.
    //     If equidistant, rounds towards Infinity
    // ROUND_HALF_FLOOR	8	Rounds towards nearest neighbour.
    //     If equidistant, rounds towards -Infinity
    // EUCLID	9	Not a rounding mode, see modulo

    ROUND_UP = 0,
    ROUND_DOWN = 1,
    ROUND_CEIL = 2,
    ROUND_FLOOR = 3,
    ROUND_HALF_UP = 4,
    ROUND_HALF_DOWN = 5,
    ROUND_HALF_EVEN = 6,
    ROUND_HALF_CEIL = 7,
    ROUND_HALF_FLOOR = 8,
    EUCLID = 9,

    // Decimal.js DOES NOT SUPPORT THIS ONE!!!
    UNNECESSARY = 10,
    TRUNCATE = 11,

    // /**
    //  * Round towards the nearest neighbor, but if in the middle round away from zero.
    //  *
    //  * Examples: `0.1 => 0`, `0.5 => 1`, `0.6 => 1`, `-1.1 => 1`, `-1.5 => 2`, `-1.6 => `2`
    //  */
    // HalfUp,
    //
    // /**
    //  * Round towards the nearest neighbor, but if in the middle round towards
    //  * the even neighbor. Also known as bankers rounding.
    //  *
    //  * Examples: `0.1 => 0`, `0.5 => 0`, `0.6 => 1`, `-1.1 => 1`, `-1.5 => 2`, `-1.6 => `2`
    //  */
    // HalfEven,
    //
    // /**
    //  * Round towards the nearest neighbor, but if in the middle round towards zero.
    //  *
    //  * Examples: `0.1 => 0`, `0.5 => 0`, `0.6 => 1`, `-1.1 => 1`, `-1.5 => 1`, `-1.6 => `2`
    //  */
    // HalfDown,
    //
    // /**
    //  * Round towards negative infinity.
    //  */
    // Floor,
    //
    // /**
    //  * Round towards positive infinity.
    //  */
    // Ceiling,
    //
    // /**
    //  * Do not round, operation should have an exact result. Using this mode
    //  * will result in errors being thrown if the result can not be exactly
    //  * represented without rounding.
    //  */
    // Unnecessary
}
//endregion
