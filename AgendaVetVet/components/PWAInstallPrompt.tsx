import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="download-outline" size={24} color="#0EA5E9" />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Instalar Aplicativo</Text>
                    <Text style={styles.subtitle}>Acesso rápido para veterinários.</Text>
                </View>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#0EA5E9' }]} onPress={handleInstall}>
                    <Text style={styles.buttonText}>Instalar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
                    <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginHorizontal: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
});
