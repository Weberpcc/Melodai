declare module 'ogl' {
  export class Renderer {
    gl: WebGLRenderingContext & {
      canvas: HTMLCanvasElement;
    };
    constructor(options?: {
      alpha?: boolean;
      premultipliedAlpha?: boolean;
    });
    setSize(width: number, height: number): void;
    render(options: { scene: any }): void;
  }

  export class Program {
    uniforms: { [key: string]: { value: any } };
    constructor(gl: WebGLRenderingContext, options: {
      vertex: string;
      fragment: string;
      uniforms?: { [key: string]: { value: any } };
    });
  }

  export class Mesh {
    constructor(gl: WebGLRenderingContext, options: {
      geometry: any;
      program: Program;
    });
  }

  export class Color {
    constructor(r: number, g: number, b: number);
  }

  export class Triangle {
    constructor(gl: WebGLRenderingContext);
  }
}