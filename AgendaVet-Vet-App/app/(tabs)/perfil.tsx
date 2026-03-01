import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="person-circle-outline" size={64} color={theme.textMuted} />
                <Text style={[styles.title, { color: theme.text }]}>Perfil</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Em construção — Plano 7 🚀
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 40,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    title: { fontSize: 22, fontWeight: '800' },
    subtitle: { fontSize: 15, opacity: 0.7 },
});
