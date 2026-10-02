// Animation utilities using React Native Reanimated
import {
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    withRepeat,
    Easing,
} from 'react-native-reanimated';

// Timing configurations
export const timingConfig = {
    fast: { duration: 200, easing: Easing.inOut(Easing.ease) },
    normal: { duration: 300, easing: Easing.inOut(Easing.ease) },
    slow: { duration: 500, easing: Easing.inOut(Easing.ease) },
};

export const springConfig = {
    damping: 15,
    stiffness: 150,
    mass: 1,
};

// Fade animations
export const fadeIn = (duration = 300) => {
    return withTiming(1, { duration, easing: Easing.inOut(Easing.ease) });
};

export const fadeOut = (duration = 300) => {
    return withTiming(0, { duration, easing: Easing.inOut(Easing.ease) });
};

// Scale animations
export const scaleIn = () => {
    return withSpring(1, springConfig);
};

export const scaleOut = () => {
    return withSpring(0.95, springConfig);
};

export const scalePressIn = () => {
    return withSpring(0.95, { damping: 10, stiffness: 200 });
};

export const scalePressOut = () => {
    return withSpring(1, { damping: 10, stiffness: 200 });
};

// Staggered list animation
export const staggeredFadeIn = (index, itemCount = 10) => {
    const delay = Math.min(index * 100, 1000); // Max 1 second total delay
    return withDelay(delay, withTiming(1, timingConfig.normal));
};

export const staggeredSlideIn = (index) => {
    const delay = index * 80;
    return withDelay(delay, withSpring(0, springConfig));
};

// Slide animations
export const slideInFromRight = () => {
    return withTiming(0, timingConfig.normal);
};

export const slideInFromLeft = () => {
    return withTiming(0, timingConfig.normal);
};

export const slideInFromBottom = () => {
    return withTiming(0, timingConfig.normal);
};

// Pulse animation (for notifications/badges)
export const pulse = () => {
    return withRepeat(
        withSequence(
            withTiming(1.1, { duration: 600 }),
            withTiming(1, { duration: 600 })
        ),
        -1,
        true
    );
};

// Shake animation (for errors)
export const shake = () => {
    return withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
    );
};

// Rotation animation
export const rotate = (duration = 1000) => {
    return withRepeat(
        withTiming(360, { duration, easing: Easing.linear }),
        -1,
        false
    );
};

// Swipe gesture values
export const SWIPE_THRESHOLD = 100;
export const SWIPE_VELOCITY_THRESHOLD = 500;

export default {
    fadeIn,
    fadeOut,
    scaleIn,
    scaleOut,
    scalePressIn,
    scalePressOut,
    staggeredFadeIn,
    staggeredSlideIn,
    slideInFromRight,
    slideInFromLeft,
    slideInFromBottom,
    pulse,
    shake,
    rotate,
    timingConfig,
    springConfig,
};
