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
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="download-outline" size={24} color="#007AFF" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Instalar Aplicativo</Text>
          <Text style={styles.subtitle}>Adicione à sua tela inicial para acesso rápido.</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleInstall}>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: '#007AFF',
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
