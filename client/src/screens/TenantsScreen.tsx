import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Platform,
  Modal,
  Alert,
  ScrollView,
  TextInput
} from 'react-native';
import { Plus, User, Phone, Mail, Search, Home, MoreVertical, Eye, X, FileText, Clock, DollarSign, Calendar } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

const TenantsScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const navigation = useNavigation<any>();
  const [tenants, setTenants] = useState<any[]>([]);
  const [allTenants, setAllTenants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const loadData = async () => {
    try {
      const tenantsData = await AsyncStorage.getItem('tenants');
      if (tenantsData) {
        const parsedTenants = JSON.parse(tenantsData);
        setAllTenants(parsedTenants);
        applyFilters(parsedTenants, searchQuery);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const applyFilters = (tenantsList: any[], query: string) => {
    let filtered = [...tenantsList];

    // Search Query
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.phone.includes(q) ||
        (t.email && t.email.toLowerCase().includes(q))
      );
    }

    setTenants(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(allTenants, text);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} has been copied to clipboard.`);
    setModalVisible(false);
  };

  const calculateBilling = (startDateStr: string, amount: string) => {
    if (!startDateStr) return { nextBill: 'N/A', daysLeft: 'N/A' };
    
    try {
      const [m, d, y] = startDateStr.split('/').map(Number);
      const start = new Date(y, m - 1, d);
      const now = new Date();
      
      // Calculate next bill date (same day next month)
      let nextBill = new Date(now.getFullYear(), now.getMonth(), d);
      if (nextBill < now) {
        nextBill.setMonth(nextBill.getMonth() + 1);
      }
      
      const diffTime = nextBill.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        nextBill: nextBill.toLocaleDateString(),
        daysLeft: diffDays.toString()
      };
    } catch (e) {
      return { nextBill: 'Error', daysLeft: 'Error' };
    }
  };

  const openModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setModalVisible(true);
  };

  const renderTenantCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.tenantCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openModal(item)}>
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? colors.border : '#F0F2F5' }]}>
            <User color={colors.secondary} size={24} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={[styles.tenantName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.tenantAge, { color: colors.secondary }]}>{item.age} Years Old • {item.birthday}</Text>
          {item.roomTitle && (
            <View style={[styles.roomBadge, { backgroundColor: isDarkMode ? colors.border : '#F0F2F5' }]}>
              <Home color={colors.primary} size={10} />
              <Text style={[styles.roomBadgeText, { color: colors.primary }]}>{item.roomTitle}</Text>
            </View>
          )}
        </View>
        <MoreVertical color={colors.secondary} size={20} />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.contactItem}>
          <Phone color={colors.primary} size={14} />
          <Text style={[styles.contactText, { color: colors.text }]}>{item.phone}</Text>
        </View>
        <View style={styles.contactItem}>
          <Mail color={colors.primary} size={14} />
          <Text style={[styles.contactText, { color: colors.text }]} numberOfLines={1}>{item.email || 'No email'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        {isSearching ? (
          <View style={[styles.searchBarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name or phone..."
              placeholderTextColor={colors.secondary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setIsSearching(false); handleSearch(''); }}>
              <X color={colors.secondary} size={20} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.mainTitle, { color: colors.text }]}>Tenants</Text>
            <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setIsSearching(true)}>
              <Search color={colors.secondary} size={20} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <FlatList
        data={tenants}
        keyExtractor={(item) => item.id}
        renderItem={renderTenantCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User color={colors.border} size={60} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>No tenants registered yet.</Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AddTenant')}
            >
              <Text style={styles.emptyButtonText}>Add Your First Tenant</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTenant')}
        activeOpacity={0.8}
      >
        <Plus color={Colors.white} size={30} strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedTenant?.name}</Text>
            
            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomColor: colors.border }]} 
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('TenantDetail', { tenant: selectedTenant });
              }}
            >
              <Eye color={colors.primary} size={20} />
              <Text style={[styles.modalOptionText, { color: colors.text }]}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomColor: colors.border }]} 
              onPress={() => handleCopy(selectedTenant?.phone, 'Phone number')}
            >
              <Phone color={colors.primary} size={20} />
              <Text style={[styles.modalOptionText, { color: colors.text }]}>Call (Copy Number)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomColor: colors.border }]} 
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('TenantRecord', { tenant: selectedTenant });
              }}
            >
              <FileText color={colors.primary} size={20} />
              <Text style={[styles.modalOptionText, { color: colors.text }]}>View Record</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomColor: colors.border }]} 
              onPress={() => handleCopy(selectedTenant?.email, 'Email address')}
            >
              <Mail color={colors.primary} size={20} />
              <Text style={[styles.modalOptionText, { color: colors.text }]}>Message (Copy Email)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
  },
  searchButton: {
    padding: 8,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 45,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  tenantCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  tenantAge: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
    gap: 4,
  },
  roomBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  contactText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.secondary,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: Colors.white,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  closeModalButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  closeModalText: {
    fontSize: 16,
    color: '#FF4D4F',
    fontWeight: '700',
  },
  recordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  recordModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: '60%',
  },
  recordHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primary,
    marginBottom: 15,
  },
  recordAvatar: {
    width: '100%',
    height: '100%',
  },
  recordName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 5,
  },
  recordRoom: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600',
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordTable: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 10,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  tableCellLabel: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cellLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  cellValueText: {
    flex: 2,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  daysLeftBadge: {
    backgroundColor: '#F6FFED',
    borderWidth: 1,
    borderColor: '#B7EB8F',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
  },
  daysLeftText: {
    color: '#52C41A',
    fontWeight: '700',
    fontSize: 13,
  },
  recordCloseButton: {
    marginTop: 30,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
  },
  recordCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
});

export default TenantsScreen;
