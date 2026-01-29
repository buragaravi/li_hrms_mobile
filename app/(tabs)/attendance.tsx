import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { Clock, MapPin, CheckCircle2, AlertCircle, History, ChevronRight } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function AttendanceScreen() {
    const [time, setTime] = useState(new Date());
    const [status, setStatus] = useState<'checked_out' | 'checked_in'>('checked_out');

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleToggleClock = () => {
        setStatus(status === 'checked_in' ? 'checked_out' : 'checked_in');
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            <LinearGradient
                colors={['#FFFFFE', '#F7FEE7', '#FFFFFF']}
                className="absolute inset-0"
            />

            <SafeAreaView className="flex-1">
                <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>
                    {/* Premium Header */}
                    <View className="mb-12">
                        <View className="flex-row items-center mb-1">
                            <View className="w-8 h-1 bg-primary rounded-full mr-2" />
                            <Text className="text-neutral-400 font-bold tracking-widest text-[10px] uppercase">Live Tracking</Text>
                        </View>
                        <Text className="text-neutral-900 text-4xl font-black tracking-tight">Logs<Text className="text-primary">.</Text>Live</Text>
                    </View>

                    {/* High-Fidelity Clock Card */}
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
                            className="text-6xl font-black text-neutral-900 mb-8 tracking-tighter"
                        >
                            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </MotiText>

                        <View className="flex-row items-center bg-emerald-50 px-6 py-3 rounded-2xl mb-10 border border-emerald-100/50">
                            <MapPin size={16} color="#10B981" strokeWidth={2.5} />
                            <Text className="text-emerald-700 text-xs ml-2 font-black italic tracking-tight">Main Office, Hyderabad</Text>
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

                    {/* Stats Grid */}
                    <View className="flex-row justify-between mb-10">
                        <View className="w-[47%] bg-white rounded-[32px] p-6 border-2 border-neutral-50 shadow-sm items-center">
                            <View className="bg-emerald-50 w-12 h-12 rounded-2xl items-center justify-center mb-4 border border-emerald-100">
                                <Clock size={24} color="#059669" strokeWidth={2.5} />
                            </View>
                            <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-1">Hours</Text>
                            <Text className="text-neutral-900 text-xl font-black tracking-tight">04h 20m</Text>
                        </View>
                        <View className="w-[47%] bg-white rounded-[32px] p-6 border-2 border-neutral-50 shadow-sm items-center">
                            <View className="bg-amber-50 w-12 h-12 rounded-2xl items-center justify-center mb-4 border border-amber-100">
                                <AlertCircle size={24} color="#D97706" strokeWidth={2.5} />
                            </View>
                            <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-1">Lateness</Text>
                            <Text className="text-neutral-900 text-xl font-black tracking-tight">15 mins</Text>
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
                        {[
                            { date: '19 Jan', in: '09:00 AM', out: '06:00 PM', status: 'PRESENT' },
                            { date: '18 Jan', in: '09:15 AM', out: '06:05 PM', status: 'PRESENT' },
                            { date: '17 Jan', in: '--:--', out: '--:--', status: 'ABSENT' },
                        ].map((log, idx) => (
                            <MotiView
                                key={idx}
                                from={{ opacity: 0, translateX: -10 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{ delay: idx * 100 }}
                                className="bg-white p-6 rounded-[32px] border-2 border-neutral-50 shadow-sm flex-row items-center mb-4"
                            >
                                <View className={`w-14 h-14 rounded-[22px] items-center justify-center border ${log.status === 'PRESENT' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                                    }`}>
                                    <CheckCircle2 size={24} color={log.status === 'PRESENT' ? '#10B981' : '#EF4444'} strokeWidth={2.5} />
                                </View>
                                <View className="flex-1 ml-5">
                                    <Text className="text-neutral-900 font-black text-base tracking-tight">{log.date}</Text>
                                    <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">{log.status}</Text>
                                </View>
                                <View className="items-end bg-neutral-50 px-4 py-2 rounded-2xl border border-neutral-100">
                                    <Text className="text-neutral-900 font-black text-xs">{log.in} - {log.out}</Text>
                                </View>
                            </MotiView>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
