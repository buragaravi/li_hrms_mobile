import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Plus, Clock as ClockIcon, CheckCircle2, AlertCircle, MapPin, Briefcase, History, ChevronLeft, X } from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { api, LeaveRequest, ODRequest, CCLRequest } from '../../src/api/client';
import { useAuthStore } from '../../src/store/useAuthStore';

type TabType = 'my' | 'pending' | 'od' | 'ccl' | 'holidays';
type RequestType = 'LEAVE' | 'OD' | 'CCL';

const StatusBadge = ({ status }: { status: string }) => {
    const getStatusStyle = () => {
        switch (status) {
            case 'APPROVED': return { bg: '#ECFDF5', text: '#065F46', border: '#D1FAE5', icon: CheckCircle2 };
            case 'REJECTED': return { bg: '#FEF2F2', text: '#991B1B', border: '#FEE2E2', icon: AlertCircle };
            case 'CANCELLED': return { bg: '#F9FAFB', text: '#6B7280', border: '#F3F4F6', icon: History };
            default: return { bg: '#FFFBEB', text: '#92400E', border: '#FEF3C7', icon: ClockIcon };
        }
    };
    const style = getStatusStyle();
    const Icon = style.icon;

    return (
        <View style={{ backgroundColor: style.bg, borderColor: style.border, borderWidth: 1 }} className="px-3 py-1 rounded-full flex-row items-center">
            <Icon size={10} color={status === 'APPROVED' ? '#10B981' : status === 'REJECTED' ? '#F43F5E' : '#D97706'} strokeWidth={3} />
            <Text style={{ color: style.text }} className="text-[10px] font-black ml-1 uppercase tracking-widest">{status}</Text>
        </View>
    );
};

const Skeleton = ({ className }: { className?: string }) => (
    <MotiView
        from={{ opacity: 0.3 }}
        animate={{ opacity: 0.7 }}
        transition={{ loop: true, type: 'timing', duration: 1000 }}
        className={`bg-neutral-100 rounded-2xl ${className}`}
    />
);

export default function LeavesScreen() {
    const { user, employee } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>('my');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [holidays, setHolidays] = useState<any[]>([]);

    // Form State
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [requestType, setRequestType] = useState<RequestType>('LEAVE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCCLValid, setIsCCLValid] = useState<boolean | null>(null);
    const [cclMessage, setCCLMessage] = useState('');
    const [formData, setFormData] = useState({
        leaveType: 'CASUAL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        placeVisited: '',
        purpose: '',
        date: new Date().toISOString().split('T')[0],
    });

    const [verifiers, setVerifiers] = useState<any[]>([]);
    const [selectedVerifier, setSelectedVerifier] = useState<string>('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch stats always
            const statsRes = await api.getLeaveStats().catch(() => ({
                data: { annual: 12, sick: 8, casual: 4, totalLeaveBalance: 0, pendingLeaves: 0 }
            }));
            setStats(statsRes.data);

            if (activeTab === 'holidays') {
                const hRes = await api.getHolidays().catch(() => ({ data: [] }));
                setData(Array.isArray(hRes.data) ? hRes.data : []);
                return;
            }

            let res;
            if (activeTab === 'my') res = await api.getMyLeaves();
            else if (activeTab === 'pending') res = await api.getPendingApprovals();
            else if (activeTab === 'od') res = await api.getMyODs();
            else if (activeTab === 'ccl') res = await api.getMyCCLRequests();

            // Explicitly handle null/undefined or non-array data
            const fetchedData = res?.data;
            setData(Array.isArray(fetchedData) ? fetchedData : []);
        } catch (error) {
            console.error('Error fetching leaves:', error);
            setData([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
        if (isApplyModalOpen) {
            api.getCCLVerifiers().then(res => setVerifiers(res.data)).catch(() => { });
        }
    }, [fetchData, isApplyModalOpen]);

    // real-time CCL validation
    useEffect(() => {
        if (requestType === 'CCL' && formData.date && formData.date.length === 10) {
            const validate = async () => {
                try {
                    const res = await api.validateCCLDate(formData.date);
                    setIsCCLValid(res.data.success);
                    setCCLMessage(res.data.message);
                } catch (err: any) {
                    setIsCCLValid(false);
                    setCCLMessage(err.response?.data?.message || 'Invalid holiday date');
                }
            };
            validate();
        } else {
            setIsCCLValid(null);
            setCCLMessage('');
        }
    }, [formData.date, requestType]);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    const handleApply = async () => {
        if (requestType === 'CCL' && isCCLValid === false) {
            Alert.alert('Invalid Date', 'The selected date is not a valid holiday or weekend for CCL.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (requestType === 'LEAVE') {
                await api.applyLeave(formData);
            } else if (requestType === 'OD') {
                await api.applyOD({
                    date: formData.date,
                    placeVisited: formData.placeVisited,
                    purpose: formData.purpose
                });
            } else if (requestType === 'CCL') {
                await api.applyCCL({ date: formData.date, verifiedBy: selectedVerifier });
            }

            Alert.alert('Success', `${requestType} applied successfully.`);
            setIsApplyModalOpen(false);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to submit application.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
        try {
            await api.takeLeaveAction(id, action);
            Alert.alert('Success', `Request ${action.toLowerCase()} successfully.`);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to process action.');
        }
    };

    const handleODOutcome = async (id: string, outcome: string) => {
        try {
            await api.updateODOutcome(id, outcome);
            Alert.alert('Success', 'Outcome updated.');
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to update outcome.');
        }
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
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={onRefresh}
                                tintColor="#10B981"
                            />
                        }
                    >
                        {/* Premium Header */}
                        <View className="flex-row justify-between items-start mb-12">
                            <View>
                                <View className="flex-row items-center mb-1">
                                    <View className="w-8 h-1 bg-primary rounded-full mr-2" />
                                    <Text className="text-neutral-400 font-bold tracking-widest text-[10px] uppercase">Absence Tracking</Text>
                                </View>
                                <Text className="text-neutral-900 text-4xl font-black tracking-tight">
                                    Time<Text className="text-primary">.</Text>Off
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setIsApplyModalOpen(true)}
                                activeOpacity={0.8}
                                className="w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-primary/30"
                            >
                                <Plus size={28} color="white" strokeWidth={3} />
                            </TouchableOpacity>
                        </View>

                        {/* Stats Grid */}
                        <View className="flex-row gap-4 mb-10">
                            {isLoading ? (
                                <>
                                    <Skeleton className="flex-1 h-32 rounded-[32px]" />
                                    <Skeleton className="flex-1 h-32 rounded-[32px]" />
                                </>
                            ) : (
                                <>
                                    <MotiView className="flex-1 bg-white rounded-[32px] p-6 border-2 border-neutral-50 shadow-sm">
                                        <View className="bg-emerald-50 w-10 h-10 rounded-xl items-center justify-center mb-4">
                                            <Calendar size={20} color="#10B981" strokeWidth={2.5} />
                                        </View>
                                        <View className="flex-row items-baseline">
                                            <Text className="text-neutral-900 text-3xl font-black tracking-tighter mb-1">
                                                {stats?.totalLeaveBalance || stats?.annual || 0}
                                            </Text>
                                            <Text className="text-neutral-400 text-[10px] font-bold ml-1 uppercase">
                                                / {stats?.totalLeaves || 24}
                                            </Text>
                                        </View>
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Available Balance</Text>
                                    </MotiView>
                                    <MotiView className="flex-1 bg-white rounded-[32px] p-6 border-2 border-neutral-50 shadow-sm">
                                        <View className="bg-rose-50 w-10 h-10 rounded-xl items-center justify-center mb-4">
                                            <AlertCircle size={20} color="#F43F5E" strokeWidth={2.5} />
                                        </View>
                                        <Text className="text-neutral-900 text-3xl font-black tracking-tighter mb-1">
                                            {stats?.pendingLeaves || 0}
                                        </Text>
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Requests Pending</Text>
                                    </MotiView>
                                </>
                            )}
                        </View>

                        {/* Tab Switcher */}
                        <View className="bg-neutral-100/50 p-1.5 rounded-[24px] flex-row mb-8">
                            {(['my', 'pending', 'od', 'ccl', 'holidays'] as TabType[]).map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-full mr-2 ${activeTab === tab ? 'bg-primary' : 'bg-neutral-100'}`}
                                >
                                    <Text className={`font-black text-[10px] uppercase tracking-widest ${activeTab === tab ? 'text-white' : 'text-neutral-500'}`}>
                                        {tab === 'my' ? 'Leaves' : tab === 'pending' ? 'Pending' : tab === 'od' ? 'Duty' : tab === 'ccl' ? 'C-Leave' : 'Holidays'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* List Section */}
                        <View className="pb-20">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-neutral-900 font-black text-xl tracking-tight">
                                    {activeTab === 'pending' ? 'Team Requests' : 'Your History'}
                                </Text>
                                <TouchableOpacity>
                                    <Text className="text-primary font-bold text-xs">See All</Text>
                                </TouchableOpacity>
                            </View>

                            {isLoading ? (
                                [1, 2, 3].map(i => <Skeleton key={i} className="w-full h-24 rounded-[32px] mb-4" />)
                            ) : data.length === 0 ? (
                                <MotiView
                                    from={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-neutral-50/50 border border-neutral-100 rounded-[40px] p-12 items-center"
                                >
                                    <View className="bg-white w-20 h-20 rounded-3xl items-center justify-center shadow-sm mb-6">
                                        <History size={32} color="#D1D5DB" />
                                    </View>
                                    <Text className="text-neutral-400 font-bold text-center">No records found for this section.</Text>
                                </MotiView>
                            ) : (
                                (data || []).map((item: any, idx) => (
                                    <View
                                        key={item._id || idx}
                                        style={styles.card}
                                    >
                                        <View className="flex-row items-center mb-4">
                                            <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${activeTab === 'holidays' ? 'bg-blue-50' : 'bg-neutral-50'}`}>
                                                {activeTab === 'holidays' ? (
                                                    <Calendar size={22} color="#3B82F6" strokeWidth={2.5} />
                                                ) : (
                                                    <ClockIcon size={22} color="#64748B" strokeWidth={2.5} />
                                                )}
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-neutral-900 font-black text-lg tracking-tight">
                                                    {activeTab === 'holidays' ? item.name : item.leaveType || item.purpose || 'C-Leave Claim'}
                                                </Text>
                                                <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">
                                                    {activeTab === 'holidays'
                                                        ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : item.emp_name || user?.name}
                                                </Text>
                                            </View>
                                            {activeTab !== 'holidays' && <StatusBadge status={item.status} />}
                                        </View>

                                        {activeTab !== 'holidays' && (
                                            <>
                                                <View className="flex-row items-center justify-between bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100/50 mb-4">
                                                    <View>
                                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-1">Duration</Text>
                                                        <Text className="text-neutral-900 font-bold text-xs">{item.startDate || item.date} - {item.endDate || item.date}</Text>
                                                    </View>
                                                    <View className="items-end">
                                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-1">Reason</Text>
                                                        <Text className="text-neutral-900 font-bold text-xs" numberOfLines={1}>{item.reason || item.purpose || 'Claim'}</Text>
                                                    </View>
                                                </View>

                                                {activeTab === 'pending' && item.status === 'PENDING' && (
                                                    <View className="flex-row space-x-3 mt-2">
                                                        <TouchableOpacity
                                                            onPress={() => handleAction(item._id, 'APPROVED')}
                                                            className="flex-1 bg-emerald-500 py-3 rounded-xl items-center border border-emerald-600 shadow-sm"
                                                        >
                                                            <Text className="text-white font-black text-[10px] uppercase tracking-widest">Approve</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => handleAction(item._id, 'REJECTED')}
                                                            className="flex-1 bg-rose-50 py-3 rounded-xl items-center border border-rose-100"
                                                        >
                                                            <Text className="text-rose-600 font-black text-[10px] uppercase tracking-widest">Reject</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </>
                                        )}

                                        {activeTab === 'holidays' && item.description && (
                                            <Text className="text-neutral-500 text-xs italic mt-2">{item.description}</Text>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>

            {/* Apply Application Modal */}
            <Modal
                visible={isApplyModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsApplyModalOpen(false)}
            >
                <View className="flex-1 bg-black/40 justify-end">
                    <MotiView
                        from={{ translateY: 300 }}
                        animate={{ translateY: 0 }}
                        className="bg-white rounded-t-[50px] p-8 pb-12"
                    >
                        <View className="flex-row justify-between items-center mb-10">
                            <Text className="text-3xl font-black text-neutral-900 tracking-tight">New Request</Text>
                            <TouchableOpacity
                                onPress={() => setIsApplyModalOpen(false)}
                                className="bg-neutral-100 p-2 rounded-full"
                            >
                                <X size={20} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {/* Request Type Selector */}
                        <View className="flex-row gap-2 mb-8">
                            {(['LEAVE', 'OD', 'CCL'] as RequestType[]).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setRequestType(type)}
                                    className={`flex-1 py-3 items-center rounded-2xl border ${requestType === type ? 'bg-primary border-primary' : 'bg-white border-neutral-100'}`}
                                >
                                    <Text className={`text-[10px] font-black tracking-widest uppercase ${requestType === type ? 'text-white' : 'text-neutral-400'}`}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <ScrollView className="max-h-[400px]" showsVerticalScrollIndicator={false}>
                            {requestType === 'LEAVE' && (
                                <View className="space-y-6">
                                    <View>
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-3 ml-1">Leave Type</Text>
                                        <View className="flex-row flex-wrap gap-2">
                                            {['CASUAL', 'SICK', 'ANNUAL', 'COMPENSATORY'].map(t => (
                                                <TouchableOpacity
                                                    key={t}
                                                    onPress={() => setFormData({ ...formData, leaveType: t })}
                                                    className={`px-4 py-2 rounded-xl border ${formData.leaveType === t ? 'bg-primary/10 border-primary' : 'bg-neutral-50 border-neutral-100'}`}
                                                >
                                                    <Text className={`text-[10px] font-black uppercase ${formData.leaveType === t ? 'text-primary' : 'text-neutral-400'}`}>{t}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View className="flex-row gap-4 mt-6">
                                        <View className="flex-1">
                                            <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Start Date</Text>
                                            <TextInput
                                                value={formData.startDate}
                                                onChangeText={(val) => setFormData({ ...formData, startDate: val })}
                                                placeholder="YYYY-MM-DD"
                                                className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">End Date</Text>
                                            <TextInput
                                                value={formData.endDate}
                                                onChangeText={(val) => setFormData({ ...formData, endDate: val })}
                                                placeholder="YYYY-MM-DD"
                                                className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                            />
                                        </View>
                                    </View>

                                    <View className="mt-6">
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Reason</Text>
                                        <TextInput
                                            multiline
                                            numberOfLines={3}
                                            value={formData.reason}
                                            onChangeText={(val) => setFormData({ ...formData, reason: val })}
                                            placeholder="Why are you taking leave?"
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
                                    </View>
                                </View>
                            )}

                            {requestType === 'OD' && (
                                <View className="space-y-6">
                                    <View>
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Date</Text>
                                        <TextInput
                                            value={formData.date}
                                            onChangeText={(val) => setFormData({ ...formData, date: val })}
                                            placeholder="YYYY-MM-DD"
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
                                    </View>
                                    <View className="mt-6">
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Place Visited</Text>
                                        <TextInput
                                            value={formData.placeVisited}
                                            onChangeText={(val) => setFormData({ ...formData, placeVisited: val })}
                                            placeholder="Where did you go?"
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
                                    </View>
                                    <View className="mt-6">
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Purpose</Text>
                                        <TextInput
                                            multiline
                                            numberOfLines={3}
                                            value={formData.purpose}
                                            onChangeText={(val) => setFormData({ ...formData, purpose: val })}
                                            placeholder="What was the goal?"
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
                                    </View>
                                </View>
                            )}

                            {requestType === 'CCL' && (
                                <View className="space-y-6">
                                    <View>
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Holiday Date worked</Text>
                                        <TextInput
                                            value={formData.date}
                                            onChangeText={(val) => setFormData({ ...formData, date: val })}
                                            placeholder="YYYY-MM-DD"
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
                                        {isCCLValid !== null ? (
                                            <View className="mt-2 flex-row items-center">
                                                {isCCLValid ? (
                                                    <CheckCircle2 size={14} color="#10B981" />
                                                ) : (
                                                    <AlertCircle size={14} color="#EF4444" />
                                                )}
                                                <Text className={`ml-2 text-[10px] font-bold ${isCCLValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {cclMessage}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text className="text-xs text-neutral-400 mt-2 italic">* We will validate if this was a holiday or weekend.</Text>
                                        )}
                                    </View>
                                    <View className="mt-6">
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-3">Verifier (Assigned By)</Text>
                                        <View className="flex-row flex-wrap gap-2">
                                            {verifiers.map((v: any) => (
                                                <TouchableOpacity
                                                    key={v._id}
                                                    onPress={() => setSelectedVerifier(v._id)}
                                                    className={`px-4 py-3 rounded-2xl border ${selectedVerifier === v._id ? 'bg-primary/10 border-primary' : 'bg-neutral-50 border-neutral-100'}`}
                                                >
                                                    <Text className={`text-[10px] font-black uppercase ${selectedVerifier === v._id ? 'text-primary' : 'text-neutral-400'}`}>{v.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                            {verifiers.length === 0 && <Text className="text-neutral-400 text-xs italic">Loading verifiers...</Text>}
                                        </View>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={handleApply}
                            disabled={isSubmitting}
                            activeOpacity={0.9}
                            className="bg-primary w-full py-5 rounded-3xl mt-10 shadow-xl shadow-primary/30 items-center justify-center flex-row"
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <View style={{ marginRight: 12 }}>
                                        <CheckCircle2 size={20} color="white" />
                                    </View>
                                    <Text className="text-white font-black uppercase tracking-[2px]">Submit Application</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </MotiView>
                </View>
            </Modal >
        </View >
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 24,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#F9FAFB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    }
});
