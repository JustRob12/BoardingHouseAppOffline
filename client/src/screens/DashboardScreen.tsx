import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, 
  Home, 
  DollarSign, 
  ChevronRight, 
  Calendar,
  User,
  UserPlus,
  PlusCircle,
  FileText,
  Settings,
  Cake,
  Gift
} from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 50) / 2;

const DashboardScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState({
    tenants: 0,
    rooms: 0,
    income: 0
  });
  const [recentTenants, setRecentTenants] = useState<any[]>([]);
  const [upcomingBirthday, setUpcomingBirthday] = useState<any>(null);

  const loadData = async () => {
    try {
      // Load Tenants
      const tenantsData = await AsyncStorage.getItem('tenants');
      const tenants = tenantsData ? JSON.parse(tenantsData) : [];
      
      // Load Rooms
      const roomsData = await AsyncStorage.getItem('rooms');
      const rooms = roomsData ? JSON.parse(roomsData) : [];

      // Load Utility Bills for calculation
      const utilityBillsData = await AsyncStorage.getItem('utility_bills');
      const allUtilityBills = utilityBillsData ? JSON.parse(utilityBillsData) : [];

      // Calculate Total Income
      let totalIncome = 0;
      const cleanAmount = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const cleaned = val.toString().replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
      };

      for (const tenant of tenants) {
        // Get the most accurate room amount (check room data first)
        const room = rooms.find((r: any) => r.id === tenant.roomId);
        const currentRoomAmount = room?.amount || tenant.roomAmount || '0';

        const paymentData = await AsyncStorage.getItem(`payments_${tenant.id}`);
        if (paymentData) {
          const payments = JSON.parse(paymentData);
          
          Object.keys(payments).forEach(key => {
            if (payments[key] === 'Paid') {
              if (key.startsWith('Rent_')) {
                totalIncome += cleanAmount(currentRoomAmount);
              } else if (key.startsWith('Electric_') || key.startsWith('Water_')) {
                // Format: Type_YYYY-MM-DD
                const parts = key.split('_');
                const type = parts[0];
                const datePart = parts[1];
                
                if (datePart) {
                  const [y, m, d] = datePart.split('-').map(Number);
                  
                  // Find corresponding utility bill
                  const bill = allUtilityBills.find((b: any) => 
                    b.roomId === tenant.roomId && 
                    b.month === m && 
                    b.year === y
                  );
                  
                  if (bill) {
                    if (type === 'Electric') {
                      totalIncome += cleanAmount(bill.electricity);
                    } else if (type === 'Water') {
                      totalIncome += cleanAmount(bill.water);
                    }
                  }
                }
              }
            }
          });
        }
      }

      setStats({
        tenants: tenants.length,
        rooms: rooms.length,
        income: totalIncome
      });

      // Sort and get max 3 newest tenants
      const sortedTenants = tenants.sort((a: any, b: any) => {
        return (b.createdAt || b.id) > (a.createdAt || a.id) ? 1 : -1;
      }).slice(0, 3);
      
      setRecentTenants(sortedTenants);
      calculateClosestBirthday(tenants);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const calculateClosestBirthday = (tenants: any[]) => {
    if (!tenants || tenants.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let closestTenant = null;
    let minDays = Infinity;

    tenants.forEach(tenant => {
      if (!tenant.birthday) return;

      const [month, day, year] = tenant.birthday.split('/').map(Number);
      if (!month || !day) return;

      let bday = new Date(today.getFullYear(), month - 1, day);
      
      if (bday < today) {
        bday.setFullYear(today.getFullYear() + 1);
      }

      const diffTime = bday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < minDays) {
        minDays = diffDays;
        closestTenant = { ...tenant, daysUntil: diffDays };
      }
    });

    setUpcomingBirthday(closestTenant);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const chunkArray = (arr: any[], size: number) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  const tenantChunks = chunkArray(recentTenants, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.primary, overflow: 'hidden' }]}>
            <View style={styles.decorativeCircle} />
            <View style={styles.statCardHeader}>
              <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Tenants</Text>
              <Users color="#FFF" size={16} />
            </View>
            <Text 
              style={[styles.statNumber, { color: '#FFF' }]} 
              numberOfLines={1} 
              adjustsFontSizeToFit
            >
              {stats.tenants}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.primary, overflow: 'hidden' }]}>
            <View style={styles.decorativeCircle} />
            <View style={styles.statCardHeader}>
              <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Rooms</Text>
              <Home color="#FFF" size={16} />
            </View>
            <Text 
              style={[styles.statNumber, { color: '#FFF' }]} 
              numberOfLines={1} 
              adjustsFontSizeToFit
            >
              {stats.rooms}
            </Text>
          </View>
        </View>

        <View style={[styles.incomeCard, { backgroundColor: colors.primary, overflow: 'hidden' }]}>
          <View style={[styles.decorativeCircle, { width: 150, height: 150, borderRadius: 75, top: -40, right: -40 }]} />
          <View style={styles.incomeCardHeader}>
            <View>
              <Text style={[styles.incomeLabel, { color: 'rgba(255,255,255,0.8)' }]}>Total Income</Text>
              <Text 
                style={[styles.incomeNumber, { color: '#FFF' }]} 
                numberOfLines={1} 
                adjustsFontSizeToFit
              >
                ₱{stats.income.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddTenant')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <UserPlus color={colors.primary} size={22} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Add Tenant</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Bills', { showAddModal: true })}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <FileText color={colors.primary} size={22} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Add Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddRoom')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <PlusCircle color={colors.primary} size={22} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Add Room</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('System')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <Settings color={colors.primary} size={22} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Settings</Text>
          </TouchableOpacity>
        </View>

      {/* Upcoming Birthday Section */}
      {upcomingBirthday && (
        <View style={styles.birthdayContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Birthday</Text>
          </View>
          <TouchableOpacity 
            style={[styles.birthdayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('TenantDetail', { tenant: upcomingBirthday })}
          >
            <View style={[styles.birthdayIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Cake color={colors.primary} size={24} />
            </View>
            <View style={styles.birthdayInfo}>
              <Text style={[styles.birthdayName, { color: colors.text }]}>{upcomingBirthday.name}</Text>
              <Text style={[styles.birthdayDetail, { color: colors.secondary }]}>
                {upcomingBirthday.roomTitle || 'No Room'} • {upcomingBirthday.birthday}
              </Text>
            </View>
            <View style={[styles.birthdayBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.birthdayBadgeText}>
                {upcomingBirthday.daysUntil === 0 ? 'Today!' : `In ${upcomingBirthday.daysUntil} days`}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

        {/* Recent Tenants Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Registered Tenants</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tenants')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentTenants.length === 0 ? (
          <View style={[styles.tenantsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.emptyTenants}>
              <Users color={colors.border} size={40} />
              <Text style={[styles.emptyText, { color: colors.secondary }]}>No tenants registered yet</Text>
            </View>
          </View>
        ) : (
          tenantChunks.map((chunk, chunkIndex) => (
            <View 
              key={`chunk-${chunkIndex}`} 
              style={[
                styles.tenantsList, 
                { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 15 }
              ]}
            >
              {chunk.map((tenant, index) => (
                <TouchableOpacity 
                  key={tenant.id} 
                  style={[
                    styles.tenantItem, 
                    { borderBottomColor: index === chunk.length - 1 ? 'transparent' : colors.border }
                  ]}
                  onPress={() => navigation.navigate('TenantDetail', { tenant })}
                >
                  <View style={styles.tenantInfo}>
                    {tenant.image ? (
                      <Image source={{ uri: tenant.image }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? colors.border : '#F0F2F5' }]}>
                        <User color={colors.secondary} size={20} />
                      </View>
                    )}
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[styles.tenantName, { color: colors.text }]}>{tenant.name}</Text>
                      <View style={styles.tenantMeta}>
                        <Home color={colors.secondary} size={12} />
                        <Text style={[styles.tenantMetaText, { color: colors.secondary }]}>{tenant.roomTitle || 'Unassigned'}</Text>
                        <View style={[styles.dot, { backgroundColor: colors.border }]} />
                        <Calendar color={colors.secondary} size={12} />
                        <Text style={[styles.tenantMetaText, { color: colors.secondary }]}>
                          {new Date(tenant.createdAt || parseInt(tenant.id)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight color={colors.border} size={20} />
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
  },
  profileIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 10,
  },
  statCard: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 2,
  },
  decorativeCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    zIndex: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  incomeCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  incomeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  incomeIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeLabel: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  incomeNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    marginTop: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 5,
  },
  actionButton: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  actionIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  viewAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  tenantsList: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tenantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  tenantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  tenantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tenantMetaText: {
    fontSize: 11,
    color: Colors.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  emptyTenants: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '500',
  },
  birthdayBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  birthdayContainer: {
    marginBottom: 25,
  },
  birthdayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  birthdayIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  birthdayDetail: {
    fontSize: 13,
  },
  birthdayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
});

export default DashboardScreen;
