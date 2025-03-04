import vert from '@/shaders/2DIP/vert.vert';
import frag from '@/shaders/2DIP/frag.frag';
import { loadShaders, createProgram, resizeCanvasToDisplaySize } from "@/utils";
import { OptionOptions, WebglLessonsUI } from "@/fundamental/ui-gl";

var initialSelection = 0;

// Define several convolution kernels
const kernels = {
    normal: [
        0, 0, 0,
        0, 1, 0,
        0, 0, 0
    ],
    gaussianBlur: [
        0.045, 0.122, 0.045,
        0.122, 0.332, 0.122,
        0.045, 0.122, 0.045
    ],
    gaussianBlur2: [
        1, 2, 1,
        2, 4, 2,
        1, 2, 1
    ],
    gaussianBlur3: [
        0, 1, 0,
        1, 1, 1,
        0, 1, 0
    ],
    unsharpen: [
        -1, -1, -1,
        -1, 9, -1,
        -1, -1, -1
    ],
    sharpness: [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ],
    sharpen: [
        -1, -1, -1,
        -1, 16, -1,
        -1, -1, -1
    ],
    edgeDetect: [
        -0.125, -0.125, -0.125,
        -0.125, 1, -0.125,
        -0.125, -0.125, -0.125
    ],
    edgeDetect2: [
        -1, -1, -1,
        -1, 8, -1,
        -1, -1, -1
    ],
    edgeDetect3: [
        -5, 0, 0,
        0, 0, 0,
        0, 0, 5
    ],
    edgeDetect4: [
        -1, -1, -1,
        0, 0, 0,
        1, 1, 1
    ],
    edgeDetect5: [
        -1, -1, -1,
        2, 2, 2,
        -1, -1, -1
    ],
    edgeDetect6: [
        -5, -5, -5,
        -5, 39, -5,
        -5, -5, -5
    ],
    sobelHorizontal: [
        1, 2, 1,
        0, 0, 0,
        -1, -2, -1
    ],
    sobelVertical: [
        1, 0, -1,
        2, 0, -2,
        1, 0, -1
    ],
    previtHorizontal: [
        1, 1, 1,
        0, 0, 0,
        -1, -1, -1
    ],
    previtVertical: [
        1, 0, -1,
        1, 0, -1,
        1, 0, -1
    ],
    boxBlur: [
        0.111, 0.111, 0.111,
        0.111, 0.111, 0.111,
        0.111, 0.111, 0.111
    ],
    triangleBlur: [
        0.0625, 0.125, 0.0625,
        0.125, 0.25, 0.125,
        0.0625, 0.125, 0.0625
    ],
    emboss: [
        -2, -1, 0,
        -1, 1, 1,
        0, 1, 2
    ]
};

type KernelType = keyof typeof kernels;
const kernelNames: KernelType[] = Object.keys(kernels) as KernelType[];

var image = new Image();

export function main_dip() {
    //public下面的image
    image.src = '/public/image.png';
    const ui = new WebglLessonsUI();
    createUI(ui);
    // 在网页中显示图片
    document.body.appendChild(document.createTextNode('original image:'));
    document.body.appendChild(image);
    // 显示图片名称
    // 创建一个canvas元素
    image.onload = () => {
        // 打印图片大小
        console.log(image.width, image.height);
        render(image);
    }
}


function createUI(ui: WebglLessonsUI) {
    const container = document.createElement('div');
    container.id = 'ui-container';
    document.body.appendChild(container);

    const options: OptionOptions = {
        name: 'kernel',
        value: initialSelection,
        options: Object.keys(kernels),
        change: (event, uiInfo) => {
            const kernelIdx = uiInfo.value;
            const kernelName = options.options[kernelIdx];
            // 确保kernelName是KernelType类型
            if (kernelNames.includes(kernelName as KernelType)) {
                render(image, kernelName as KernelType);
            }
        }
    };
    const select = ui.makeOption(options);
    container.appendChild(select.elem);
}

function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}

function computeKernelWeight(kernel: number[]) {
    var weight = kernel.reduce(function (prev, curr) {
        return prev + curr;
    });
    return weight <= 0 ? 1 : weight;
}

function createAndSetupTexture(gl: WebGLRenderingContext) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 设置材质，这样我们可以对任意大小的图像进行像素操作
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

function render(image: HTMLImageElement, selectedKernelName: KernelType = 'normal') {
    var canvas = document.querySelector("#c")! as HTMLCanvasElement;
    var gl = canvas.getContext("webgl")!;
    if (!gl) {
        return;
    }

    // setup GLSL program
    const shaders = loadShaders(gl, [{ shaderSource: vert, shaderType: gl.VERTEX_SHADER }, { shaderSource: frag, shaderType: gl.FRAGMENT_SHADER }]);

    var program = createProgram(gl, shaders)!;


    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");
    var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
    var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");

    // Create a buffer to put three 2d clip space points in
    var positionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Set a rectangle the same size as the image.
    setRectangle(gl, 0, 0, image.width, image.height);

    // provide texture coordinates for the rectangle.
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
    ]), gl.STATIC_DRAW);

    // 创建一个纹理并写入图像
    var originalImageTexture = createAndSetupTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
    var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
    var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");



    resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texcoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);

    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    // set the image size
    gl.uniform2f(textureSizeLocation, image.width, image.height);
    // set the kernel and it's weight
    console.log(selectedKernelName);
    gl.uniform1fv(kernelLocation, kernels[selectedKernelName]);
    gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[selectedKernelName]));

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
}

