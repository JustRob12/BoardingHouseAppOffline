import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  TextInput, 
  ScrollView, 
  Alert,
  Dimensions
} from 'react-native';
import { Plus, BookOpen, Droplets, Zap, Home, Calendar, X, Trash2, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const LedgerScreen = () => {
  const { isDarkMode, colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [bills, setBills] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  
  // Filter State
  const [filterMonth, setFilterMonth] = useState<number | 'All'>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Form State
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [electricity, setElectricity] = useState('');
  const [water, setWater] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [year, setYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    try {
      const billsData = await AsyncStorage.getItem('utility_bills');
      if (billsData) setBills(JSON.parse(billsData));

      const roomsData = await AsyncStorage.getItem('rooms');
      if (roomsData) setRooms(JSON.parse(roomsData));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      
      // Check if we should open the add modal
      if (route.params?.showAddModal) {
        resetForm();
        setModalVisible(true);
        // Clear the param so it doesn't open again on next focus
        navigation.setParams({ showAddModal: undefined });
      }
    }, [route.params?.showAddModal])
  );

  const handleEditBill = (bill: any) => {
    setEditingBill(bill);
    setSelectedRoom({ id: bill.roomId, title: bill.roomTitle });
    setElectricity(bill.electricity);
    setWater(bill.water);
    setMonth(bill.month);
    setYear(bill.year);
    setModalVisible(true);
  };

  const handleSaveBill = async () => {
    if (!selectedRoom) {
      Alert.alert('Error', 'Please select a room.');
      return;
    }

    if (!electricity && !water) {
      Alert.alert('Error', 'Please input at least one bill (Electricity or Water).');
      return;
    }

    try {
      let updatedBills;
      if (editingBill) {
        updatedBills = bills.map(b => b.id === editingBill.id ? {
          ...b,
          roomId: selectedRoom.id,
          roomTitle: selectedRoom.title,
          electricity: electricity || '0',
          water: water || '0',
          month,
          year,
          dateKey: `${year}-${String(month).padStart(2, '0')}-01`,
        } : b);
      } else {
        const newBill = {
          id: Date.now().toString(),
          roomId: selectedRoom.id,
          roomTitle: selectedRoom.title,
          electricity: electricity || '0',
          water: water || '0',
          month,
          year,
          dateKey: `${year}-${String(month).padStart(2, '0')}-01`,
          createdAt: new Date().toISOString(),
        };
        updatedBills = [newBill, ...bills];
      }

      setBills(updatedBills);
      await AsyncStorage.setItem('utility_bills', JSON.stringify(updatedBills));
      
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save utility bill.');
    }
  };

  const handleDeleteBill = (id: string) => {
    Alert.alert('Delete Bill', 'Are you sure you want to remove this record?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          const updated = bills.filter(b => b.id !== id);
          setBills(updated);
          await AsyncStorage.setItem('utility_bills', JSON.stringify(updated));
        }
      }
    ]);
  };

  const resetForm = () => {
    setEditingBill(null);
    setSelectedRoom(null);
    setElectricity('');
    setWater('');
    setMonth(new Date().getMonth() + 1);
  };

  const filteredBills = bills.filter(bill => {
    const monthMatch = filterMonth === 'All' || bill.month === filterMonth;
    const yearMatch = bill.year === filterYear;
    return monthMatch && yearMatch;
  });

  const renderBillItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.billCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleEditBill(item)} activeOpacity={0.7}>
      <View style={[styles.billHeader, { borderBottomColor: isDarkMode ? colors.border : '#F0F2F5' }]}>
        <View style={[styles.roomIconContainer, { backgroundColor: isDarkMode ? colors.border : '#F0F5FF' }]}>
          <Home color={colors.primary} size={20} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.billRoomTitle, { color: colors.text }]}>{item.roomTitle}</Text>
          <Text style={[styles.billDate, { color: colors.secondary }]}>
            {new Date(item.year, item.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteBill(item.id)}>
          <Trash2 color="#FF4D4F" size={18} />
        </TouchableOpacity>
      </View>

      <View style={styles.billDetails}>
        <View style={styles.detailItem}>
          <Zap color="#FFAB00" size={16} />
          <Text style={[styles.detailLabel, { color: colors.secondary }]}>Electricity:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>₱{item.electricity}</Text>
        </View>
        <View style={styles.detailItem}>
          <Droplets color="#0052CC" size={16} />
          <Text style={[styles.detailLabel, { color: colors.secondary }]}>Water:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>₱{item.water}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.filterSection, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthFilterScroll}>
          <TouchableOpacity 
            style={[
              styles.filterMonthChip, 
              { backgroundColor: isDarkMode ? colors.border : '#F0F2F5', borderColor: colors.border },
              filterMonth === 'All' && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setFilterMonth('All')}
          >
            <Text style={[styles.filterMonthChipText, { color: colors.secondary }, filterMonth === 'All' && { color: '#FFF' }]}>All</Text>
          </TouchableOpacity>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
            <TouchableOpacity 
              key={m}
              style={[
                styles.filterMonthChip, 
                { backgroundColor: isDarkMode ? colors.border : '#F0F2F5', borderColor: colors.border },
                filterMonth === idx + 1 && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setFilterMonth(idx + 1)}
            >
              <Text style={[styles.filterMonthChipText, { color: colors.secondary }, filterMonth === idx + 1 && { color: '#FFF' }]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.yearFilterContainer}>
          <TouchableOpacity onPress={() => setFilterYear(filterYear - 1)}>
            <ChevronLeft color={colors.secondary} size={20} />
          </TouchableOpacity>
          <Text style={[styles.yearText, { color: colors.text }]}>{filterYear}</Text>
          <TouchableOpacity onPress={() => setFilterYear(filterYear + 1)}>
            <ChevronRight color={colors.secondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredBills}
        keyExtractor={(item) => item.id}
        renderItem={renderBillItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BookOpen color={colors.border} size={60} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>No utility bills recorded yet.</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => { resetForm(); setModalVisible(true); }}
      >
        <Plus color={Colors.white} size={30} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editingBill ? 'Edit Utility Bill' : 'Add Utility Bill'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.secondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              <Text style={[styles.label, { color: colors.secondary }]}>Select Room</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomPicker}>
                {rooms.map(room => (
                  <TouchableOpacity 
                    key={room.id}
                    style={[
                      styles.roomChip, 
                      { backgroundColor: isDarkMode ? colors.border : '#F0F2F5', borderColor: colors.border },
                      selectedRoom?.id === room.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setSelectedRoom(room)}
                  >
                    <Text style={[styles.roomChipText, { color: colors.text }, selectedRoom?.id === room.id && { color: '#FFF' }]}>
                      {room.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.secondary }]}>Electricity (₱)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? colors.background : '#F8F9FA', borderColor: colors.border }]}>
                    <Zap color="#FFAB00" size={18} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="0.00"
                      placeholderTextColor={colors.secondary}
                      keyboardType="numeric"
                      value={electricity}
                      onChangeText={setElectricity}
                    />
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={[styles.label, { color: colors.secondary }]}>Water (₱)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? colors.background : '#F8F9FA', borderColor: colors.border }]}>
                    <Droplets color="#0052CC" size={18} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="0.00"
                      placeholderTextColor={colors.secondary}
                      keyboardType="numeric"
                      value={water}
                      onChangeText={setWater}
                    />
                  </View>
                </View>
              </View>

              <Text style={[styles.label, { color: colors.secondary }]}>For the Month of</Text>
              <View style={styles.monthGrid}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                  <TouchableOpacity 
                    key={m}
                    style={[
                      styles.monthChip, 
                      { backgroundColor: isDarkMode ? colors.border : '#F0F2F5', borderColor: colors.border },
                      month === idx + 1 && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setMonth(idx + 1)}
                  >
                    <Text style={[styles.monthChipText, { color: colors.text }, month === idx + 1 && { color: '#FFF' }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveBill}>
              <Text style={styles.saveButtonText}>Save Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterSection: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  monthFilterScroll: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterMonthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterMonthChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterMonthChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  filterMonthChipTextActive: {
    color: Colors.white,
  },
  yearFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 5,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondary,
    marginTop: 4,
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  billCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  roomIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  billRoomTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  billDate: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
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
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
  },
  formContent: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 10,
    marginTop: 15,
  },
  roomPicker: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  roomChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roomChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roomChipText: {
    fontWeight: '700',
    color: Colors.text,
  },
  roomChipTextActive: {
    color: Colors.white,
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthChip: {
    width: (width - 90) / 4,
    paddingVertical: 10,
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  monthChipTextActive: {
    color: Colors.white,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default LedgerScreen;
