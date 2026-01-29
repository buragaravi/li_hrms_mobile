import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { LayoutDashboard, Users, Calendar, Clock, Bell, User, ArrowUpRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Standardized Premium Background */}
            <LinearGradient
                colors={['#FFFFFE', '#F7FEE7', '#FFFFFF']}
                className="absolute inset-0"
            />

            <SafeAreaView className="flex-1">
                <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>
                    {/* Premium Header */}
                    <MotiView
                        from={{ opacity: 0, translateY: -20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        className="flex-row justify-between items-start mb-10"
                    >
                        <View>
                            <View className="flex-row items-center mb-1">
                                <View className="w-8 h-1 bg-primary rounded-full mr-2" />
                                <Text className="text-neutral-400 font-bold tracking-widest text-[10px] uppercase">Tuesday, 20 Jan</Text>
                            </View>
                            <Text className="text-neutral-900 text-4xl font-black tracking-tight">Main<Text className="text-primary">.</Text>Dash</Text>
                        </View>
                        <TouchableOpacity className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-sm border border-neutral-100">
                            <Bell size={24} color="#0F172A" strokeWidth={2.5} />
                            <View className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white" />
                        </TouchableOpacity>
                    </MotiView>

                    {/* High-Fidelity Highlight Card */}
                    <MotiView
                        from={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 200 }}
                        className="mb-10"
                    >
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="rounded-[40px] p-8 shadow-2xl shadow-emerald-500/30"
                        >
                            <View className="flex-row justify-between items-start mb-6">
                                <View>
                                    <Text className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">Company Status</Text>
                                    <Text className="text-white text-4xl font-black tracking-tighter">92<Text className="text-emerald-300">%</Text></Text>
                                </View>
                                <View className="w-14 h-14 bg-white/10 rounded-3xl items-center justify-center border border-white/20">
                                    <Users size={28} color="white" strokeWidth={2.5} />
                                </View>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <View className="h-2 flex-1 bg-white/20 rounded-full mr-6 overflow-hidden">
                                    <View className="h-full w-[92%] bg-white rounded-full" />
                                </View>
                                <View className="flex-row items-center">
                                    <ArrowUpRight size={14} color="#D1FAE5" strokeWidth={3} />
                                    <Text className="text-white text-xs font-black ml-1">8.2%</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </MotiView>

                    {/* Quick Access Grid */}
                    <Text className="text-neutral-900 text-lg font-black tracking-tight mb-6">Core Operations</Text>
                    <View className="flex-row flex-wrap justify-between gap-5 mb-10">
                        {[
                            { label: 'Attendance', icon: Clock, color: '#10B981', bg: '#ECFDF5' },
                            { label: 'Leaves', icon: Calendar, color: '#F59E0B', bg: '#FFFBEB' },
                            { label: 'Profile', icon: User, color: '#6366F1', bg: '#EEF2FF' },
                            { label: 'Analytics', icon: LayoutDashboard, color: '#F43F5E', bg: '#FFF1F2' },
                        ].map((item, idx) => (
                            <MotiView
                                key={idx}
                                from={{ opacity: 0, translateY: 10 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ delay: 300 + (idx * 100) }}
                                className="w-[46.5%] bg-white p-6 rounded-[32px] border-2 border-neutral-50 shadow-sm shadow-neutral-100 items-center justify-center"
                            >
                                <View style={{ backgroundColor: item.bg }} className="w-16 h-16 rounded-[24px] items-center justify-center mb-4 border border-white shadow-inner">
                                    <item.icon size={28} color={item.color} strokeWidth={2.5} />
                                </View>
                                <Text className="text-neutral-900 font-bold text-sm tracking-tight">{item.label}</Text>
                            </MotiView>
                        ))}
                    </View>

                    {/* Approvals Section */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-neutral-900 text-lg font-black tracking-tight">Pending Tasks</Text>
                        <TouchableOpacity>
                            <Text className="text-primary font-bold text-xs uppercase tracking-widest">View All</Text>
                        </TouchableOpacity>
                    </View>

                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 700 }}
                        className="bg-white rounded-[32px] p-8 border-2 border-neutral-50 shadow-xl shadow-neutral-100/50 mb-24"
                    >
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row -space-x-4">
                                {[1, 2, 3].map(i => (
                                    <View key={i} className="w-12 h-12 rounded-full bg-neutral-100 border-4 border-white items-center justify-center shadow-sm">
                                        <User size={18} color="#94A6B8" strokeWidth={2.5} />
                                    </View>
                                ))}
                                <View className="w-12 h-12 rounded-full bg-primary/10 border-4 border-white items-center justify-center shadow-sm">
                                    <Text className="text-primary text-xs font-black">+8</Text>
                                </View>
                            </View>
                            <View className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                                <Text className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Active Now</Text>
                            </View>
                        </View>
                        <Text className="text-3xl font-black text-neutral-900 tracking-tighter">8 Requests</Text>
                        <Text className="text-neutral-400 font-medium text-sm mt-1">Pending leaves and permission approvals</Text>
                    </MotiView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
