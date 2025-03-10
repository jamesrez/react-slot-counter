import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import Slot, { SlotRef } from './components/Slot';
import useDebounce from './hooks/useDebounce';
import useIsomorphicLayoutEffect from './hooks/useIsomorphicLayoutEffect';
import useValueChangeEffect from './hooks/useValueChangeEffect';
import styles from './index.module.scss';
import { Direction, SlotCounterRef, StartAnimationOptions, Value } from './types/common';
import {
  debounce,
  generateCyclicRange,
  isJSXElement,
  isJSXElementArray,
  mergeClassNames,
  random,
  range,
} from './utils';

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

function SlotCounter(
  {
    value: _value,
    startValue,
    startValueOnce = false,
    duration = 0.7,
    speed = 1.4,
    delay,
    dummyCharacters,
    dummyCharacterCount = 6,
    autoAnimationStart: _autoAnimationStart = true,
    containerClassName,
    charClassName,
    valueClassName,
    numberSlotClassName,
    numberClassName,
    animateUnchanged = false,
    hasInfiniteList = false,
    sequentialAnimationMode = false,
    useMonospaceWidth = false,
    direction,
    debounceDelay,
    animateOnVisible,
    startFromLastDigit = false,
    onAnimationStart,
    onAnimationEnd,
  }: Props,
  ref: React.Ref<SlotCounterRef>,
) {
  const value = useDebounce(_value, debounceDelay ?? 0);
  const serializedValue = useMemo(
    () =>
      isJSXElementArray(value)
        ? ''
        : typeof value === 'object'
          ? JSON.stringify(value)
          : value.toString(),
    [value],
  );
  const [active, setActive] = useState(false);
  const startAnimationOptionsRef = useRef<StartAnimationOptions>();
  const slotCounterRef = useRef<HTMLSpanElement>(null);
  const numbersRef = useRef<HTMLDivElement>(null);
  const startValueRef = useRef(startValue);
  const slotRefList = useRef<SlotRef[]>([]);

  const hasAnimateOnVisible = useMemo(() => {
    if (typeof animateOnVisible === 'boolean') return animateOnVisible;
    if (typeof animateOnVisible === 'object') return true;
    return undefined;
  }, [animateOnVisible]);
  const animateOnVisibleRootMargin = useMemo(
    () => (typeof animateOnVisible === 'object' ? animateOnVisible.rootMargin : undefined),
    [animateOnVisible],
  );
  const animateOnVisibleTriggerOnce = useMemo(
    () => (typeof animateOnVisible === 'object' ? animateOnVisible.triggerOnce : undefined),
    [animateOnVisible],
  );
  const animateOnVisibleReadyRef = useRef(true);

  const autoAnimationStart = hasAnimateOnVisible ? false : _autoAnimationStart;
  const valueRef = useRef(startValue != null && !autoAnimationStart ? startValue : value);
  const prevValueRef = useRef<Props['value'] | undefined>(startValue);
  const animationCountRef = useRef(0);
  const animationExecuteCountRef = useRef(0);
  const [dummyList, setDummyList] = useState<(string | number | JSX.Element)[]>([]);
  const animationTimerRef = useRef<number>();
  const [key, setKey] = useState(0);
  const [maxNumberWidth, setMaxNumberWidth] = useState<number>();
  const isDidMountRef = useRef(false);
  const displayStartValue =
    startValue != null && (startValueOnce ? animationCountRef.current < 1 : true);

  const effectiveDummyCharacterCount =
    startAnimationOptionsRef.current?.dummyCharacterCount ?? dummyCharacterCount;
  const effectiveDuration = startAnimationOptionsRef.current?.duration ?? duration;

  /**
   * Callback Events ref for preventing unnecessary re-renders by avoiding dependency array
   */
  const eventCallbackRef = useRef({
    onAnimationStart: onAnimationStart,
    onAnimationEnd: onAnimationEnd,
  });
  eventCallbackRef.current = {
    onAnimationStart: onAnimationStart,
    onAnimationEnd: onAnimationEnd,
  };

  /**
   * Animation start and end event
   */
  const isAnimatingRef = useRef(false);

  /**
   * Detect max number width
   */
  const detectMaxNumberWidth = useCallback(() => {
    const numbersElement = numbersRef.current;

    if (!numbersElement) {
      return;
    }

    const widthList = range(0, 10).map((i) => {
      const testElement = document.createElement('span');
      testElement.className = valueClassName ?? '';
      testElement.style.position = 'absolute';
      testElement.style.top = '0';
      testElement.style.left = '-9999px';
      testElement.style.visibility = 'hidden';
      testElement.textContent = i.toString();
      numbersElement.appendChild(testElement);
      const width = testElement.getBoundingClientRect().width;
      numbersElement.removeChild(testElement);
      return width;
    });
    const maxWidth = Math.max(...widthList);
    setMaxNumberWidth(maxWidth);
  }, [valueClassName]);

  /**
   * Call detectMaxNumberWidth when component mounted
   */
  useIsomorphicLayoutEffect(() => {
    detectMaxNumberWidth();
    document.fonts?.ready.then(() => {
      detectMaxNumberWidth();
    });
  }, []);

  /**
   * Generate dummy list
   */
  useEffect(() => {
    setDummyList(
      range(0, effectiveDummyCharacterCount * duration * speed - 1).map((i) => {
        if (!dummyCharacters) return random(0, 10);

        const index = i >= dummyCharacters.length ? random(0, dummyCharacters.length) : i;
        return dummyCharacters[index];
      }),
    );
  }, [dummyCharacters, effectiveDummyCharacterCount, speed, duration]);

  /**
   * Update valueRef and prevValueRef when value is changed
   */
  if (valueRef.current !== value && isDidMountRef.current && animationExecuteCountRef.current > 0) {
    prevValueRef.current = valueRef.current;
    valueRef.current = value;
  }

  const prevValueRefList = Array.isArray(prevValueRef.current)
    ? prevValueRef.current
    : prevValueRef.current?.toString().split('') ?? [];
  const valueRefList = Array.isArray(valueRef.current)
    ? valueRef.current
    : valueRef.current?.toString().split('') ?? [];
  const startValueRefList = Array.isArray(startValueRef.current)
    ? startValueRef.current
    : startValueRef.current?.toString().split('') ?? [];

  const valueList = useMemo(
    () => (Array.isArray(value) ? value : value?.toString().split('')),
    [value],
  );
  const startValueList = useMemo(
    () => (Array.isArray(startValue) ? startValue : startValue?.toString().split('')),
    [startValue],
  );

  const isChangedValueLength = prevValueRefList.length !== valueRefList.length;
  const isChangedValueIndexList: number[] = [];
  valueRefList.forEach((char, i) => {
    const targetIndex = valueRefList.length - i - 1;
    const prev = displayStartValue ? startValueRefList : prevValueRefList;
    const prevChar = prev[targetIndex];
    const currentChar = valueRefList[targetIndex];

    const prevCharStr = ((): string => {
      if (typeof prevChar === 'string' || typeof prevChar === 'number') return prevChar.toString();
      return '';
    })();

    const currentCharStr = ((): string => {
      if (typeof currentChar === 'string' || typeof currentChar === 'number') return currentChar.toString();
      return '';
    })();

    // Only consider a position changed if:
    // 1. The length changed, or
    // 2. The character is different AND both characters are numeric, or
    // 3. animateUnchanged is true (force animation)
    if (
      isChangedValueLength ||
      (currentCharStr !== prevCharStr && /\d/.test(currentCharStr) && /\d/.test(prevCharStr)) ||
      animateUnchanged
    ) {
      isChangedValueIndexList.push(targetIndex);
    }
  });
  if (!startFromLastDigit) isChangedValueIndexList.reverse();

  /**
   * Calculate interval for each slot
   */
  const calculatedInterval = useMemo(() => {
    const MAX_INTERVAL = 0.1;
    if (delay) {
      return delay;
    }
    return Math.min(MAX_INTERVAL, effectiveDuration / valueList.length);
  }, [effectiveDuration, valueList.length, delay]);

  /**
   * Handle transition end
   */
  const handleTransitionEnd = useCallback(() => {
    eventCallbackRef.current.onAnimationEnd?.();
    isAnimatingRef.current = false;
    numbersRef.current?.removeEventListener('transitionend', handleTransitionEnd);
  }, []);

  /**
   * Start animation
   */
  const startAnimation = useCallback(() => {
    if (animationTimerRef.current) {
      window.cancelAnimationFrame(animationTimerRef.current);
    }

    // If animation is already started, call onAnimationEnd immediately
    if (isAnimatingRef.current) {
      handleTransitionEnd();
    }

    isAnimatingRef.current = true;

    // If animation is not started, add event listener
    numbersRef.current?.addEventListener('transitionend', handleTransitionEnd);

    // Call onAnimationStart callback
    eventCallbackRef.current.onAnimationStart?.();

    // Set active to false and increment animation count
    setActive(false);
    animationCountRef.current = animationExecuteCountRef.current;
    animationCountRef.current += 1;

    window.requestAnimationFrame(() => {
      // Force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const width = numbersRef.current?.offsetWidth;

      animationTimerRef.current = requestAnimationFrame(() => {
        animationExecuteCountRef.current += 1;
        setActive(true);
      });
    });
  }, [handleTransitionEnd]);

  /**
   * Get sequential dummy list
   */
  const getSequentialDummyList = useCallback(
    (index: number) => {
      const prevValue = displayStartValue ? startValue : prevValueRef.current;
      if (prevValue == null) return [];

      const prevValueStr = prevValue.toString();
      const valueStr = value.toString();

      // Get the characters at the current position
      const prevChar = prevValueStr[index] || '0';
      const currentChar = valueStr[index] || '0';

      // If characters are the same or not numeric, no animation needed
      if (prevChar === currentChar || !/\d/.test(prevChar) || !/\d/.test(currentChar)) {
        return [];
      }

      // For numeric characters, create a sequence
      const prevDigit = parseInt(prevChar, 10);
      const currentDigit = parseInt(currentChar, 10);
      const isIncreasing = prevDigit < currentDigit;

      const dummyList = isIncreasing
        ? generateCyclicRange((prevDigit + 1) % 10, currentDigit)
        : generateCyclicRange((currentDigit + 1) % 10, prevDigit);

      const effectiveDirection = startAnimationOptionsRef.current?.direction ?? direction;
      if (effectiveDirection === 'bottom-up' && !isIncreasing) {
        return dummyList.reverse();
      }
      return dummyList;
    },
    [displayStartValue, value, startValue, direction],
  );

  /**
   * Refresh styles
   */
  const refreshStyles = useCallback(() => {
    slotRefList.current.forEach((ref) => {
      ref.refreshStyles();
    });

    detectMaxNumberWidth();
  }, [detectMaxNumberWidth]);

  /**
   * Start animation when value is changed
   */
  useEffect(() => {
    if (!isDidMountRef.current && prevValueRef.current == null) return;
    if (!isDidMountRef.current && startValueRef.current != null) return;
    if (!isDidMountRef.current && !autoAnimationStart) return;

    startAnimation();
  }, [serializedValue, startAnimation, autoAnimationStart]);

  /**
   * Start animation when autoAnimationStart is changed
   */
  useEffect(() => {
    if (autoAnimationStart) startAnimation();
  }, [autoAnimationStart, startAnimation]);

  /**
   * Set isDidMount to true when component mounted
   */
  useEffect(() => {
    requestAnimationFrame(() => {
      isDidMountRef.current = true;
    });
  }, []);

  /**
   * Ref forwarding
   */
  useImperativeHandle(ref, () => ({
    startAnimation: startAnimationAll,
    refreshStyles,
    reload: () => setKey((prev) => prev + 1),
  }));

  const renderValueList =
    startValue != null && !autoAnimationStart && animationCountRef.current === 0
      ? startValueList || []
      : valueList;
  const startValueLengthDiff = (startValueList?.length || 0) - renderValueList.length;
  const { getPrevDependencies, setPrevDependenciesToSameAsCurrent } =
    useValueChangeEffect(renderValueList);
  const diffValueListCount = renderValueList.length - getPrevDependencies().length;

  /**
   * Start animation all
   */
  const startAnimationAll = useCallback(
    (options?: StartAnimationOptions) => {
      if (startValue != null && !startValueOnce) prevValueRef.current = undefined;
      startAnimationOptionsRef.current = options;
      startAnimation();
      setPrevDependenciesToSameAsCurrent();
    },
    [startValue, startValueOnce, startAnimation, setPrevDependenciesToSameAsCurrent],
  );

  const handleFontHeightChange = useMemo(
    () =>
      debounce(() => {
        refreshStyles();
      }, 0),
    [refreshStyles],
  );

  useEffect(() => {
    if (!hasAnimateOnVisible || !slotCounterRef.current) {
      return;
    }

    const animateStartObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry.isIntersecting || !animateOnVisibleReadyRef.current) {
          return;
        }

        startAnimationAll();
        animateOnVisibleReadyRef.current = false;

        if (animateOnVisibleTriggerOnce) {
          animateStartObserver.disconnect();
          visibleOnViewportObserver.disconnect();
        }
      },
      {
        rootMargin: animateOnVisibleRootMargin,
        threshold: 1,
      },
    );
    const visibleOnViewportObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry.isIntersecting) {
          animateOnVisibleReadyRef.current = true;
        }
      },
      {
        threshold: 0,
      },
    );

    animateStartObserver.observe(slotCounterRef.current);
    visibleOnViewportObserver.observe(slotCounterRef.current);

    return () => {
      animateStartObserver.disconnect();
      visibleOnViewportObserver.disconnect();
    };
  }, [
    hasAnimateOnVisible,
    animateOnVisibleRootMargin,
    animateOnVisibleTriggerOnce,
    startAnimationAll,
  ]);

  return (
    <span
      key={key}
      ref={slotCounterRef}
      className={mergeClassNames(containerClassName, styles.slot_wrap)}
    >
      {renderValueList.map((v, i) => {
        const isChanged = isChangedValueIndexList.includes(i);
        const delay =
          (isChanged ? isChangedValueIndexList.indexOf(i) : 0) * calculatedInterval;
        const prevValue = prevValueRef.current;
        const disableStartValue =
          startValue != null && (startValueOnce ? animationCountRef.current > 1 : false);

        // Only animate if the character is numeric
        const currentChar = ((): string => {
          if (typeof v === 'string' || typeof v === 'number') return v.toString();
          return '';
        })();
        const shouldAnimate = /\d/.test(currentChar);

        // Determine animation direction based on character comparison
        const prevChar = ((): string => {
          if (!prevValue) return '0';
          if (typeof prevValue === 'string' || typeof prevValue === 'number') {
            const str = prevValue.toString();
            return i < str.length ? str[i] : '0';
          }
          return '0';
        })();
        const isDecrease = shouldAnimate && /\d/.test(prevChar) &&
          parseInt(prevChar, 10) > parseInt(currentChar, 10);

        let reverseAnimation = isDecrease;
        if (startAnimationOptionsRef.current?.direction)
          reverseAnimation = startAnimationOptionsRef.current?.direction === 'top-down';
        if (direction) reverseAnimation = direction === 'top-down';

        return (
          <Slot
            key={renderValueList.length - i - 1}
            index={i}
            isNew={diffValueListCount > 0 && i < diffValueListCount}
            maxNumberWidth={maxNumberWidth}
            numbersRef={numbersRef}
            active={active && shouldAnimate}
            isChanged={isChanged && shouldAnimate}
            charClassName={charClassName}
            effectiveDuration={effectiveDuration}
            delay={delay}
            value={v}
            startValue={!disableStartValue ? startValueList?.[i + startValueLengthDiff] : undefined}
            disableStartValue={disableStartValue}
            dummyList={
              shouldAnimate && sequentialAnimationMode && (!autoAnimationStart || animationExecuteCountRef.current > 1)
                ? getSequentialDummyList(i)
                : dummyList
            }
            hasSequentialDummyList={shouldAnimate && sequentialAnimationMode && (!autoAnimationStart || animationExecuteCountRef.current > 1)}
            hasInfiniteList={hasInfiniteList}
            valueClassName={valueClassName}
            numberSlotClassName={numberSlotClassName}
            numberClassName={numberClassName}
            reverse={reverseAnimation}
            sequentialAnimationMode={sequentialAnimationMode}
            useMonospaceWidth={useMonospaceWidth}
            onFontHeightChange={handleFontHeightChange}
            speed={speed}
            duration={duration}
            ref={(ref) => {
              if (ref) slotRefList.current.push(ref);
            }}
          />
        );
      })}
    </span>
  );
}

export default memo(forwardRef(SlotCounter));
export type { SlotCounterRef, StartAnimationOptions };
