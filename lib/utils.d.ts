/// <reference types="react" />
import { Value } from './types/common';
export declare const mergeClassNames: (...args: (string | null | undefined)[]) => string;
export declare const range: (start: number, end: number) => number[];
export declare const generateCyclicRange: (start: number, end: number) => number[];
export declare const random: (min: number, max: number) => number;
export declare const shuffle: (arr: (number | string | JSX.Element)[]) => (string | number | JSX.Element)[];
export declare const isJSXElement: (value: string | number | JSX.Element) => value is JSX.Element;
export declare const isJSXElementArray: (value: Value) => value is JSX.Element[];
export declare const debounce: <T extends (...args: any[]) => any>(fn: T, delay: number) => (...args: Parameters<T>) => void;
