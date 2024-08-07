attribute vec2 a_position;
uniform mat3 u_matrix;
uniform vec2 u_resolution;
uniform vec2 u_translation;

void main(){
    // 加上平移量
    vec2 position=a_position+u_translation;
    
    // 从像素坐标转换到 0.0 到 1.0
    vec2 zeroToOne=position/u_resolution;
    
    // convert from 0->1 to 0->2
    vec2 zeroToTwo=zeroToOne*2.;
    
    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace=zeroToTwo-1.;
    
    gl_Position=vec4((u_matrix*vec3(a_position,1)).xy,0,1);
}