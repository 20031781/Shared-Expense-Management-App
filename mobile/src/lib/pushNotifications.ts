import Constants from 'expo-constants';
import {Platform} from 'react-native';

export type PushLimitation = 'expo-go' | 'web';

export type PushCapability =
    | { supported: true }
    | { supported: false; limitation: PushLimitation };

export const getPushCapability = (): PushCapability => {
    if (Platform.OS === 'web') {
        return {supported: false, limitation: 'web'};
    }
    if (Constants.appOwnership === 'expo') {
        return {supported: false, limitation: 'expo-go'};
    }
    return {supported: true};
};

export const getLimitationDocumentationUrl = (limitation: PushLimitation): string => {
    switch (limitation) {
    case 'expo-go':
        return 'https://docs.expo.dev/develop/development-builds/introduction/';
    case 'web':
    default:
        return 'https://docs.expo.dev/push-notifications/overview/';
    }
};
