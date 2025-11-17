import {create} from 'zustand';
import {PushLimitation} from '@/lib/pushNotifications';

interface EnvironmentState {
    pushLimitation: PushLimitation | null;
    setPushLimitation: (value: PushLimitation | null) => void;
}

export const useEnvironmentStore = create<EnvironmentState>(set => ({
    pushLimitation: null,
    setPushLimitation: value => set({pushLimitation: value}),
}));
