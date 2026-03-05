import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.tabIconDefault,
                tabBarStyle: {
                    backgroundColor: theme.surface,
                    borderTopColor: theme.border,
                    borderTopWidth: 1,
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 12),
                    paddingTop: 8,
                    height: Platform.OS === 'ios' ? 68 + insets.bottom : 72 + Math.max(insets.bottom, 12),
                    elevation: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: theme.background,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                },
                headerTintColor: theme.text,
                headerTitleStyle: {
                    fontWeight: '800',
                    fontSize: 20,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Agenda do Dia',
                    tabBarLabel: 'Agenda',
                    headerTitle: '📅 Agenda do Dia',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="pacientes"
                options={{
                    title: 'Pacientes',
                    tabBarLabel: 'Pacientes',
                    headerTitle: '🐶 Pacientes',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="paw" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="solicitacoes"
                options={{
                    title: 'Solicitações',
                    tabBarLabel: 'Solicitações',
                    headerTitle: '📩 Solicitações',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="mail" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="prontuario"
                options={{
                    title: 'Prontuário',
                    tabBarLabel: 'Prontuário',
                    headerTitle: '📋 Prontuário Médico',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="medical" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: 'Menu',
                    tabBarLabel: 'Menu',
                    headerTitle: '⚙️ Opções',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
