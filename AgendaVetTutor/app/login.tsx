import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, useColorScheme, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    async function signInWithEmail() {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
        });

        if (error) Alert.alert('Erro ao entrar', error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
        });

        if (error) Alert.alert('Erro no cadastro', error.message);
        else Alert.alert('Sucesso', 'Verifique seu e-mail para confirmação.');
        setLoading(false);
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            <View style={styles.header}>
                <Image
                    source={
                        colorScheme === 'dark'
                            ? require('@/assets/images/logo-transparent-light.png')
                            : require('@/assets/images/logo-transparent.png')
                    }
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={[styles.formContainer, { backgroundColor: theme.surface === '#ffffff' ? '#ffffff' : theme.surface, borderColor: theme.border }]}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>E-mail</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                        placeholder="seu@email.com"
                        placeholderTextColor={theme.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Senha</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                        placeholder="••••••••"
                        placeholderTextColor={theme.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={signInWithEmail}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Entrar</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.outlineButton, { borderColor: theme.border }]}
                    onPress={signUpWithEmail}
                    disabled={loading}
                >
                    <Text style={[styles.outlineButtonText, { color: theme.text }]}>Criar nova conta</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 200,
        height: 100,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 4,
    },
    formContainer: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 54,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    button: {
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#4A9FD8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    outlineButton: {
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        borderWidth: 1,
    },
    outlineButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
