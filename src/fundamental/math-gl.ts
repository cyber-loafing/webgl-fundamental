

/**
 * Various 2d math functions.
 *
 * @module webgl-2d-math
 */

export type Vector2 = number[] | Float32Array;
export type Matrix3 = number[] | Float32Array;

let MatType: Float32ArrayConstructor | ArrayConstructor = Float32Array;

/**
 * Sets the type this library creates for a Mat3
 * @param Ctor the constructor for the type. Either `Float32Array` or `Array`
 * @return previous constructor for Mat3
 */
export function setDefaultType(Ctor: Float32ArrayConstructor | ArrayConstructor) {
    const OldType = MatType;
    MatType = Ctor;
    return OldType;
}

/**
 * Takes two Matrix3s, a and b, and computes the product in the order
 * that pre-composes b with a.  In other words, the matrix returned will
 * @param a A matrix.
 * @param b A matrix.
 * @param dst optional matrix to store result
 * @return the result.
 */
export function multiply(a: Matrix3, b: Matrix3, dst?: Matrix3): Matrix3 {
    dst = dst || new MatType(9);
    const a00 = a[0], a01 = a[1], a02 = a[2];
    const a10 = a[3], a11 = a[4], a12 = a[5];
    const a20 = a[6], a21 = a[7], a22 = a[8];
    const b00 = b[0], b01 = b[1], b02 = b[2];
    const b10 = b[3], b11 = b[4], b12 = b[5];
    const b20 = b[6], b21 = b[7], b22 = b[8];

    dst[0] = b00 * a00 + b01 * a10 + b02 * a20;
    dst[1] = b00 * a01 + b01 * a11 + b02 * a21;
    dst[2] = b00 * a02 + b01 * a12 + b02 * a22;
    dst[3] = b10 * a00 + b11 * a10 + b12 * a20;
    dst[4] = b10 * a01 + b11 * a11 + b12 * a21;
    dst[5] = b10 * a02 + b11 * a12 + b12 * a22;
    dst[6] = b20 * a00 + b21 * a10 + b22 * a20;
    dst[7] = b20 * a01 + b21 * a11 + b22 * a21;
    dst[8] = b20 * a02 + b21 * a12 + b22 * a22;

    return dst;
}

/**
 * Creates a 3x3 identity matrix
 * @param dst optional matrix to store result
 * @return an identity matrix
 */
export function identity(dst?: Matrix3): Matrix3 {
    dst = dst || new MatType(9);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 1;
    dst[5] = 0;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 1;

    return dst;
}

/**
 * Creates a 2D projection matrix
 * @param width width in pixels
 * @param height height in pixels
 * @param dst optional matrix to store result
 * @return a projection matrix that converts from pixels to clipspace with Y = 0 at the top.
 */
export function projection(width: number, height: number, dst?: Matrix3): Matrix3 {
    dst = dst || new MatType(9);
    dst[0] = 2 / width;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = -2 / height;
    dst[5] = 0;
    dst[6] = -1;
    dst[7] = 1;
    dst[8] = 1;

    return dst;
}

/**
 * Multiplies by a 2D projection matrix
 * @param m the matrix to be multiplied
 * @param width width in pixels
 * @param height height in pixels
 * @param dst optional matrix to store result
 * @return the result
 */
export function project(m: Matrix3, width: number, height: number, dst?: Matrix3): Matrix3 {
    return multiply(m, projection(width, height), dst);
}

/**
 * Creates a 2D translation matrix
 * @param tx amount to translate in x
 * @param ty amount to translate in y
 * @param dst optional matrix to store result
 * @return a translation matrix that translates by tx and ty.
 */
export function translation(tx: number, ty: number, dst?: Matrix3): Matrix3 {
    dst = dst || new MatType(9);

    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 1;
    dst[5] = 0;
    dst[6] = tx;
    dst[7] = ty;
    dst[8] = 1;

    return dst;
}

/**
 * Multiplies by a 2D translation matrix
 * @param m the matrix to be multiplied
 * @param tx amount to translate in x
 * @param ty amount to translate in y
 * @param dst optional matrix to store result
 * @return the result
 */
export function translate(m: Matrix3, tx: number, ty: number, dst?: Matrix3): Matrix3 {
    return multiply(m, translation(tx, ty), dst);
}

/**
 * Creates a 2D rotation matrix
 * @param angleInRadians amount to rotate in radians
 * @param dst optional matrix to store result
 * @return a rotation matrix that rotates by angleInRadians
 */
export function rotation(angleInRadians: number, dst?: Matrix3): Matrix3 {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);

    dst = dst || new MatType(9);

    dst[0] = c;
    dst[1] = -s;
    dst[2] = 0;
    dst[3] = s;
    dst[4] = c;
    dst[5] = 0;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 1;

    return dst;
}

/**
 * Multiplies by a 2D rotation matrix
 * @param m the matrix to be multiplied
 * @param angleInRadians amount to rotate in radians
 * @param dst optional matrix to store result
 * @return the result
 */
export function rotate(m: Matrix3, angleInRadians: number, dst?: Matrix3): Matrix3 {
    return multiply(m, rotation(angleInRadians), dst);
}

/**
 * Creates a 2D scaling matrix
 * @param sx amount to scale in x
 * @param sy amount to scale in y
 * @param dst optional matrix to store result
 * @return a scale matrix that scales by sx and sy.
 */
export function scaling(sx: number, sy: number, dst?: Matrix3): Matrix3 {
    dst = dst || new MatType(9);

    dst[0] = sx;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = sy;
    dst[5] = 0;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 1;

    return dst;
}

/**
 * Multiplies by a 2D scaling matrix
 * @param m the matrix to be multiplied
 * @param sx amount to scale in x
 * @param sy amount to scale in y
 * @param dst optional matrix to store result
 * @return the result
 */
export function scale(m: Matrix3, sx: number, sy: number, dst?: Matrix3): Matrix3 {
    return multiply(m, scaling(sx, sy), dst);
}
