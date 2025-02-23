import React from 'react';
import { Direction, SlotCounterRef, StartAnimationOptions, Value } from './types/common';
interface AnimateOnVisibleOptions {
    rootMargin?: string;
    triggerOnce?: boolean;
}
interface Props {
    value: Value;
    startValue?: Value;
    startValueOnce?: boolean;
    duration?: number;
    speed?: number;
    delay?: number;
    dummyCharacters?: string[] | JSX.Element[];
    dummyCharacterCount?: number;
    autoAnimationStart?: boolean;
    animateUnchanged?: boolean;
    hasInfiniteList?: boolean;
    containerClassName?: string;
    charClassName?: string;
    valueClassName?: string;
    numberSlotClassName?: string;
    numberClassName?: string;
    sequentialAnimationMode?: boolean;
    useMonospaceWidth?: boolean;
    direction?: Direction;
    debounceDelay?: number;
    animateOnVisible?: boolean | AnimateOnVisibleOptions;
    startFromLastDigit?: boolean;
    onAnimationStart?: () => void;
    onAnimationEnd?: () => void;
}
declare const _default: React.MemoExoticComponent<React.ForwardRefExoticComponent<Props & React.RefAttributes<SlotCounterRef>>>;
export default _default;
export type { SlotCounterRef, StartAnimationOptions };
