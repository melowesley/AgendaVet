import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AICopilot } from '@/components/ui/AICopilot';
import { View } from 'react-native';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[isDark ? 'dark' : 'light'];

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.textMuted,
                    tabBarStyle: {
                        backgroundColor: theme.surface,
                        borderTopColor: theme.border,
                        height: 60,
                        paddingBottom: 10,
                        paddingTop: 5,
                        display: 'flex',
                    },
                    headerShown: false,
                }}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Início',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="grid-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="prontuario"
                    options={{
                        title: 'Prontuário',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="medical-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="agenda"
                    options={{
                        title: 'Agenda',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="calendar-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="internacao"
                    options={{
                        title: 'Internação',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="bed-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="perfil"
                    options={{
                        title: 'Perfil',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="person-outline" size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>
            
            {/* Global AI Copilot Floating UI */}
            <AICopilot />
        </View>
    );
}
