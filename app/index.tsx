import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ChevronRight, Fingerprint } from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../src/store/useAuthStore';
import { api } from '../src/api/client';

export default function LoginScreen() {
    const router = useRouter();
    const { setAuth, isAuthenticated } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [loading, setLoading] = useState(false);

    // Auto-redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Required', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.login({ email, password });
            if (response.data.success) {
                const { user, token } = response.data.data;
                // Map backend user to store user structure
                setAuth({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    emp_no: user.emp_no,
                    employeeRef: user.employeeId,
                }, token);

                router.replace('/(tabs)');
            } else {
                Alert.alert('Access Denied', response.data.message || 'Invalid credentials.');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Unable to connect to service. Please check your network.';
            Alert.alert('Connection Error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Minimalist Premium Background */}
            <LinearGradient
                colors={['#FFFFFE', '#F7FEE7', '#FFFFFF']}
                className="absolute inset-0"
            />

            {/* Soft Ambient Blobs - Very subtle for high-end feel */}
            <MotiView
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.03, 0.05, 0.03],
                }}
                transition={{ duration: 8000, loop: true, type: 'timing' }}
                className="absolute top-[-100] right-[-100] w-[500] h-[500] rounded-full bg-emerald-400"
            />

            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1 px-8 justify-center"
                    >
                        {/* Header Section */}
                        <MotiView
                            from={{ opacity: 0, translateY: 30 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className="mb-14"
                        >
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-1 green-bar bg-primary rounded-full mr-3" />
                                <Text className="text-primary font-bold tracking-[4px] text-xs uppercase">Enterprise Portal</Text>
                            </View>
                            <Text className="text-neutral-900 text-5xl font-black tracking-tight leading-[55px]">
                                Sign<Text className="text-primary">.</Text>In
                            </Text>
                            <Text className="text-neutral-400 text-lg font-medium mt-3 tracking-wide">
                                Access your workspace account
                            </Text>
                        </MotiView>

                        {/* Premium Inputs Section */}
                        <View className="space-y-6">
                            {/* Email Input */}
                            <MotiView
                                animate={{
                                    scale: isEmailFocused ? 1.02 : 1,
                                    borderColor: isEmailFocused ? '#10B981' : '#F1F5F9'
                                }}
                                className="bg-white rounded-3xl border-2 px-6 h-20 flex-row items-center shadow-sm shadow-neutral-200"
                            >
                                <Mail size={22} color={isEmailFocused ? "#10B981" : "#94A6B8"} strokeWidth={2.5} />
                                <View className="flex-1 ml-4">
                                    {(isEmailFocused || email.length > 0) && (
                                        <MotiText
                                            from={{ opacity: 0, translateY: 5 }}
                                            animate={{ opacity: 1, translateY: 0 }}
                                            className="text-primary text-[10px] font-black uppercase tracking-widest mb-1"
                                        >
                                            Email Address
                                        </MotiText>
                                    )}
                                    <TextInput
                                        placeholder={!isEmailFocused ? "Email Address" : ""}
                                        value={email}
                                        onChangeText={setEmail}
                                        onFocus={() => setIsEmailFocused(true)}
                                        onBlur={() => setIsEmailFocused(false)}
                                        className="text-neutral-900 font-bold text-lg p-0"
                                        placeholderTextColor="#CBD5E1"
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </MotiView>

                            {/* Password Input */}
                            <MotiView
                                animate={{
                                    scale: isPasswordFocused ? 1.02 : 1,
                                    borderColor: isPasswordFocused ? '#10B981' : '#F1F5F9'
                                }}
                                className="bg-white rounded-3xl border-2 px-6 h-20 flex-row items-center shadow-sm shadow-neutral-200 mt-5"
                            >
                                <Lock size={22} color={isPasswordFocused ? "#10B981" : "#94A6B8"} strokeWidth={2.5} />
                                <View className="flex-1 ml-4">
                                    {(isPasswordFocused || password.length > 0) && (
                                        <MotiText
                                            from={{ opacity: 0, translateY: 5 }}
                                            animate={{ opacity: 1, translateY: 0 }}
                                            className="text-primary text-[10px] font-black uppercase tracking-widest mb-1"
                                        >
                                            Secure Password
                                        </MotiText>
                                    )}
                                    <TextInput
                                        placeholder={!isPasswordFocused ? "Password" : ""}
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setIsPasswordFocused(true)}
                                        onBlur={() => setIsPasswordFocused(false)}
                                        secureTextEntry
                                        className="text-neutral-900 font-bold text-lg p-0"
                                        placeholderTextColor="#CBD5E1"
                                    />
                                </View>
                            </MotiView>

                            {/* Forgot Password */}
                            <TouchableOpacity className="self-end px-2 mt-1">
                                <Text className="text-neutral-400 font-bold text-xs uppercase tracking-widest">Recovery Access?</Text>
                            </TouchableOpacity>

                            {/* Login Button */}
                            <TouchableOpacity
                                onPress={handleLogin}
                                activeOpacity={0.9}
                                disabled={loading}
                                className={`mt-8 ${loading ? 'opacity-70' : ''}`}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="h-20 rounded-3xl items-center justify-center flex-row shadow-2xl shadow-emerald-500/40"
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <>
                                            <Text className="text-white font-black text-xl tracking-widest uppercase mr-2">Login to Account</Text>
                                            <ChevronRight size={24} color="white" strokeWidth={3} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Biometric Placeholder */}
                            <TouchableOpacity className="items-center mt-6">
                                <View className="w-16 h-16 bg-emerald-50 rounded-2xl items-center justify-center border border-emerald-100">
                                    <Fingerprint size={28} color="#10B981" />
                                </View>
                                <Text className="text-neutral-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Biometric Sign-in</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer Section */}
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 800 }}
                            className="mt-16 items-center"
                        >
                            <View className="bg-neutral-50 p-6 rounded-[32px] border border-neutral-100 items-center w-full">
                                <Text className="text-neutral-500 font-bold text-xs uppercase tracking-tighter mb-1">Authorization required</Text>
                                <Text className="text-neutral-400 text-[11px] text-center leading-5 px-4">
                                    To ensure workplace security, please contact your <Text className="text-primary font-black">Department Admin</Text> for official system credentials.
                                </Text>
                            </View>
                        </MotiView>
                    </KeyboardAvoidingView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
