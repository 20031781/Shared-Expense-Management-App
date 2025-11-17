import React, {useMemo} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AppColors, useAppTheme} from '@theme';

type OnboardingStep = {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    onPress?: () => void;
    disabled?: boolean;
    completed?: boolean;
    hint?: string;
};

interface OnboardingChecklistProps {
    title: string;
    subtitle?: string;
    helper?: string;
    steps: OnboardingStep[];
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({title, subtitle, helper, steps}) => {
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            <View style={styles.steps}>
                {steps.map((step) => {
                    const disabled = step.disabled && !step.completed;
                    return (
                        <View key={step.id} style={[styles.stepCard, step.completed && styles.stepCardCompleted]}>
                            <View style={styles.stepHeader}>
                                <View style={[styles.stepBadge, step.completed && styles.stepBadgeCompleted]}>
                                    <Ionicons
                                        name={step.completed ? 'checkmark' : 'bulb-outline'}
                                        size={16}
                                        color={step.completed ? colors.accentText : colors.accent}
                                    />
                                </View>
                                <View style={styles.stepCopy}>
                                    <Text style={styles.stepTitle}>{step.title}</Text>
                                    <Text style={styles.stepDescription}>{step.description}</Text>
                                </View>
                            </View>
                            <View style={styles.stepFooter}>
                                <TouchableOpacity
                                    onPress={step.onPress}
                                    disabled={!step.onPress || disabled}
                                    style={[styles.stepButton, disabled && styles.stepButtonDisabled]}
                                >
                                    <Ionicons
                                        name={step.completed ? 'checkmark-circle' : 'arrow-forward-circle'}
                                        size={18}
                                        color={step.completed ? colors.success : colors.accent}
                                    />
                                    <Text
                                        style={[styles.stepButtonText, disabled && styles.stepButtonTextDisabled]}
                                    >
                                        {step.completed ? step.actionLabel : step.actionLabel}
                                    </Text>
                                </TouchableOpacity>
                                {step.hint && (
                                    <Text style={styles.stepHint}>{step.hint}</Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
            {helper && <Text style={styles.helper}>{helper}</Text>}
        </View>
    );
};

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            gap: 12,
        },
        title: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
        },
        subtitle: {
            fontSize: 14,
            color: colors.secondaryText,
        },
        helper: {
            fontSize: 12,
            color: colors.secondaryText,
        },
        steps: {
            gap: 12,
        },
        stepCard: {
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.surfaceSecondary,
            gap: 12,
        },
        stepCardCompleted: {
            borderWidth: 1,
            borderColor: colors.success,
        },
        stepHeader: {
            flexDirection: 'row',
            gap: 12,
        },
        stepBadge: {
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
        },
        stepBadgeCompleted: {
            backgroundColor: colors.success,
        },
        stepCopy: {
            flex: 1,
            gap: 4,
        },
        stepTitle: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
        },
        stepDescription: {
            fontSize: 13,
            color: colors.secondaryText,
        },
        stepFooter: {
            gap: 6,
        },
        stepButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 6,
        },
        stepButtonDisabled: {
            opacity: 0.5,
        },
        stepButtonText: {
            fontWeight: '600',
            color: colors.accent,
        },
        stepButtonTextDisabled: {
            color: colors.secondaryText,
        },
        stepHint: {
            fontSize: 12,
            color: colors.secondaryText,
        },
    });
