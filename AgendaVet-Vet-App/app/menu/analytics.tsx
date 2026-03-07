import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function AnalyticsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const [activeSection, setActiveSection] = useState<'overview' | 'finance' | 'reports'>('overview');

    const { data: metrics, isLoading } = useQuery({
        queryKey: ['admin-metrics-advanced'],
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const [petsRes, clientsRes, appointmentsRes, paymentsRes] = await Promise.all([
                supabase.from('pets').select('id', { count: 'exact' }),
                supabase.from('profiles').select('id', { count: 'exact' }),
                supabase.from('appointment_requests').select('status, id, created_at'),
                supabase.from('payments').select('amount, status, payment_date')
            ]);

            if (paymentsRes.error) {
                console.warn('Analytics: Could not fetch payments. Table might be missing.', paymentsRes.error);
            }

            const appointmentsData = appointmentsRes.data || [];
            const completed = appointmentsData.filter(a => a.status === 'completed').length;
            const cancelled = appointmentsData.filter(a => a.status === 'cancelled').length;

            const todayAppointments = appointmentsData.filter(a => new Date(a.created_at) >= today).length;
            const monthAppointments = appointmentsData.filter(a => new Date(a.created_at) >= firstDayOfMonth).length;

            const paymentsData = paymentsRes.data || [];
            const paidPayments = paymentsData.filter(p => p.status === 'paid');

            const todayRevenue = paidPayments
                .filter(p => p.payment_date && new Date(p.payment_date) >= today)
                .reduce((sum, p) => sum + Number(p.amount), 0);

            const monthRevenue = paidPayments
                .filter(p => p.payment_date && new Date(p.payment_date) >= firstDayOfMonth)
                .reduce((sum, p) => sum + Number(p.amount), 0);

            const ticketMedio = paidPayments.length > 0 ? (monthRevenue / paidPayments.length) : 0;

            return {
                totalPets: petsRes.count || 0,
                totalClients: clientsRes.count || 0,
                completedAppointments: completed,
                cancelledAppointments: cancelled,
                todayAppointments,
                monthAppointments,
                todayRevenue,
                monthRevenue,
                ticketMedio
            };
        }
    });

    const generatePDF = async () => {
        try {
            const htmlContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 40px; }
                    .header h1 { color: #10B981; margin: 0; font-size: 28px; }
                    .header p { color: #666; margin-top: 5px; }
                    .section { margin-bottom: 40px; }
                    .section-title { font-size: 20px; color: #3B82F6; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
                    .grid { display: flex; flex-wrap: wrap; gap: 20px; }
                    .card { flex: 1; min-width: 45%; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
                    .card .value { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 5px; }
                    .card .label { font-size: 14px; color: #64748b; }
                    .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Relatório Financeiro & Atendimentos</h1>
                    <p>AgendaVet - Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>

                <div class="section">
                    <div class="section-title">Resumo Financeiro (Mês Atual)</div>
                    <div class="grid">
                        <div class="card">
                            <div class="value">${formatCurrency(metrics?.monthRevenue || 0)}</div>
                            <div class="label">Receita Bruta do Mês</div>
                        </div>
                        <div class="card">
                            <div class="value">${formatCurrency(metrics?.ticketMedio || 0)}</div>
                            <div class="label">Ticket Médio por Consulta Pagas</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Fluxo de Atendimentos</div>
                    <div class="grid">
                        <div class="card">
                            <div class="value">${metrics?.monthAppointments || 0}</div>
                            <div class="label">Consultas Realizadas no Mês</div>
                        </div>
                        <div class="card">
                            <div class="value">${metrics?.todayAppointments || 0}</div>
                            <div class="label">Consultas Hoje</div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    Documento gerado automaticamente pelo aplicativo Vet-App.
                </div>
            </body>
            </html>
            `;

            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false
            });

            await Sharing.shareAsync(uri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: 'Exportar Relatório Analytics'
            });

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Não foi possível gerar o relatório PDF.');
        }
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const MetricCard = ({ title, value, icon, color, subtitle = null }: any) => (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: color }]}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15', borderColor: color + '30', borderWidth: 1 }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.value, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
                {subtitle && <Text style={[styles.subtitle, { color: color }]}>{subtitle}</Text>}
            </View>
        </View>
    );

    const SectionAccordion = ({ id, title, icon, activeColor }: any) => {
        const isActive = activeSection === id;
        return (
            <TouchableOpacity
                style={[
                    styles.accordionHeader,
                    { backgroundColor: isActive ? theme.surface : theme.background, borderColor: isActive ? activeColor + '50' : theme.border }
                ]}
                onPress={() => setActiveSection(id)}
            >
                <View style={[styles.iconContainerSmall, { backgroundColor: isActive ? activeColor + '15' : theme.border }]}>
                    <Ionicons name={icon} size={20} color={isActive ? activeColor : theme.textSecondary} />
                </View>
                <Text style={[styles.accordionTitle, { color: isActive ? activeColor : theme.text }]}>{title}</Text>
                <Ionicons name={isActive ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
            </TouchableOpacity>
        );
    }

    // Mock data for charts
    const barData = [
        { value: 2, label: 'Seg' },
        { value: 5, label: 'Ter' },
        { value: 3, label: 'Qua' },
        { value: 8, label: 'Qui' },
        { value: 6, label: 'Sex' },
        { value: 9, label: 'Sáb' },
        { value: 1, label: 'Dom' },
    ];

    const lineData = [
        { value: 150, label: 'Sem 1' },
        { value: 320, label: 'Sem 2' },
        { value: 280, label: 'Sem 3' },
        { value: 540, label: 'Sem 4' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Analytics Avançado', headerBackTitle: 'Menu' }} />

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>

                    {/* OVERVIEW SECTION */}
                    <SectionAccordion id="overview" title="Visão Geral & Atendimentos" icon="calendar" activeColor="#3B82F6" />
                    {activeSection === 'overview' && (
                        <View style={styles.sectionContent}>
                            <View style={styles.grid}>
                                <MetricCard title="Agendados Hoje" value={metrics?.todayAppointments ?? 0} icon="today" color="#3B82F6" />
                                <MetricCard title="Agendados no Mês" value={metrics?.monthAppointments ?? 0} icon="calendar-number" color="#8B5CF6" />
                                <MetricCard title="Total de Pets" value={metrics?.totalPets ?? 0} icon="paw" color="#10B981" />
                                <MetricCard title="Cancelamentos" value={metrics?.cancelledAppointments ?? 0} icon="close-circle" color="#EF4444" />
                            </View>

                            <View style={[styles.chartContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.chartTitle, { color: theme.text }]}>Fluxo de Consultas (7 dias)</Text>
                                <BarChart
                                    data={barData}
                                    barWidth={22}
                                    spacing={24}
                                    roundedTop
                                    roundedBottom
                                    hideRules
                                    xAxisThickness={0}
                                    yAxisThickness={0}
                                    yAxisTextStyle={{ color: theme.textSecondary }}
                                    noOfSections={3}
                                    maxValue={10}
                                    frontColor="#3B82F6"
                                    isAnimated
                                />
                            </View>
                        </View>
                    )}

                    {/* FINANCE SECTION */}
                    <SectionAccordion id="finance" title="Visão Financeira" icon="wallet" activeColor="#10B981" />
                    {activeSection === 'finance' && (
                        <View style={styles.sectionContent}>
                            <View style={styles.grid}>
                                <MetricCard
                                    title="Receita Hoje"
                                    value={formatCurrency(metrics?.todayRevenue || 0)}
                                    icon="cash"
                                    color="#10B981"
                                />
                                <MetricCard
                                    title="Receita do Mês"
                                    value={formatCurrency(metrics?.monthRevenue || 0)}
                                    icon="podium"
                                    color="#8B5CF6"
                                />
                                <MetricCard
                                    title="Ticket Médio"
                                    value={formatCurrency(metrics?.ticketMedio || 0)}
                                    icon="analytics"
                                    color="#F59E0B"
                                />
                                <MetricCard
                                    title="Consultas Pagas"
                                    value={metrics?.completedAppointments ?? 0}
                                    icon="checkmark-done-circle"
                                    color="#3B82F6"
                                />
                            </View>

                            <View style={[styles.chartContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.chartTitle, { color: theme.text }]}>Evolução da Receita (Mês)</Text>
                                <LineChart
                                    data={lineData}
                                    color="#10B981"
                                    thickness={3}
                                    hideRules
                                    xAxisThickness={0}
                                    yAxisThickness={0}
                                    yAxisTextStyle={{ color: theme.textSecondary }}
                                    noOfSections={3}
                                    dataPointsColor="#10B981"
                                    dataPointsRadius={4}
                                    isAnimated
                                    areaChart
                                    startFillColor="#10B981"
                                    startOpacity={0.4}
                                    endFillColor="#10B981"
                                    endOpacity={0.05}
                                />
                            </View>
                        </View>
                    )}

                    {/* REPORTS SECTION */}
                    <SectionAccordion id="reports" title="Exportar Relatórios" icon="document-text" activeColor="#8B5CF6" />
                    {activeSection === 'reports' && (
                        <View style={[styles.sectionContent, styles.reportsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Ionicons name="documents" size={64} color="#8B5CF6" style={{ alignSelf: 'center', marginBottom: 16, opacity: 0.8 }} />
                            <Text style={[styles.reportsTitle, { color: theme.text }]}>Gerador de Relatórios Premium</Text>
                            <Text style={[styles.reportsDesc, { color: theme.textSecondary }]}>
                                Em breve! Selecione um período e exporte um arquivo PDF sofisticado com todas as métricas detalhadas, fluxos de caixa e evoluções de pacientes.
                            </Text>

                            <TouchableOpacity style={[styles.btnGerar, { backgroundColor: theme.primary }]}>
                                <Ionicons name="print" size={20} color="#fff" />
                                <Text style={styles.btnGerarText}>Gerar Relatório (PDF)</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { padding: 16, paddingBottom: 40 },

    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        marginTop: 4,
    },
    iconContainerSmall: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    accordionTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
    },
    sectionContent: {
        marginBottom: 20,
        paddingHorizontal: 4,
    },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    card: { flex: 1, minWidth: '45%', padding: 20, borderRadius: 20, borderWidth: 1, gap: 14, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    iconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    info: { gap: 4 },
    value: { fontSize: 24, fontWeight: '800' },
    title: { fontSize: 13, fontWeight: '600' },
    subtitle: { fontSize: 12, fontWeight: '700', marginTop: 2 },

    chartContainer: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        alignSelf: 'flex-start',
        marginBottom: 20,
    },

    reportsContainer: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    reportsTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    reportsDesc: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    btnGerar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        width: '100%',
    },
    btnGerarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});
