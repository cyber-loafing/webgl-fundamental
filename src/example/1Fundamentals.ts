import fg from "@/shaders/1start/fg.frag";
import vt from "@/shaders/1start/vt.vert";
import { loadShaders, createProgram, resizeCanvasToDisplaySize } from "@/utils";
import { WebglLessonsUI, SliderOptions } from '@/fundamental/ui-gl';
import { rotate, scale as scaling, identity, project, translate } from '@/fundamental/math-gl';

function setGeometry(gl: WebGLRenderingContext) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            0, 0,
            400, 0,
            0, 400]),
        gl.STATIC_DRAW);
}

var translation = [0, 0];
var angleInRadians = 0;
var scale = [1.0, 1.0];

const updatePosition = (index: number) => {
    return (event: Event, uiInfo: { value: number }) => {
        translation[index] = uiInfo.value;
        drawScene(gl, program, positionBuffer); // 重新绘制场景
    };
};
const updateRotation = (index: number) => {
    return (event: Event, uiInfo: { value: number }) => {
        angleInRadians = uiInfo.value;
        drawScene(gl, program, positionBuffer); // 重新绘制场景
    };
}

const updateScale = (index: number) => {
    return (event: Event, uiInfo: { value: number }) => {
        scale[index] = uiInfo.value;
        drawScene(gl, program, positionBuffer); // 重新绘制场景
    };
}

const createUI = (ui: WebglLessonsUI) => {
    const container = document.createElement('div');
    container.id = 'ui-container';
    document.body.appendChild(container);

    const sliderOptions_x: SliderOptions = {
        name: 'x',
        min: 0,
        max: 800,
        value: translation[0],
        slide: updatePosition(0)
    };
    const slider_x = ui.makeSlider(sliderOptions_x);
    container.appendChild(slider_x.elem);

    const sliderOptions_y: SliderOptions = {
        name: 'y',
        min: 0,
        max: 800,
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
        slide: updateRotation(0)
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
};

const drawScene = (gl: WebGLRenderingContext, program: WebGLProgram, positionBuffer: WebGLBuffer) => {
    resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const size = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

    let matrix = identity();
    matrix = project(matrix, gl.canvas.width, gl.canvas.height);
    matrix = translate(matrix, translation[0], translation[1]);
    // angle ——> 弧度
    const rad = Math.PI * angleInRadians / 180;
    matrix = rotate(matrix, rad);
    matrix = scaling(matrix, scale[0], scale[1]);
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    const primitiveType = gl.TRIANGLES;
    const offset1 = 0;
    const count = 3;
    gl.drawArrays(primitiveType, offset1, count);
};

let gl: WebGLRenderingContext;
let program: WebGLProgram;
let positionBuffer: WebGLBuffer;

export function main_fundamentals() {
    const canvas = document.querySelector("#c") as HTMLCanvasElement;
    resizeCanvasToDisplaySize(canvas);
    gl = canvas.getContext("webgl")!;
    if (!gl) {
        throw new Error("Failed to get WebGL context");
    }
    const shaders = loadShaders(gl, [{ shaderSource: vt, shaderType: gl.VERTEX_SHADER }, { shaderSource: fg, shaderType: gl.FRAGMENT_SHADER }]);
    program = createProgram(gl, shaders)!;
    positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setGeometry(gl);

    createUI(new WebglLessonsUI());
    drawScene(gl, program, positionBuffer);
}
