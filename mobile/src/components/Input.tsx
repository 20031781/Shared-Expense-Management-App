import React, {useMemo} from 'react';
import {StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle,} from 'react-native';
import {AppColors, useAppTheme} from '@theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
                                                label,
                                                error,
                                                containerStyle,
                                                style,
                                                ...props
                                            }) => {
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={colors.placeholder}
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            marginVertical: 8,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.secondaryText,
            marginBottom: 8,
        },
        input: {
            backgroundColor: colors.inputBackground,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: colors.text,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        inputError: {
            borderColor: colors.danger,
        },
        error: {
            fontSize: 12,
            color: colors.danger,
            marginTop: 4,
        },
    });
