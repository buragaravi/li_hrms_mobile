import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Plus, Clock as ClockIcon, CheckCircle2, AlertCircle, MapPin, Briefcase, History, ChevronLeft, X, ChevronDown } from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { api, LeaveRequest, ODRequest, CCLRequest } from '../../src/api/client';
import { useAuthStore } from '../../src/store/useAuthStore';

type TabType = 'my' | 'od' | 'ccl' | 'holidays';
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

const Dropdown = ({ label, value, options, onSelect, placeholder = 'Select an option' }: { label: string, value: string, options: any[], onSelect: (val: string) => void, placeholder?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <View className="mb-4">
            <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">{label}</Text>
            <TouchableOpacity onPress={() => setIsOpen(!isOpen)} className="bg-neutral-50 border border-neutral-100 p-4 rounded-2xl flex-row justify-between items-center">
                <Text className={`font-bold ${value ? 'text-neutral-900' : 'text-neutral-400'}`}>
                    {options.find(o => o.value === value)?.label || placeholder}
                </Text>
                <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {isOpen && (
                <View className="bg-white border border-neutral-100 rounded-xl mt-2 shadow-sm overflow-hidden">
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => { onSelect(option.value); setIsOpen(false); }}
                            className="p-4 border-b border-neutral-50 last:border-0"
                        >
                            <Text className={`font-bold ${value === option.value ? 'text-primary' : 'text-neutral-700'}`}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
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
        remarks: '',
    });

    const [verifiers, setVerifiers] = useState<any[]>([]);
    const [selectedVerifier, setSelectedVerifier] = useState<string>('');

    // New State for Refined Forms
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [odTypes, setODTypes] = useState<any[]>([]);

    // Extended Form Data
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [halfDayType, setHalfDayType] = useState<'first_half' | 'second_half'>('first_half');
    const [contactNumber, setContactNumber] = useState('');

    const [odType, setOdType] = useState('');
    const [odTypeExtended, setOdTypeExtended] = useState<'full_day' | 'half_day' | 'hours'>('full_day');
    const [odStartTime, setOdStartTime] = useState('');
    const [odEndTime, setOdEndTime] = useState('');

    const [conflictMessage, setConflictMessage] = useState('');

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

            let res: any;
            if (activeTab === 'my') res = await api.getMyLeaves();
            // else if (activeTab === 'pending') res = await api.getPendingApprovals(); // Removed
            else if (activeTab === 'od') res = await api.getMyODs();
            else if (activeTab === 'ccl') res = await api.getMyCCLRequests();

            // Explicitly handle null/undefined or non-array data
            const payload = res?.data;
            let listData: any[] = [];

            if (Array.isArray(payload)) {
                listData = payload;
            } else if (payload && Array.isArray(payload.data)) {
                listData = payload.data;
            } else if (payload && Array.isArray(payload.docs)) {
                listData = payload.docs;
            }

            setData(listData);
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

        // Fetch Settings on Mount
        const fetchSettings = async () => {
            try {
                const lRes = await api.getLeaveSettings('leave');
                setLeaveTypes(lRes.data.types || [
                    { name: 'Casual Leave', code: 'CASUAL' },
                    { name: 'Sick Leave', code: 'SICK' }
                ]);

                const oRes = await api.getLeaveSettings('od');
                const fetchedODTypes = (oRes.data.types && oRes.data.types.length > 0)
                    ? oRes.data.types
                    : [{ name: 'Official Work', code: 'OFFICIAL_WORK' }];
                setODTypes(fetchedODTypes);

                // Set default if not set
                setOdType(prev => prev || fetchedODTypes[0]?.code);
            } catch (e) {
                console.log('Error fetching settings', e);
            }
        };
        fetchSettings();

        if (isApplyModalOpen) {
            api.getCCLVerifiers()
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setVerifiers(res.data);
                    } else if (res.data && Array.isArray(res.data.data)) {
                        setVerifiers(res.data.data);
                    } else {
                        setVerifiers([]);
                    }
                })
                .catch(() => setVerifiers([]));
        }
    }, [fetchData, isApplyModalOpen]);

    // Check for Conflicts
    useEffect(() => {
        if (requestType === 'LEAVE' && formData.startDate && formData.endDate) {
            checkConflict(formData.startDate);
        }
    }, [formData.startDate, formData.endDate, requestType]);

    const checkConflict = async (date: string) => {
        if (date.length !== 10) return;
        try {
            // Assuming current user. In real app, might need to pass empId if applying for others.
            const empId = employee?._id || user?.employeeRef;
            if (!empId) return;

            const res = await api.getApprovedRecordsForDate(empId, date);
            if (res.data.hasLeave || res.data.hasOD) {
                setConflictMessage('Warning: You already have an approved request on this date.');
            } else {
                setConflictMessage('');
            }
        } catch (e) {
            console.log('Conflict check error', e);
        }
    };

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

        if (conflictMessage) {
            Alert.alert('Conflict Warning', conflictMessage, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Proceed Anyway', onPress: () => submitApplication() }
            ]);
            return;
        }

        submitApplication();
    };

    const submitApplication = async () => {
        setIsSubmitting(true);
        try {
            if (requestType === 'LEAVE') {
                // Calculate number of days
                const start = new Date(formData.startDate);
                const end = new Date(isHalfDay ? formData.startDate : formData.endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                await api.applyLeave({
                    employeeId: employee?._id || user?.employeeRef, // Ensure empId is passed
                    leaveType: formData.leaveType,
                    fromDate: formData.startDate,
                    toDate: isHalfDay ? formData.startDate : formData.endDate,
                    numberOfDays: isHalfDay ? 0.5 : diffDays,
                    purpose: formData.reason, // BE expects 'purpose', map from 'reason'
                    isHalfDay,
                    halfDayType: isHalfDay ? halfDayType : undefined,
                    contactNumber,
                    remarks: formData.remarks
                });
            } else if (requestType === 'OD') {
                await api.applyOD({
                    date: formData.date,
                    placeVisited: formData.placeVisited,
                    purpose: formData.purpose,
                    odType: odType,
                    odType_extended: odTypeExtended,
                    odStartTime: odTypeExtended === 'hours' ? odStartTime : undefined,
                    odEndTime: odTypeExtended === 'hours' ? odEndTime : undefined
                });
            } else if (requestType === 'CCL') {
                await api.applyCCL({
                    date: formData.date,
                    assignedBy: selectedVerifier, // Changed from verifiedBy to assignedBy
                    purpose: formData.purpose,
                    isHalfDay: !!isHalfDay, // Ensure boolean
                    halfDayType: isHalfDay ? halfDayType : undefined
                });
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
                            {(['my', 'od', 'ccl', 'holidays'] as TabType[]).map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-full mr-2 ${activeTab === tab ? 'bg-primary' : 'bg-neutral-100'}`}
                                >
                                    <Text className={`font-black text-[10px] uppercase tracking-widest ${activeTab === tab ? 'text-white' : 'text-neutral-500'}`}>
                                        {tab === 'my' ? 'Leaves' : tab === 'od' ? 'Duty' : tab === 'ccl' ? 'C-Leave' : 'Holidays'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* List Section */}
                        <View className="pb-20">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-neutral-900 font-black text-xl tracking-tight">
                                    Your History
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
                                                    {activeTab === 'holidays' ? item.name : (item.leaveType?.name || leaveTypes.find(t => t.code === item.leaveType || t === item.leaveType)?.name || item.leaveType || item.purpose || 'C-Leave Claim')}
                                                </Text>
                                                <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">
                                                    {activeTab === 'holidays'
                                                        ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : (item.emp_name || user?.name) + (item.numberOfDays ? ` • ${Math.round(item.numberOfDays * 10) / 10} Days` : '')}
                                                </Text>
                                            </View>
                                            {activeTab !== 'holidays' && <StatusBadge status={item.status} />}
                                        </View>

                                        {activeTab !== 'holidays' && (
                                            <>
                                                <View className="flex-row items-center justify-between bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100/50 mb-4">
                                                    <View>
                                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-1">Duration</Text>
                                                        <Text className="text-neutral-900 font-bold text-xs">
                                                            {(item.fromDate || item.startDate || item.date || '').split('T')[0]} - {(item.toDate || item.endDate || item.date || '').split('T')[0]}
                                                        </Text>
                                                    </View>
                                                    <View className="items-end">
                                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-1">Reason</Text>
                                                        <Text className="text-neutral-900 font-bold text-xs" numberOfLines={1}>{item.reason || item.purpose || 'Claim'}</Text>
                                                    </View>
                                                </View>

                                                {/* Pending actions removed */}
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
                                        <Dropdown
                                            label="Leave Type"
                                            value={formData.leaveType}
                                            options={leaveTypes.map(t => ({ label: t.name || t, value: t.code || t }))}
                                            onSelect={(val) => setFormData({ ...formData, leaveType: val })}
                                            placeholder="Select Leave Type"
                                        />
                                    </View>

                                    {isHalfDay ? (
                                        <View className="mt-2">
                                            <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Date</Text>
                                            <TextInput
                                                value={formData.startDate}
                                                onChangeText={(val) => setFormData({ ...formData, startDate: val, endDate: val })}
                                                placeholder="YYYY-MM-DD"
                                                className={`bg-neutral-50 border ${conflictMessage ? 'border-rose-300 bg-rose-50' : 'border-neutral-100'} px-5 py-4 rounded-2xl font-bold text-neutral-900`}
                                            />
                                            {conflictMessage ? <Text className="text-rose-500 text-[10px] font-bold mt-1">{conflictMessage}</Text> : null}
                                        </View>
                                    ) : (
                                        <View className="flex-row gap-4 mt-2">
                                            <View className="flex-1">
                                                <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Start Date</Text>
                                                <TextInput
                                                    value={formData.startDate}
                                                    onChangeText={(val) => setFormData({ ...formData, startDate: val })}
                                                    placeholder="YYYY-MM-DD"
                                                    className={`bg-neutral-50 border ${conflictMessage ? 'border-rose-300 bg-rose-50' : 'border-neutral-100'} px-5 py-4 rounded-2xl font-bold text-neutral-900`}
                                                />
                                                {conflictMessage ? <Text className="text-rose-500 text-[10px] font-bold mt-1">{conflictMessage}</Text> : null}
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
                                    )}

                                    {/* Half Day Toggle */}
                                    <View className="flex-row items-center justify-between bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                                        <Text className="text-neutral-900 font-bold text-xs uppercase tracking-widest">Half Day?</Text>
                                        <TouchableOpacity onPress={() => setIsHalfDay(!isHalfDay)}>
                                            <View className={`w-12 h-6 rounded-full ${isHalfDay ? 'bg-primary' : 'bg-neutral-200'} justify-center px-1`}>
                                                <View className={`w-4 h-4 bg-white rounded-full ${isHalfDay ? 'self-end' : 'self-start'}`} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>

                                    {isHalfDay && (
                                        <View className="flex-row gap-2">
                                            <TouchableOpacity
                                                onPress={() => setHalfDayType('first_half')}
                                                className={`flex-1 py-3 items-center rounded-xl border ${halfDayType === 'first_half' ? 'bg-primary/10 border-primary' : 'bg-white border-neutral-200'}`}
                                            >
                                                <Text className={`text-[10px] font-bold uppercase ${halfDayType === 'first_half' ? 'text-primary' : 'text-neutral-400'}`}>First Half</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setHalfDayType('second_half')}
                                                className={`flex-1 py-3 items-center rounded-xl border ${halfDayType === 'second_half' ? 'bg-primary/10 border-primary' : 'bg-white border-neutral-200'}`}
                                            >
                                                <Text className={`text-[10px] font-bold uppercase ${halfDayType === 'second_half' ? 'text-primary' : 'text-neutral-400'}`}>Second Half</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <View className="">
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Contact Number</Text>
                                        <TextInput
                                            value={contactNumber}
                                            onChangeText={setContactNumber}
                                            placeholder="Emergency Contact"
                                            keyboardType="phone-pad"
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
                                    </View>

                                    <View className="">
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Purpose</Text>
                                        <TextInput
                                            multiline
                                            numberOfLines={3}
                                            value={formData.reason}
                                            onChangeText={(val) => setFormData({ ...formData, reason: val })}
                                            placeholder="Why are you taking leave?"
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
                                    </View>

                                    <View className="">
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Remarks</Text>
                                        <TextInput
                                            value={formData.remarks}
                                            onChangeText={(val) => setFormData({ ...formData, remarks: val })}
                                            placeholder="Any additional remarks..."
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
                                    </View>
                                </View>
                            )}

                            {requestType === 'OD' && (
                                <View className="space-y-6">
                                    <View>
                                        <Dropdown
                                            label="OD Type"
                                            value={odType}
                                            options={odTypes.map(t => ({ label: t.name || t, value: t.code || t }))}
                                            onSelect={setOdType}
                                            placeholder="Select OD Type"
                                        />
                                    </View>

                                    <View className="flex-row gap-2">
                                        {(['full_day', 'half_day', 'hours'] as const).map(type => (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => setOdTypeExtended(type)}
                                                className={`flex-1 py-3 items-center rounded-xl border ${odTypeExtended === type ? 'bg-primary/10 border-primary' : 'bg-white border-neutral-200'}`}
                                            >
                                                <Text className={`text-[10px] font-bold uppercase ${odTypeExtended === type ? 'text-primary' : 'text-neutral-400'}`}>{type.replace('_', ' ')}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View>
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Date</Text>
                                        <TextInput
                                            value={formData.date}
                                            onChangeText={(val) => setFormData({ ...formData, date: val })}
                                            placeholder="YYYY-MM-DD"
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
                                    </View>

                                    {odTypeExtended === 'hours' && (
                                        <View className="flex-row gap-4">
                                            <View className="flex-1">
                                                <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Start Time</Text>
                                                <TextInput
                                                    value={odStartTime}
                                                    onChangeText={setOdStartTime}
                                                    placeholder="10:00"
                                                    className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">End Time</Text>
                                                <TextInput
                                                    value={odEndTime}
                                                    onChangeText={setOdEndTime}
                                                    placeholder="12:00"
                                                    className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                                />
                                            </View>
                                        </View>
                                    )}

                                    <View className="">
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Place Visited</Text>
                                        <TextInput
                                            value={formData.placeVisited}
                                            onChangeText={(val) => setFormData({ ...formData, placeVisited: val })}
                                            placeholder="Where did you go?"
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
                                    </View>
                                    <View className="">
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
                                        <Dropdown
                                            label="Verifier (Assigned By)"
                                            value={selectedVerifier}
                                            options={Array.isArray(verifiers) ? verifiers.map((v: any) => ({ label: v.name, value: v._id })) : []}
                                            onSelect={setSelectedVerifier}
                                            placeholder="Select a Manager"
                                        />
                                    </View>

                                    <View className="mt-6">
                                        <Text className="text-neutral-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Purpose</Text>
                                        <TextInput
                                            multiline
                                            numberOfLines={3}
                                            value={formData.purpose}
                                            onChangeText={(val) => setFormData({ ...formData, purpose: val })}
                                            placeholder="Reason description"
                                            className="bg-neutral-50 border border-neutral-100 px-5 py-4 rounded-2xl font-bold text-neutral-900"
                                        />
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
