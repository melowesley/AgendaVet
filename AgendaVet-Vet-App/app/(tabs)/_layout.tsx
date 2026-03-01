import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.tabIconDefault,
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopColor: theme.border,
                    borderTopWidth: 1,
                    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
                    paddingTop: 8,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    elevation: 0,
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
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarLabel: 'Perfil',
                    headerTitle: '👤 Meu Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
