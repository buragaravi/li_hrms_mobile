import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Plus, Clock, CheckCircle2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function LeavesScreen() {
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
                    <View className="flex-row justify-between items-start mb-12">
                        <View>
                            <View className="flex-row items-center mb-1">
                                <View className="w-8 h-1 bg-primary rounded-full mr-2" />
                                <Text className="text-neutral-400 font-bold tracking-widest text-[10px] uppercase">Absence Tracking</Text>
                            </View>
                            <Text className="text-neutral-900 text-4xl font-black tracking-tight">Time<Text className="text-primary">.</Text>Off</Text>
                        </View>
                        <TouchableOpacity className="w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/30">
                            <Plus size={28} color="white" strokeWidth={3} />
                        </TouchableOpacity>
                    </View>

                    {/* Balance Overview */}
                    <View className="flex-row gap-5 mb-10">
                        {[
                            { label: 'Annual', count: '12', color: '#10B981', bg: '#ECFDF5' },
                            { label: 'Sick', count: '08', color: '#F43F5E', bg: '#FFF1F2' }
                        ].map((stat, idx) => (
                            <MotiView
                                key={idx}
                                from={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 100 }}
                                className="flex-1 bg-white rounded-[32px] p-6 border-2 border-neutral-50 shadow-sm"
                            >
                                <View style={{ backgroundColor: stat.bg }} className="w-10 h-10 rounded-xl items-center justify-center mb-4">
                                    <Calendar size={20} color={stat.color} strokeWidth={2.5} />
                                </View>
                                <Text className="text-neutral-900 text-3xl font-black tracking-tighter mb-1">{stat.count}</Text>
                                <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">{stat.label} Days</Text>
                            </MotiView>
                        ))}
                    </View>

                    {/* Placeholder Content */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        className="bg-white rounded-[40px] p-10 items-center justify-center border-2 border-neutral-50 shadow-2xl shadow-neutral-100/50 mb-20"
                    >
                        <View className="bg-emerald-50 w-24 h-24 rounded-[32px] items-center justify-center mb-8 border border-emerald-100">
                            <Calendar size={48} color="#10B981" strokeWidth={2.5} />
                        </View>
                        <Text className="text-neutral-900 font-black text-2xl tracking-tight mb-3">Feature Preview</Text>
                        <Text className="text-neutral-400 text-center font-medium leading-6 mb-8 px-4">
                            Detailed leave applications and team calendars are under integration.
                        </Text>

                        <View className="w-full space-y-4">
                            {[
                                { label: 'Application Pipeline', icon: Clock },
                                { label: 'Official Holidays', icon: CheckCircle2 }
                            ].map((item, i) => (
                                <View key={i} className="flex-row items-center bg-neutral-50 p-5 rounded-3xl border border-neutral-100">
                                    <View className="bg-white w-10 h-10 rounded-xl items-center justify-center shadow-sm">
                                        <item.icon size={18} color="#10B981" strokeWidth={2.5} />
                                    </View>
                                    <Text className="ml-4 text-neutral-900 font-bold tracking-tight">{item.label}</Text>
                                </View>
                            ))}
                        </View>
                    </MotiView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
