import vert from '@/shaders/3-2D/vert.vert';
import frag from '@/shaders/3-2D/frag.frag';
import { loadShaders, createProgram, resizeCanvasToDisplaySize } from "@/utils";
import { WebglLessonsUI, SliderOptions } from '@/fundamental/ui-gl';
import { rotate, scale as scaling, identity, project, translate } from '@/fundamental/math-gl';


var translation = [0, 0];
var angleInRadians = 0;
var scale = [1.0, 1.0];
let gl: WebGLRenderingContext;
let program: WebGLProgram;
let positionLocation: number;
let positionBuffer: WebGLBuffer;

let colorLocation: WebGLUniformLocation;
let matrixLocation: WebGLUniformLocation;
const color = [Math.random(), Math.random(), Math.random(), 1];

export function main_2d() {
    const canvas = document.querySelector("#c") as HTMLCanvasElement;
    gl = canvas.getContext("webgl")!;
    if (!gl) {
        return;
    }
    createUI(gl);

    const shaders = loadShaders(gl, [{ shaderSource: vert, shaderType: gl.VERTEX_SHADER }, { shaderSource: frag, shaderType: gl.FRAGMENT_SHADER }]);

    // setup GLSL program
    program = createProgram(gl, shaders)!;

    // look up where the vertex data needs to go.
    positionLocation = gl.getAttribLocation(program, "a_position")!;
    matrixLocation = gl.getUniformLocation(program, "u_matrix")!;

    colorLocation = gl.getUniformLocation(program, "u_color")!;

    // Create a buffer to put positions in
    positionBuffer = gl.createBuffer()!;

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    setGeometry(gl);

    drawScene(gl, program, positionLocation, positionBuffer);
}

const createUI = (gl: WebGLRenderingContext) => {
    const ui = new WebglLessonsUI();
    const container = document.createElement('div');
    container.id = 'ui-container';
    document.body.appendChild(container);
    // 限制div的宽度
    container.style.width = gl.canvas.width + 'px';
    const sliderOptions_x: SliderOptions = {
        name: 'x',
        min: 0,
        max: gl.canvas.width,
        value: translation[0],
        slide: updatePosition(0)
    };
    const slider_x = ui.makeSlider(sliderOptions_x);
    container.appendChild(slider_x.elem);

    const sliderOptions_y: SliderOptions = {
        name: 'y',
        min: 0,
        max: gl.canvas.height,
        value: translation[1],
        slide: updatePosition(1)
    };
    const slider_y = ui.makeSlider(sliderOptions_y);
    container.appendChild(slider_y.elem);

    const sliderOptions_angle: SliderOptions = {
        name: 'angle',
        min: 0,
        max: 360,
        value: angleInRadians,
        slide: updateAngle
    };
    const slider_angle = ui.makeSlider(sliderOptions_angle);
    container.appendChild(slider_angle.elem);

    const sliderOptions_scale_x: SliderOptions = {
        name: 'scale_x',
        min: 0.1,
        max: 2,
        step: 0.01,
        value: scale[0],
        slide: updateScale(0)
    };
    const slider_scale_x = ui.makeSlider(sliderOptions_scale_x);
    container.appendChild(slider_scale_x.elem);

    const sliderOptions_scale_y: SliderOptions = {
        name: 'scale_y',
        min: 0.1,
        max: 2,
        step: 0.01,
        value: scale[1],
        slide: updateScale(1)
    };
    const slider_scale_y = ui.makeSlider(sliderOptions_scale_y);
    container.appendChild(slider_scale_y.elem);

}

const updatePosition = (index: number) => (event: Event, ui: any) => {
    translation[index] = ui.value;
    drawScene(gl, program, positionLocation, positionBuffer);
}

const updateAngle = (event: Event, ui: any) => {
    angleInRadians = ui.value;
    drawScene(gl, program, positionLocation, positionBuffer);
}

const updateScale = (index: number) => (event: Event, ui: any) => {
    scale[index] = ui.value;
    drawScene(gl, program, positionLocation, positionBuffer);
}


// Draw a the scene.
function drawScene(gl: WebGLRenderingContext, program: WebGLProgram, positionLocation: number, positionBuffer: WebGLBuffer) {
    resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

    // set the color
    gl.uniform4fv(colorLocation, color);

    let matrix = identity();
    matrix = project(matrix, gl.canvas.width, gl.canvas.height);
    matrix = translate(matrix, translation[0], translation[1]);
    // angle ——> 弧度
    const rad = Math.PI * angleInRadians / 180;
    matrix = rotate(matrix, rad);
    matrix = scaling(matrix, scale[0], scale[1]);
    matrix = translate(matrix, - 50, -75);
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
}

// 在缓冲存储构成 'F' 的值
function setGeometry(gl: WebGLRenderingContext) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // 左竖
            0, 0,
            30, 0,
            0, 150,
            0, 150,
            30, 0,
            30, 150,

            // 上横
            30, 0,
            100, 0,
            30, 30,
            30, 30,
            100, 0,
            100, 30,

            // 中横
            30, 60,
            67, 60,
            30, 90,
            30, 90,
            67, 60,
            67, 90,
        ]),
        gl.STATIC_DRAW);
}
