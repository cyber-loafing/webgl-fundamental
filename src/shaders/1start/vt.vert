// 一个属性变量，将会从缓冲中获取数据
attribute vec2 a_position;

uniform mat3 u_matrix;
varying vec4 v_color;

// 所有着色器都有一个main方法
void main(){
  gl_Position=vec4((u_matrix*vec3(a_position,1)).xy,0,1);
  v_color=gl_Position*.5+.5;
}