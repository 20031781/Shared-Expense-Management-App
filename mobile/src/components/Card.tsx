import React, {useMemo} from 'react';
import {StyleSheet, TouchableOpacity, View, ViewStyle} from 'react-native';
import {AppColors, useAppTheme} from '@theme';

interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({children, onPress, style}) => {
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const Container = onPress ? TouchableOpacity : View;

    return <Container
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
    >
        {children}
    </Container>;
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        card: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginVertical: 8,
            marginHorizontal: 16,
            shadowColor: colors.shadow,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
        },
    });
