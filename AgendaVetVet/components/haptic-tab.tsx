import { Platform } from 'react-native';

import * as Haptics from 'expo-haptics';
import { PlatformPressable } from '@react-navigation/elements';

export function HapticTab(props: React.ComponentProps<typeof PlatformPressable>) {
    return (
        <PlatformPressable
            {...props}
            onPressIn={(ev) => {
                if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                props.onPressIn?.(ev);
            }}
        />
    );
}
