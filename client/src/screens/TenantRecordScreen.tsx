import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, DollarSign, Clock, User, Home, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const TenantRecordScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { tenant } = route.params;
  
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, string>>({});
  const [roomAmount, setRoomAmount] = useState(tenant.roomAmount || '0');
  const [utilityBills, setUtilityBills] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'Rent' | 'Electric' | 'Water'>('Rent');
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const calculateSummary = (statuses: Record<string, string>, bills: any[], currentRoomAmount: string) => {
    let total = 0;
    const cleanAmount = (val: any) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const cleaned = val.toString().replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    };

    Object.keys(statuses).forEach(key => {
      if (statuses[key] === 'Paid') {
        const [type, datePart] = key.split('_');
        if (type === 'Rent') {
          total += cleanAmount(currentRoomAmount);
        } else if (type === 'Electric' || type === 'Water') {
          const [y, m, d] = datePart.split('-').map(Number);
          const bill = bills.find(b => b.month === m && b.year === y);
          if (bill) {
            total += cleanAmount(type === 'Electric' ? bill.electricity : bill.water);
          }
        }
      }
    });
    setTotalPaid(total);
  };

  const loadData = async () => {
    try {
      // Load utility bills first to use in summary
      const utilityData = await AsyncStorage.getItem('utility_bills');
      let currentBills: any[] = [];
      if (utilityData) {
        const allUtilityBills = JSON.parse(utilityData);
        currentBills = allUtilityBills.filter((b: any) => b.roomId === tenant.roomId);
        setUtilityBills(currentBills);
      }

      // Load live room amount
      let currentRoomAmount = tenant.roomAmount || '0';
      if (tenant.roomId) {
        const roomsData = await AsyncStorage.getItem('rooms');
        if (roomsData) {
          const rooms = JSON.parse(roomsData);
          const currentRoom = rooms.find((r: any) => r.id === tenant.roomId);
          if (currentRoom && currentRoom.amount) {
            currentRoomAmount = currentRoom.amount;
            setRoomAmount(currentRoomAmount);
          }
        }
      }

      // Load payment statuses and calculate summary
      const paymentData = await AsyncStorage.getItem(`payments_${tenant.id}`);
      if (paymentData) {
        const statuses = JSON.parse(paymentData);
        setPaymentStatuses(statuses);
        calculateSummary(statuses, currentBills, currentRoomAmount);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentStatus = async (recordDate: string, type: string) => {
    try {
      const key = `${type}_${recordDate}`;
      const currentStatus = paymentStatuses[key];
      const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
      
      const updatedStatuses = {
        ...paymentStatuses,
        [key]: newStatus
      };
      
      setPaymentStatuses(updatedStatuses);
      await AsyncStorage.setItem(`payments_${tenant.id}`, JSON.stringify(updatedStatuses));
      
      // Recalculate summary
      calculateSummary(updatedStatuses, utilityBills, roomAmount);
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment status.');
    }
  };

  const generateRecords = () => {
    if (!tenant.startDate) return [];
    
    try {
      const [m, d, y] = tenant.startDate.split('/').map(Number);
      const start = new Date(y, m - 1, d);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const records = [];
      let current = new Date(start);

      // Generate 12 months
      for (let i = 0; i < 12; i++) {
        const dateISO = current.toISOString().split('T')[0];
        const monthNum = current.getMonth() + 1;
        const yearNum = current.getFullYear();
        
        let record: any = null;

        if (activeFilter === 'Rent') {
          const statusKey = `Rent_${dateISO}`;
          const storedStatus = paymentStatuses[statusKey];
          let status = 'Upcoming';
          let isOverdue = false;

          if (current < now) {
            status = storedStatus === 'Paid' ? 'Paid' : 'Overdue';
            isOverdue = status === 'Overdue';
          } else {
            status = storedStatus === 'Paid' ? 'Paid' : 'Upcoming';
          }

          record = {
            id: `rent_${i}`,
            dateKey: dateISO,
            date: new Date(current),
            amount: roomAmount,
            type: i === 0 ? 'Initial Rent' : 'Monthly Rent',
            status: status,
            isOverdue,
            filterType: 'Rent'
          };
        } else {
          // Electric or Water
          const utilityBill = utilityBills.find(b => b.month === monthNum && b.year === yearNum);
          const billAmount = activeFilter === 'Electric' ? utilityBill?.electricity : utilityBill?.water;
          
          if (billAmount && billAmount !== '0') {
            const statusKey = `${activeFilter}_${dateISO}`;
            const storedStatus = paymentStatuses[statusKey];
            let status = 'Upcoming';
            let isOverdue = false;

            if (current < now) {
              status = storedStatus === 'Paid' ? 'Paid' : 'Overdue';
              isOverdue = status === 'Overdue';
            } else {
              status = storedStatus === 'Paid' ? 'Paid' : 'Upcoming';
            }

            record = {
              id: `${activeFilter}_${i}`,
              dateKey: dateISO,
              date: new Date(current),
              amount: billAmount,
              type: `${activeFilter} Bill`,
              status: status,
              isOverdue,
              filterType: activeFilter
            };
          }
        }

        if (record) records.push(record);
        current.setMonth(current.getMonth() + 1);
      }
      
      return records;
    } catch (e) {
      console.error('Error generating records:', e);
      return [];
    }
  };

  const records = generateRecords();

  const renderRecordItem = ({ item }: { item: any }) => {
    const isPaid = item.status === 'Paid';
    const isOverdue = item.isOverdue;

    return (
      <TouchableOpacity 
        style={[styles.tableRow, isOverdue && styles.overdueRow]} 
        onPress={() => togglePaymentStatus(item.dateKey, item.filterType)}
        activeOpacity={0.7}
      >
        <View style={styles.tableCellDate}>
          <Text style={[styles.dateText, isOverdue && { color: '#CF1322' }]}>
            {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
        <View style={styles.tableCellAmount}>
          <Text style={[styles.amountText, isOverdue && { color: '#CF1322' }]}>₱{item.amount}</Text>
        </View>
        <View style={styles.tableCellStatus}>
          <View style={[
            styles.statusBadge, 
            isPaid && styles.paidBadge,
            isOverdue && styles.overdueBadge,
            !isPaid && !isOverdue && styles.upcomingBadge
          ]}>
            {isPaid ? (
              <CheckCircle2 color="#52C41A" size={12} />
            ) : isOverdue ? (
              <AlertCircle color="#F5222D" size={12} />
            ) : null}
            <Text style={[
              styles.statusBadgeText, 
              isPaid && styles.paidBadgeText,
              isOverdue && styles.overdueBadgeText,
              !isPaid && !isOverdue && styles.upcomingBadgeText
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Tenant Record</Text>
          <Text style={styles.headerSubtitle}>{tenant.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={styles.summaryValue}>₱{totalPaid.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryIcon}>
            <DollarSign color={Colors.white} size={24} />
          </View>
        </View>
      </View>

      <View style={styles.filterTabs}>
        {(['Rent', 'Electric', 'Water'] as const).map((filter) => (
          <TouchableOpacity 
            key={filter}
            style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterTabText, activeFilter === filter && styles.activeFilterTabText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>PERIOD / DATE</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>AMOUNT</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'right' }]}>STATUS</Text>
        </View>
        
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderRecordItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen color={Colors.border} size={50} />
              <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} records found.</Text>
              {activeFilter !== 'Rent' && (
                <Text style={styles.emptySubText}>Add bills in the "Bills" tab to see them here.</Text>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  activeFilterTabText: {
    color: Colors.white,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 10,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondary,
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
    paddingHorizontal: 5,
  },
  overdueRow: {
    backgroundColor: '#FFF1F0',
    borderRadius: 12,
    marginVertical: 2,
    borderBottomWidth: 0,
  },
  tableCellDate: {
    flex: 2,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  typeText: {
    fontSize: 11,
    color: Colors.secondary,
    marginTop: 2,
  },
  tableCellAmount: {
    flex: 1,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  tableCellStatus: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#F5F5F5',
    borderColor: '#D9D9D9',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  paidBadge: {
    backgroundColor: '#F6FFED',
    borderColor: '#B7EB8F',
  },
  paidBadgeText: {
    color: '#52C41A',
  },
  overdueBadge: {
    backgroundColor: '#FFF1F0',
    borderColor: '#FFA39E',
  },
  overdueBadgeText: {
    color: '#F5222D',
  },
  upcomingBadge: {
    backgroundColor: '#E6F7FF',
    borderColor: '#91D5FF',
  },
  upcomingBadgeText: {
    color: '#1890FF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubText: {
    marginTop: 5,
    fontSize: 13,
    color: Colors.secondary,
    textAlign: 'center',
  },
});

export default TenantRecordScreen;
