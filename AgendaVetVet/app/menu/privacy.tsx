import React from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[isDark ? 'dark' : 'light'];

    return (
        <ImageBackground
            source={require('@/assets/images/wallpaper.png')}
            style={styles.container}
            imageStyle={{ opacity: isDark ? 0.05 : 0.3 }}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? theme.background + 'D9' : theme.background + '99' }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Privacidade e Dados</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    <View style={[styles.card, { backgroundColor: theme.surface }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#3B82F615' }]}>
                            <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Nosso Compromisso com a Segurança</Text>
                        <Text style={[styles.cardText, { color: theme.textSecondary }]}>
                            A AgendaVet valoriza a privacidade dos dados de suas clínicas, tutores e pacientes. Esta política explica de forma clara e objetiva como coletamos, usamos e protegemos essas informações em conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/2018).
                        </Text>
                    </View>

                    <View style={[styles.section, { borderLeftColor: theme.primary }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Dados Coletados</Text>
                        <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
                            Para viabilizar o uso do aplicativo, coletamos as seguintes informações essenciais:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={[styles.bullet, { color: theme.textSecondary }]}><Text style={{ fontWeight: 'bold', color: theme.text }}>Tutores:</Text> Nome, E-mail, Telefone (para contato e WhatsApp) e endereço completo.</Text>
                            <Text style={[styles.bullet, { color: theme.textSecondary }]}><Text style={{ fontWeight: 'bold', color: theme.text }}>Pacientes (Pets):</Text> Nome, espécie, raça, sexo, idade, fotos e histórico clínico-médico (vacinas, exames, internações e receituário).</Text>
                            <Text style={[styles.bullet, { color: theme.textSecondary }]}><Text style={{ fontWeight: 'bold', color: theme.text }}>Clínicas e Veterinários:</Text> Dados de identificação profissional (CRMV) e dados organizacionais (CNPJ).</Text>
                        </View>
                    </View>

                    <View style={[styles.section, { borderLeftColor: theme.primary }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Finalidade da Coleta</Text>
                        <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
                            A captura desses dados tem como único objetivo garantir o melhor acompanhamento médico-veterinário:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Manutenção e registro contínuo da saúde do paciente.</Text>
                            <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Envio de notificações sobre agendamentos, vacinas e tratamentos para o tutor.</Text>
                            <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Prestação de contas financeiras (cobranças e recibos eletrônicos).</Text>
                        </View>
                    </View>

                    <View style={[styles.section, { borderLeftColor: '#10B981' }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Isolamento e Segurança (RLS)</Text>
                        <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
                            Nosso sistema é construído sobre uma arquitetura de banco de dados multi-inquilino (Multi-Tenant) protegida com <Text style={{ fontWeight: 'bold', color: theme.text }}>Row Level Security (RLS)</Text>.
                        </Text>
                        <Text style={[styles.sectionText, { color: theme.textSecondary, marginTop: 10 }]}>
                            Isso significa que **nenhuma clínica tem acesso aos dados de pacientes de outra clínica**. As informações ficam rigorosamente invisíveis e bloqueadas em nível criptográfico de linha no banco de dados. Os tutores só visualizarão as informações exclusivas de seus respectivos Pets.
                        </Text>
                    </View>

                    <View style={[styles.section, { borderLeftColor: theme.primary }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Compartilhamento de Dados</Text>
                        <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
                            A AgendaVet **não vende, aluga ou compartilha** dados médicos, contatos ou informações sensíveis com terceiros para fins de marketing. O acesso é estritamente limitado à clínica veterinária onde o paciente é atendido e aos profissionais nela vinculados.
                        </Text>
                    </View>

                    <View style={[styles.section, { borderLeftColor: theme.primary }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Direitos do Tutor</Text>
                        <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
                            Como tutor de um paciente, você possui direito a:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Confirmar a existência de tratamento dos seus dados.</Text>
                            <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Acessar uma cópia completa do histórico do seu animal.</Text>
                            <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Solicitar a cópia em formato PDF a qualquer momento.</Text>
                            <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Solicitar exclusão ou inativação dos dados cadastrais (exceto registros clínicos essenciais obrigatoriamente retidos por tempo estipulado pelo CFMV).</Text>
                        </View>
                    </View>

                    <View style={[styles.card, { backgroundColor: theme.surface, marginTop: 10, borderColor: theme.border, borderWidth: 1 }]}>
                        <Text style={[styles.cardTitle, { color: theme.text, fontSize: 16, marginBottom: 8 }]}>Dúvidas sobre Privacidade?</Text>
                        <Text style={[styles.cardText, { color: theme.textSecondary, fontSize: 14 }]}>
                            Se tiver perguntas ou precisar solicitar a exclusão de sua conta, por favor entre em contato com o suporte ou gerência da sua Clínica Veterinária.
                        </Text>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    scrollContent: { padding: 20, paddingBottom: 60 },

    card: { padding: 24, borderRadius: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
    iconBox: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
    cardText: { fontSize: 15, lineHeight: 24 },

    section: { marginBottom: 24, paddingLeft: 16, borderLeftWidth: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
    sectionText: { fontSize: 15, lineHeight: 24 },

    bulletList: { marginTop: 12, gap: 10 },
    bullet: { fontSize: 14, lineHeight: 22, paddingLeft: 8 },
});
