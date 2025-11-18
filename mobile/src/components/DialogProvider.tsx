import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import {useTranslation} from '@i18n';
import {AppColors, useAppTheme} from '@theme';

export type DialogAction = {
    label: string;
    variant?: 'primary' | 'danger' | 'ghost';
    onPress?: () => void;
};

export type DialogOptions = {
    title: string;
    message?: string;
    actions?: DialogAction[];
};

interface DialogContextValue {
    showDialog: (options: DialogOptions) => void;
    dismiss: () => void;
}

const DialogContext = createContext<DialogContextValue>({
    showDialog: () => undefined,
    dismiss: () => undefined,
});

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {colors} = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const {t} = useTranslation();
    const [dialog, setDialog] = useState<DialogOptions | null>(null);

    const dismiss = useCallback(() => setDialog(null), []);

    const showDialog = useCallback((options: DialogOptions) => {
        setDialog(options);
    }, []);

    const resolvedActions = useMemo<DialogAction[]>(() => {
        if (dialog?.actions?.length) {
            return dialog.actions;
        }
        return [{label: t('common.ok'), variant: 'primary'}];
    }, [dialog?.actions, t]);

    return <DialogContext.Provider value={{showDialog, dismiss}}>
        {children}
        <Modal
            visible={!!dialog}
            transparent
            animationType="fade"
            onRequestClose={dismiss}
        >
            <TouchableWithoutFeedback onPress={dismiss}>
                <View style={styles.backdrop}>
                    <TouchableWithoutFeedback onPress={() => undefined}>
                        <View style={styles.card}>
                            {dialog && <>
                                <Text style={styles.title}>{dialog.title}</Text>
                                {dialog.message && <Text style={styles.message}>{dialog.message}</Text>}
                                <View style={styles.actions}>
                                    {resolvedActions.map((action, index) => {
                                        const key = `${action.label}-${index}`;
                                        const variantStyle = action.variant === 'danger'
                                            ? styles.actionDanger
                                            : action.variant === 'primary'
                                                ? styles.actionPrimary
                                                : styles.actionGhost;
                                        const textStyle = action.variant === 'danger'
                                            ? styles.actionLabelDanger
                                            : action.variant === 'primary'
                                                ? styles.actionLabelPrimary
                                                : styles.actionLabelGhost;
                                        return <TouchableOpacity
                                            key={key}
                                            style={[styles.actionButton, variantStyle]}
                                            onPress={() => {
                                                dismiss();
                                                action.onPress?.();
                                            }}
                                        >
                                            <Text style={[styles.actionLabel, textStyle]}>{action.label}</Text>
                                        </TouchableOpacity>;
                                    })}
                                </View>
                            </>}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    </DialogContext.Provider>;
};

export const useDialog = () => useContext(DialogContext);

const createStyles = (colors: AppColors) => StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        gap: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    message: {
        fontSize: 14,
        color: colors.secondaryText,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        borderRadius: 999,
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    actionPrimary: {
        backgroundColor: colors.accent,
    },
    actionDanger: {
        backgroundColor: colors.danger,
    },
    actionGhost: {
        backgroundColor: colors.surfaceSecondary,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionLabelPrimary: {
        color: colors.accentText,
    },
    actionLabelDanger: {
        color: colors.accentText,
    },
    actionLabelGhost: {
        color: colors.text,
    },
});
