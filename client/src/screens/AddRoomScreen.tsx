import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Alert
} from 'react-native';
import { ArrowLeft, Camera, Plus, Check, X } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const AddRoomScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingRoom = route.params?.room;

  const [title, setTitle] = useState(editingRoom?.title || '');
  const [capacity, setCapacity] = useState(editingRoom?.capacity || '');
  const [amount, setAmount] = useState(editingRoom?.amount || '');
  const [roomType, setRoomType] = useState(editingRoom?.roomType || 'Bed spacer');
  const [status, setStatus] = useState(editingRoom?.status || 'Active');
  const [incentives, setIncentives] = useState<string[]>(editingRoom?.incentives || []);
  const [customIncentive, setCustomIncentive] = useState('');
  const [image, setImage] = useState<string | null>(editingRoom?.image || null);

  const [incentiveOptions, setIncentiveOptions] = useState(() => {
    const defaults = ['Aircon', 'Double Deck Bed', 'Private Bathroom', 'WiFi', 'Cabinet'];
    if (editingRoom?.incentives) {
      const uniqueExtras = editingRoom.incentives.filter((i: string) => !defaults.includes(i));
      return [...defaults, ...uniqueExtras];
    }
    return defaults;
  });

  const roomTypeOptions = ['Bed spacer', 'Whole room'];

  const formatAmount = (val: string) => {
    const cleanValue = val.replace(/[^0-9]/g, '');
    if (!cleanValue) return '';
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatAmount(text));
  };

  const toggleIncentive = (item: string) => {
    if (incentives.includes(item)) {
      setIncentives(incentives.filter(i => i !== item));
    } else {
      setIncentives([...incentives, item]);
    }
  };

  const addCustomIncentive = () => {
    if (customIncentive.trim()) {
      const newItem = customIncentive.trim();
      if (!incentiveOptions.includes(newItem)) {
        setIncentiveOptions([...incentiveOptions, newItem]);
      }
      if (!incentives.includes(newItem)) {
        setIncentives([...incentives, newItem]);
      }
      setCustomIncentive('');
    }
  };

  const removeIncentiveOption = (item: string) => {
    const defaultOptions = ['Aircon', 'Double Deck Bed', 'Private Bathroom', 'WiFi', 'Cabinet'];
    if (!defaultOptions.includes(item)) {
      setIncentiveOptions(incentiveOptions.filter(i => i !== item));
      setIncentives(incentives.filter(i => i !== item));
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload a photo.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title || !capacity || !amount) {
      Alert.alert('Error', 'Please fill in all required fields (Title, Capacity, and Amount)');
      return;
    }

    try {
      const existingRoomsData = await AsyncStorage.getItem('rooms');
      let rooms = existingRoomsData ? JSON.parse(existingRoomsData) : [];

      if (editingRoom) {
        rooms = rooms.map((r: any) =>
          r.id === editingRoom.id
            ? { ...r, title, capacity, amount, roomType, status, incentives, image }
            : r
        );
      } else {
        const newRoom = {
          id: Date.now().toString(),
          title,
          capacity,
          amount,
          roomType,
          status,
          incentives,
          image,
          createdAt: new Date().toISOString(),
        };
        rooms.push(newRoom);
      }

      await AsyncStorage.setItem('rooms', JSON.stringify(rooms));

      Alert.alert('Success', `Room details ${editingRoom ? 'updated' : 'saved'} successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Failed to save room:', error);
      Alert.alert('Error', 'Failed to save room details.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingRoom ? 'Edit Room' : 'Add New Room'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.uploadedImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera color={Colors.secondary} size={40} />
              <Text style={styles.photoText}>Add Room Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.label}>Room Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Room 101"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Capacity (Persons)</Text>
              <TextInput
                style={styles.input}
                placeholder="2"
                keyboardType="numeric"
                value={capacity}
                onChangeText={setCapacity}
              />
            </View>
          </View>

          <Text style={styles.label}>Room Type</Text>
          <View style={styles.floorList}>
            {roomTypeOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.floorChip, roomType === item && styles.floorChipActive]}
                onPress={() => setRoomType(item)}
              >
                <Text style={[styles.floorText, roomType === item && styles.floorTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Room Status</Text>
          <View style={styles.floorList}>
            {['Active', 'Maintenance'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.floorChip, status === item && styles.floorChipActive]}
                onPress={() => setStatus(item)}
              >
                <Text style={[styles.floorText, status === item && styles.floorTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Monthly Amount (₱)</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>

          <Text style={styles.label}>Amenities</Text>
          <View style={styles.incentiveList}>
            {incentiveOptions.map((item) => {
              const isDefault = ['Aircon', 'Double Deck Bed', 'Private Bathroom', 'WiFi', 'Cabinet'].includes(item);
              const isActive = incentives.includes(item);
              return (
                <View key={item} style={[styles.incentiveChip, isActive && styles.incentiveChipActive]}>
                  <TouchableOpacity style={styles.incentiveChipInner} onPress={() => toggleIncentive(item)}>
                    <Text style={[styles.incentiveText, isActive && styles.incentiveTextActive]}>{item}</Text>
                    {isActive && <Check color={Colors.white} size={14} style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                  {!isDefault && (
                    <TouchableOpacity style={styles.deleteTagButton} onPress={() => removeIncentiveOption(item)}>
                      <X color={isActive ? Colors.white : Colors.secondary} size={12} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            <View style={styles.customIncentiveContainer}>
              <TextInput
                style={styles.customIncentiveInput}
                placeholder="Add..."
                value={customIncentive}
                onChangeText={setCustomIncentive}
                onSubmitEditing={addCustomIncentive}
              />
              <TouchableOpacity style={styles.addButton} onPress={addCustomIncentive}>
                <Plus color={Colors.white} size={16} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
          <Text style={styles.submitButtonText}>Save Room Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scrollContent: { padding: 20, paddingBottom: 100 },
  photoUpload: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F2F5',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
  },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoText: { marginTop: 8, color: Colors.secondary, fontSize: 14 },
  uploadedImage: { width: '100%', height: '100%' },
  form: { gap: 15 },
  row: { flexDirection: 'row', gap: 15 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.secondary, marginBottom: 4 },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  currencySymbol: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginRight: 8 },
  amountInput: { flex: 1, paddingVertical: 12, fontSize: 18, fontWeight: '600', color: Colors.text },
  floorList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 5 },
  floorChip: {
    minWidth: 55,
    height: 40,
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  floorChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  floorText: { fontSize: 13, color: Colors.secondary, fontWeight: '600' },
  floorTextActive: { color: Colors.white },
  incentiveList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  incentiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  incentiveChipInner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingLeft: 12, paddingRight: 8 },
  incentiveChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  incentiveText: { fontSize: 12, color: Colors.secondary, fontWeight: '500' },
  incentiveTextActive: { color: Colors.white },
  deleteTagButton: { padding: 6, paddingLeft: 2, borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.05)' },
  customIncentiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: 10,
    paddingRight: 4,
    height: 34,
  },
  customIncentiveInput: { fontSize: 12, color: Colors.text, width: 70, paddingVertical: 0 },
  addButton: { backgroundColor: Colors.primary, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' }
});

export default AddRoomScreen;
