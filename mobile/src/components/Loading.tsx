import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useAppTheme} from '@theme';

interface LoadingProps {
    size?: 'small' | 'large';
    color?: string;
}

export const Loading: React.FC<LoadingProps> = ({size = 'large', color}) => {
    const {colors} = useAppTheme();
    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <ActivityIndicator size={size} color={color ?? colors.accent}/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
