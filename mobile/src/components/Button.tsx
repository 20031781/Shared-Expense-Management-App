import React, {useMemo} from 'react';
import {ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle,} from 'react-native';
import {AppColors, useAppTheme} from '@theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
                                                  title,
                                                  onPress,
                                                  variant = 'primary',
                                                  size = 'medium',
                                                  disabled = false,
                                                  loading = false,
                                                  style,
                                                  textStyle,
                                              }) => {
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const indicatorColor = variant === 'primary' ? colors.accentText : colors.accent;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                styles[variant],
                styles[size],
                (disabled || loading) && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={indicatorColor}/>
            ) : (
                <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        button: {
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
        },
        primary: {
            backgroundColor: colors.accent,
        },
        secondary: {
            backgroundColor: colors.surfaceSecondary,
        },
        danger: {
            backgroundColor: colors.danger,
        },
        outline: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.accent,
        },
        small: {
            paddingVertical: 8,
            paddingHorizontal: 16,
        },
        medium: {
            paddingVertical: 12,
            paddingHorizontal: 24,
        },
        large: {
            paddingVertical: 16,
            paddingHorizontal: 32,
        },
        disabled: {
            opacity: 0.5,
        },
        text: {
            fontWeight: '600',
        },
        primaryText: {
            color: colors.accentText,
        },
        secondaryText: {
            color: colors.accent,
        },
        dangerText: {
            color: colors.accentText,
        },
        outlineText: {
            color: colors.accent,
        },
        smallText: {
            fontSize: 14,
        },
        mediumText: {
            fontSize: 16,
        },
        largeText: {
            fontSize: 18,
        },
    });
