// Reusable Button Component with glow and animation
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, gradients } from '../theme/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Button({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 10, stiffness: 200 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    };

    const getButtonStyle = () => {
        if (variant === 'secondary') {
            return styles.secondaryButton;
        }
        if (variant === 'danger') {
            return styles.dangerButton;
        }
        return null;
    };

    const getGradientColors = () => {
        if (variant === 'secondary') {
            return ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];
        }
        if (variant === 'danger') {
            return ['#ef4444', '#dc2626'];
        }
        return gradients.primary;
    };

    return (
        <AnimatedTouchable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={[animatedStyle, styles.buttonWrapper, style]}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={getGradientColors()}
                style={[styles.button, getButtonStyle(), disabled && styles.disabled]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                {loading ? (
                    <ActivityIndicator color={theme.colors.text.primary} />
                ) : (
                    <Text style={[styles.buttonText, textStyle]}>{title}</Text>
                )}
            </LinearGradient>
        </AnimatedTouchable>
    );
}

const styles = StyleSheet.create({
    buttonWrapper: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    button: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
    },
    dangerButton: {
        // Danger styles in gradient
    },
    disabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
    },
});
