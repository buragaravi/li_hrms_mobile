import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, StyleSheet } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { Clock, MapPin, CheckCircle2, AlertCircle, History, ChevronRight } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { api, AttendanceRecord, AttendanceDetail } from '../../src/api/client';
import { useAuthStore } from '../../src/store/useAuthStore';

const Skeleton = ({ className }: { className?: string }) => (
    <MotiView
        from={{ opacity: 0.3 }}
        animate={{ opacity: 0.7 }}
        transition={{
            loop: true,
            type: 'timing',
            duration: 1000,
        }}
        className={`bg-neutral-100 rounded-2xl ${className}`}
    />
);

export default function AttendanceScreen() {
    const { employee, user } = useAuthStore();
    const [time, setTime] = useState(new Date());
    const [status, setStatus] = useState<'checked_out' | 'checked_in'>('checked_out');
    const [todayAttendance, setTodayAttendance] = useState<AttendanceDetail | null>(null);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        console.log('Fetching attendance data for:', employee?.emp_no || user?.emp_no);
        const empNo = employee?.emp_no || user?.emp_no;

        if (!empNo) {
            console.warn('No employee number found in store');
            setIsLoading(false);
            setIsRefreshing(false);
            return;
        }

        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const startDate = thirtyDaysAgo.toISOString().split('T')[0];
            const endDate = today;

            console.log(`Calling API: /attendance/detail?employeeNumber=${empNo}&date=${today}`);
            console.log(`Calling API: /attendance/list?employeeNumber=${empNo}&startDate=${startDate}&endDate=${endDate}`);

            // Fetch history first or in parallel
            const listPromise = api.getAttendanceList({
                employeeNumber: empNo,
                startDate,
                endDate,
                limit: 10,
            });

            // Fetch today's detail separately and handle "not found" gracefully
            const detailPromise = api.getAttendanceDetail(empNo, today).catch(err => {
                if (err.response?.status === 404 || err.response?.data?.message === 'Attendance record not found') {
                    console.log('No record for today yet (Not Punched Today)');
                    return { data: null };
                }
                throw err;
            });

            const [detailRes, listRes] = await Promise.all([detailPromise, listPromise]);

            const todayData = detailRes?.data;
            const historyDocs = listRes?.data?.docs || [];

            console.log('Today Attendance Detail:', todayData);
            console.log('History fetched count:', historyDocs.length);

            setTodayAttendance(todayData);
            setHistory(historyDocs);

            // Update status based on last log if available
            if (todayData?.rawLogs && todayData.rawLogs.length > 0) {
                const logs = todayData.rawLogs;
                const lastLog = logs[logs.length - 1];
                setStatus(lastLog.type === 'IN' ? 'checked_in' : 'checked_out');
            } else {
                setStatus('checked_out');
            }
        } catch (error: any) {
            console.error('Error fetching attendance:', error?.response?.data || error.message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [employee?.emp_no, user?.emp_no]);

    useEffect(() => {
        fetchData();
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [fetchData]);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    const handleToggleClock = () => {
        // Toggle logic placeholder - in reality, this would call a check-in/out API
        setStatus(status === 'checked_in' ? 'checked_out' : 'checked_in');
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            <LinearGradient
                colors={['#FFFFFE', '#F7FEE7', '#FFFFFF']}
                className="absolute inset-0"
            />

            <SafeAreaView style={{ flex: 1 }}>
                <View className="flex-1">
                    <ScrollView
                        className="flex-1 px-8 pt-6"
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#10B981" />
                        }
                    >
                        {/* Premium Header */}
                        <View className="mb-12">
                            <View className="flex-row items-center mb-1">
                                <View className="w-8 h-1 bg-primary rounded-full mr-2" />
                                <Text className="text-neutral-400 font-bold tracking-widest text-[10px] uppercase">
                                    Welcome back, {user?.name?.split(' ')[0] || 'Member'}
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-end">
                                <Text className="text-neutral-900 text-4xl font-black tracking-tight">Logs<Text className="text-primary">.</Text>Live</Text>
                                {isLoading && !isRefreshing && <ActivityIndicator size="small" color="#10B981" />}
                            </View>
                        </View>

                        {/* High-Fidelity Clock Card */}
                        {isLoading && !isRefreshing ? (
                            <View className="bg-white rounded-[40px] p-10 items-center border-2 border-neutral-50 shadow-2xl shadow-neutral-200/50 mb-10">
                                <Skeleton className="w-40 h-4 mb-4" />
                                <Skeleton className="w-64 h-16 mb-8" />
                                <Skeleton className="w-48 h-10 rounded-2xl mb-10" />
                                <Skeleton className="w-48 h-48 rounded-full" />
                            </View>
                        ) : (
                            <MotiView
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                className="bg-white rounded-[40px] p-10 items-center border-2 border-neutral-50 shadow-2xl shadow-neutral-200/50 mb-10"
                            >
                                <Text className="text-neutral-400 font-black tracking-[4px] text-[10px] mb-4 uppercase">Current Workplace Time</Text>
                                <MotiText
                                    key={time.toLocaleTimeString()}
                                    from={{ opacity: 0.5 }}
                                    animate={{ opacity: 1 }}
                                    className="text-6xl font-black text-neutral-900 mb-6 tracking-tighter"
                                >
                                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </MotiText>

                                <View className="mb-8 items-center">
                                    <View className="flex-row items-center bg-emerald-50 px-6 py-3 rounded-2xl mb-3 border border-emerald-100/50">
                                        <MapPin size={16} color="#10B981" strokeWidth={2.5} />
                                        <Text className="text-emerald-700 text-xs ml-2 font-black italic tracking-tight">
                                            {(employee?.division?.name || user?.division?.name) ? `${employee?.division?.name || user?.division?.name} • ` : ''}
                                            {employee?.department?.name || user?.department?.name || 'Main Office'}
                                        </Text>
                                    </View>

                                    {(todayAttendance?.shiftId || employee?.shiftId) && (
                                        <View className="flex-row items-center bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100/30">
                                            <Clock size={12} color="#3B82F6" strokeWidth={2.5} />
                                            <Text className="text-blue-600 text-[10px] ml-2 font-black uppercase tracking-widest">
                                                {(todayAttendance?.shiftId || employee?.shiftId)?.name} • {(todayAttendance?.shiftId || employee?.shiftId)?.startTime} - {(todayAttendance?.shiftId || employee?.shiftId)?.endTime}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={handleToggleClock}
                                    activeOpacity={0.9}
                                    className="relative"
                                >
                                    <MotiView
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 3000, loop: true, type: 'timing' }}
                                        className={`w-48 h-48 rounded-full border-[12px] items-center justify-center ${status === 'checked_in' ? 'border-emerald-500/10 bg-emerald-500' : 'border-primary/10 bg-primary'
                                            } shadow-2xl shadow-emerald-500/40`}
                                    >
                                        <Clock size={56} color="white" strokeWidth={2.5} />
                                        <Text className="text-white font-black mt-3 text-lg uppercase tracking-tight">
                                            {status === 'checked_in' ? 'Check Out' : 'Check In'}
                                        </Text>
                                    </MotiView>
                                </TouchableOpacity>
                            </MotiView>
                        )}

                        {/* Stats Grid */}
                        <View className="flex-row justify-between mb-10">
                            <View className="w-[47%] bg-white rounded-[32px] p-6 border-2 border-neutral-50 shadow-sm items-center">
                                {isLoading && !isRefreshing ? (
                                    <>
                                        <Skeleton className="w-12 h-12 mb-4" />
                                        <Skeleton className="w-16 h-3 mb-1" />
                                        <Skeleton className="w-24 h-6" />
                                    </>
                                ) : (
                                    <>
                                        <View className="bg-emerald-50 w-12 h-12 rounded-2xl items-center justify-center mb-4 border border-emerald-100">
                                            <Clock size={24} color="#059669" strokeWidth={2.5} />
                                        </View>
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-1">Hours</Text>
                                        <Text className="text-neutral-900 text-xl font-black tracking-tight">
                                            {todayAttendance?.totalHours || '00h 00m'}
                                        </Text>
                                    </>
                                )}
                            </View>
                            <View className="w-[47%] bg-white rounded-[32px] p-6 border-2 border-neutral-50 shadow-sm items-center">
                                {isLoading && !isRefreshing ? (
                                    <>
                                        <Skeleton className="w-12 h-12 mb-4" />
                                        <Skeleton className="w-16 h-3 mb-1" />
                                        <Skeleton className="w-24 h-6" />
                                    </>
                                ) : (
                                    <>
                                        <View className="bg-amber-50 w-12 h-12 rounded-2xl items-center justify-center mb-4 border border-amber-100">
                                            <AlertCircle size={24} color="#D97706" strokeWidth={2.5} />
                                        </View>
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-1">Lateness</Text>
                                        <Text className="text-neutral-900 text-xl font-black tracking-tight">
                                            {todayAttendance?.lateMins ? `${todayAttendance.lateMins} mins` : '0 mins'}
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Professional History Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-neutral-900 text-lg font-black tracking-tight">Recent Sessions</Text>
                            <TouchableOpacity className="flex-row items-center px-4 py-2 bg-neutral-50 rounded-full border border-neutral-100">
                                <History size={14} color="#64748B" strokeWidth={2.5} />
                                <Text className="text-neutral-500 text-[10px] font-black ml-2 uppercase tracking-widest">Archive</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4 mb-32">
                            {isLoading && !isRefreshing ? (
                                [1, 2, 3].map((i) => (
                                    <View key={i} className="bg-white p-6 rounded-[32px] border-2 border-neutral-50 shadow-sm flex-row items-center mb-4">
                                        <Skeleton className="w-14 h-14 rounded-[22px]" />
                                        <View className="flex-1 ml-5">
                                            <Skeleton className="w-24 h-5 mb-2" />
                                            <Skeleton className="w-16 h-3" />
                                        </View>
                                        <Skeleton className="w-24 h-8 rounded-2xl" />
                                    </View>
                                ))
                            ) : (
                                history.map((log, idx) => (
                                    <MotiView
                                        key={log._id || idx}
                                        from={{ opacity: 0, translateX: -10 }}
                                        animate={{ opacity: 1, translateX: 0 }}
                                        transition={{ delay: idx * 100 }}
                                        style={styles.card}
                                    >
                                        <View className={`w-14 h-14 rounded-[22px] items-center justify-center border ${log.status === 'PRESENT' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                                            }`}>
                                            <CheckCircle2 size={24} color={log.status === 'PRESENT' ? '#10B981' : '#EF4444'} strokeWidth={2.5} />
                                        </View>
                                        <View className="flex-1 ml-5">
                                            <Text className="text-neutral-900 font-black text-base tracking-tight">
                                                {new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </Text>
                                            <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">{log.status}</Text>
                                        </View>
                                        <View className="items-end bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-100">
                                            <Text className="text-neutral-900 font-black text-xs">
                                                {log.inTime || '--:--'} - {log.outTime || '--:--'}
                                            </Text>
                                        </View>
                                    </MotiView>
                                ))
                            )}
                            {history.length === 0 && !isLoading && (
                                <Text className="text-center text-neutral-400 font-medium italic">No recent history found</Text>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#F9FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    }
});
