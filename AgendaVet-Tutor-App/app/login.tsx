import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) Alert.alert('Erro ao entrar', error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) Alert.alert('Erro no cadastro', error.message);
        else Alert.alert('Sucesso', 'Verifique seu e-mail para confirmação.');
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>AgendaVet</Text>
            <Text style={styles.subtitle}>Portal do Tutor</Text>

            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Seu E-mail"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Sua Senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={signInWithEmail}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.outlineButton]}
                    onPress={signUpWithEmail}
                    disabled={loading}
                >
                    <Text style={styles.outlineButtonText}>Criar Conta</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#f0f9ff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0369a1',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 40,
    },
    formContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#f8fafc',
    },
    button: {
        backgroundColor: '#4A9FD8',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#4A9FD8',
    },
    outlineButtonText: {
        color: '#4A9FD8',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
