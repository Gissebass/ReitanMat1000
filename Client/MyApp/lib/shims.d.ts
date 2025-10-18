// app/types/shims.d.ts

declare module "base-64" {
  export function encode(input: string): string;
  export function decode(input: string): string;
}

declare module "react-native-canvas" {
  export class Canvas {
    width: number;
    height: number;
    getContext(type: "2d"): CanvasRenderingContext2D;
  }
  export class Image {
    constructor(canvas?: Canvas);
    src: string;
    width: number;
    height: number;
    addEventListener(
      type: "load" | "error",
      listener: () => void
    ): void;
  }
}
