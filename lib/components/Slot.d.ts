import React, { RefObject } from 'react';
export interface Props {
    index: number;
    isNew?: boolean;
    charClassName?: string;
    numbersRef: RefObject<HTMLDivElement>;
    active: boolean;
    isChanged: boolean;
    effectiveDuration: number;
    delay: number;
    value: string | number | JSX.Element;
    startValue?: string | number | JSX.Element;
    disableStartValue?: boolean;
    dummyList: (string | number | JSX.Element)[];
    hasSequentialDummyList?: boolean;
    hasInfiniteList?: boolean;
    valueClassName?: string;
    numberSlotClassName?: string;
    numberClassName?: string;
    reverse?: boolean;
    sequentialAnimationMode: boolean;
    useMonospaceWidth: boolean;
    maxNumberWidth?: number;
    onFontHeightChange?: (fontHeight: number) => void;
    speed: number;
    duration: number;
}
export interface SlotRef {
    refreshStyles: () => void;
}
declare const _default: React.MemoExoticComponent<React.ForwardRefExoticComponent<Props & React.RefAttributes<SlotRef>>>;
export default _default;
