import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User as UserIcon, Settings, LogOut, ChevronRight, Shield, Bell } from 'lucide-react-native';
import { MotiView } from 'moti';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/api/client';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, employee, setEmployee, logout, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            // 1. Refresh User Data
            const meRes = await api.getMe();
            if (meRes.data.success) {
                const userData = meRes.data.data.user;
                updateUser({
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    emp_no: userData.emp_no,
                    employeeRef: userData.employeeId,
                });

                // 2. Fetch Employee Data if emp_no exists
                const empIdentifier = userData.emp_no || userData.employeeId;
                if (empIdentifier) {
                    const empRes = await api.getEmployee(empIdentifier);
                    if (empRes.data.success) {
                        setEmployee(empRes.data.data);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to log out of Pydah HRMS?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        logout();
                        await new Promise(resolve => setTimeout(resolve, 100));
                        router.replace('/');
                    }
                }
            ]
        );
    };

    if (loading && !user) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            <LinearGradient
                colors={['#FFFFFE', '#F7FEE7', '#FFFFFF']}
                className="absolute inset-0"
            />

            <SafeAreaView style={{ flex: 1 }}>
                <View className="flex-1">
                    <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>
                        {/* Premium Header */}
                        <View className="flex-row justify-between items-start mb-12">
                            <View>
                                <View className="flex-row items-center mb-1">
                                    <View className="w-8 h-1 bg-primary rounded-full mr-2" />
                                    <Text className="text-neutral-400 font-bold tracking-widest text-[10px] uppercase">My Account</Text>
                                </View>
                                <Text className="text-neutral-900 text-4xl font-black tracking-tight">Self<Text className="text-primary">.</Text>Care</Text>
                            </View>
                            <TouchableOpacity className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-sm border border-neutral-100">
                                <Settings size={28} color="#64748B" strokeWidth={2.5} />
                            </TouchableOpacity>
                        </View>

                        {/* Premium Profile Header */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="items-center mb-12"
                        >
                            <View className="relative">
                                <View className="w-36 h-36 bg-white rounded-[48px] items-center justify-center shadow-2xl shadow-neutral-200 border-4 border-white mb-6">
                                    <View className="w-28 h-28 bg-emerald-50 rounded-[36px] items-center justify-center">
                                        <UserIcon size={56} color="#10B981" strokeWidth={2.5} />
                                    </View>
                                </View>
                                <View className="absolute bottom-6 right-0 w-10 h-10 bg-primary rounded-full border-4 border-white items-center justify-center shadow-lg">
                                    <Shield size={16} color="white" strokeWidth={3} />
                                </View>
                            </View>
                            <Text className="text-3xl font-black text-neutral-900 tracking-tighter">{user?.name || 'Authorized User'}</Text>
                            <Text className="text-neutral-400 font-black uppercase tracking-widest text-[10px] mt-1">
                                {employee?.designation?.name || user?.role || 'HRMS Associate'} · {employee?.emp_no || 'SYSTEM'}
                            </Text>
                        </MotiView>

                        {/* Employee Details (Only if synced) */}
                        {employee && (
                            <MotiView
                                from={{ opacity: 0, translateY: 10 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100/50 mb-8"
                            >
                                <View className="flex-row justify-between mb-4">
                                    <View>
                                        <Text className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">Department</Text>
                                        <Text className="text-neutral-900 font-bold">{employee.department?.name || 'General'}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">Joined</Text>
                                        <Text className="text-neutral-900 font-bold whitespace-nowrap">
                                            {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : '—'}
                                        </Text>
                                    </View>
                                </View>
                                <View className="h-[1px] bg-emerald-200/20 w-full mb-4" />
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 rounded-lg bg-emerald-100 items-center justify-center mr-3">
                                        <UserIcon size={14} color="#059669" strokeWidth={3} />
                                    </View>
                                    <Text className="text-neutral-500 text-xs font-semibold">Reporting to: <Text className="text-neutral-900">{employee.reporting_manager?.employee_name || 'HR Team'}</Text></Text>
                                </View>
                            </MotiView>
                        )}

                        {/* High-Fidelity Settings Menu */}
                        <View className="space-y-4 mb-10">
                            {[
                                { label: 'Security & Access', icon: Shield, color: '#10B981', bg: '#ECFDF5' },
                                { label: 'Notifications', icon: Bell, color: '#6366F1', bg: '#EEF2FF' },
                                { label: 'System Settings', icon: Settings, color: '#64748B', bg: '#F8FAFC' }
                            ].map((item, idx) => (
                                <TouchableOpacity key={idx} style={styles.menuCard}>
                                    <View style={{ backgroundColor: item.bg }} className="w-12 h-12 rounded-2xl items-center justify-center border border-white">
                                        <item.icon size={22} color={item.color} strokeWidth={2.5} />
                                    </View>
                                    <Text className="flex-1 ml-5 text-neutral-900 font-bold text-base tracking-tight">{item.label}</Text>
                                    <ChevronRight size={20} color="#CBD5E1" strokeWidth={3} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Specialized Logout Action */}
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={styles.logoutCard}
                        >
                            <View className="bg-white w-12 h-12 rounded-2xl items-center justify-center shadow-sm">
                                <LogOut size={22} color="#F43F5E" strokeWidth={2.5} />
                            </View>
                            <Text className="flex-1 ml-5 text-rose-600 font-black text-base uppercase tracking-widest">Sign Out</Text>
                            <ChevronRight size={20} color="#FECDD3" strokeWidth={3} />
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    menuCard: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F9FAFB', // neutral-50
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    logoutCard: {
        backgroundColor: '#FFF1F2', // rose-50
        padding: 24,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFE4E6', // rose-100
        marginBottom: 128, // 32 * 4
    }
});
