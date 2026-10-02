// Gradient Background Component
import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, gradients } from '../theme/theme';

export default function GradientBackground({ children, style }) {
    return (
        <LinearGradient
            colors={gradients.background}
            style={[styles.gradient, style]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
});
