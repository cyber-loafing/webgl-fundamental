/**
 * Error Callback
 * @param {string} msg - error message.
 * @memberOf module:webgl-utils
 */
export type ErrorCallback = (msg: string) => void;

/**
 * Loads a shader.
 * @param {WebGLRenderingContext} gl - The WebGLRenderingContext to use.
 * @param {string} shaderSource - The shader source.
 * @param {number} shaderType - The type of shader.
 * @param {ErrorCallback} [opt_errorCallback] - callback for errors.
 * @return {WebGLShader | null} The created shader or null if there was an error.
 */
export function loadShader(gl: WebGLRenderingContext, shaderSource: string, shaderType: number, opt_errorCallback?: ErrorCallback): WebGLShader | null {
    const errFn: ErrorCallback = opt_errorCallback || ((msg: string) => console.error(msg));

    // Create the shader object
    const shader = gl.createShader(shaderType);

    if (!shader) {
        errFn('Failed to create shader.');
        return null;
    }

    // Load the shader source
    gl.shaderSource(shader, shaderSource);

    // Compile the shader
    gl.compileShader(shader);

    // Check the compile status
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
        // Something went wrong during compilation; get the error
        const lastError = gl.getShaderInfoLog(shader);
        errFn(`*** Error compiling shader: ${lastError}\n${shaderSource.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n')}`);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// 结合shaderSource和shaderType创建一个接口
export interface ShaderFile {
    shaderSource: string;
    shaderType: number;
}

/**
 * Loads a set of shaders.
 * @param {WebGLRenderingContext} gl - The WebGLRenderingContext to use.
 * @param {ShaderFile[]} shaderFiles - The shader sources and types.
 * @param {ErrorCallback} [opt_errorCallback] - callback for errors.
 * @return {WebGLShader[]} The created shaders.
 */
export function loadShaders(gl: WebGLRenderingContext, shaderFiles: ShaderFile[], opt_errorCallback?: ErrorCallback): WebGLShader[] {
    return shaderFiles.map(({ shaderSource, shaderType }) => loadShader(gl, shaderSource, shaderType, opt_errorCallback)!);
}

/**
 * Creates a program, attaches shaders, binds attrib locations, links the
 * program and calls useProgram.
 * @param {WebGLRenderingContext} gl - The WebGLRenderingContext to use.
 * @param {WebGLShader[]} shaders - The shaders to attach.
 * @param {string[]} [opt_attribs] - An array of attribs names. Locations will be assigned by index if not passed in.
 * @param {number[]} [opt_locations] - The locations for the attribs. A parallel array to opt_attribs letting you assign locations.
 * @param {ErrorCallback} [opt_errorCallback] - callback for errors. By default it just prints an error to the console on error.
 * @return {WebGLProgram | null} The created program or null if there was an error.
 */
export function createProgram(
    gl: WebGLRenderingContext,
    shaders: WebGLShader[],
    opt_attribs?: string[],
    opt_locations?: number[],
    opt_errorCallback?: ErrorCallback
): WebGLProgram | null {
    const errFn: ErrorCallback = opt_errorCallback || ((msg: string) => console.error(msg));

    const program = gl.createProgram();

    if (!program) {
        errFn('Failed to create program.');
        return null;
    }

    shaders.forEach(shader => {
        gl.attachShader(program, shader);
    });

    if (opt_attribs) {
        opt_attribs.forEach((attrib, ndx) => {
            gl.bindAttribLocation(program, opt_locations ? opt_locations[ndx] : ndx, attrib);
        });
    }

    gl.linkProgram(program);

    // Check the link status
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        // something went wrong with the link
        const lastError = gl.getProgramInfoLog(program);
        errFn(`Error in program linking: ${lastError}`);

        gl.deleteProgram(program);
        return null;
    }

    return program;
}

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier: number = 1): boolean {
    multiplier = multiplier || 1;
    const width = canvas.clientWidth * multiplier | 0;
    const height = canvas.clientHeight * multiplier | 0;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}
