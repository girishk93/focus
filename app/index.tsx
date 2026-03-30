import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth-store';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

export default function Index() {
    const { hasHydrated } = useAuthStore();

    if (!hasHydrated) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return <Redirect href="/(tabs)" />;
}
