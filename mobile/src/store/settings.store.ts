import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {persist, createJSONStorage} from 'zustand/middleware';

export type ChartAnimationSpeed = 'fast' | 'medium' | 'slow';

interface SettingsState {
    chartAnimationSpeed: ChartAnimationSpeed;
    setChartAnimationSpeed: (speed: ChartAnimationSpeed) => void;
}

export const useSettingsStore = create<SettingsState>()(persist(
    set => ({
        chartAnimationSpeed: 'fast',
        setChartAnimationSpeed: speed => set({chartAnimationSpeed: speed}),
    }),
    {
        name: 'app_settings',
        storage: createJSONStorage(() => AsyncStorage),
    }
));
