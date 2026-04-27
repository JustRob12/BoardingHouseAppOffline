import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Camera, User, Phone, Mail, Calendar, Hash } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const AddTenantScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingTenant = route.params?.tenant;

  const [firstName, setFirstName] = useState(editingTenant?.firstName || '');
  const [lastName, setLastName] = useState(editingTenant?.lastName || '');
  const [middleInitial, setMiddleInitial] = useState(editingTenant?.middleInitial || '');
  const [extension, setExtension] = useState(editingTenant?.extension || '');
  const [age, setAge] = useState(editingTenant?.age || '');
  const [birthday, setBirthday] = useState(editingTenant?.birthday || '');
  const [startDate, setStartDate] = useState(editingTenant?.startDate || '');
  const [email, setEmail] = useState(editingTenant?.email || '');
  const [phone, setPhone] = useState(editingTenant?.phone || '');
  const [image, setImage] = useState<string | null>(editingTenant?.image || null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(
    editingTenant?.roomId ? { id: editingTenant.roomId, title: editingTenant.roomTitle } : null
  );

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await AsyncStorage.getItem('rooms');
        if (data) {
          setRooms(JSON.parse(data));
        }
      } catch (error) {
        console.error('Error loading rooms:', error);
      }
    };
    loadRooms();
  }, []);



  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to upload a profile picture.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your camera to take a profile picture.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose a source',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    if (!firstName || !lastName || !age || !birthday || !startDate || !phone) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Age, Birthday, Start Date, Phone).');
      return;
    }

    // Basic date validation
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(birthday) || !dateRegex.test(startDate)) {
      Alert.alert('Invalid Date', 'Please use mm/dd/yyyy format for dates.');
      return;
    }

    try {
      const existingTenantsData = await AsyncStorage.getItem('tenants');
      let tenants = existingTenantsData ? JSON.parse(existingTenantsData) : [];

      const fullName = `${firstName}${middleInitial ? ' ' + middleInitial : ''} ${lastName}${extension ? ' ' + extension : ''}`;

      if (editingTenant) {
        tenants = tenants.map((t: any) => 
          t.id === editingTenant.id 
            ? { 
                ...t, 
                name: fullName, 
                firstName, 
                lastName, 
                middleInitial, 
                extension, 
                age, 
                birthday, 
                startDate,
                email, 
                phone, 
                image,
                roomId: selectedRoom?.id || null,
                roomTitle: selectedRoom?.title || null,
                roomAmount: selectedRoom?.amount || '0',
              } 
            : t
        );
      } else {
        const newTenant = {
          id: Date.now().toString(),
          name: fullName,
          firstName,
          lastName,
          middleInitial,
          extension,
          age,
          birthday,
          startDate,
          email,
          phone,
          image,
          roomId: selectedRoom?.id || null,
          roomTitle: selectedRoom?.title || null,
          roomAmount: selectedRoom?.amount || '0',
          createdAt: new Date().toISOString(),
        };
        tenants.push(newTenant);
      }

      await AsyncStorage.setItem('tenants', JSON.stringify(tenants));

      Alert.alert('Success', `Tenant ${editingTenant ? 'updated' : 'added'} successfully!`, [
        { text: 'OK', onPress: () => navigation.pop(editingTenant ? 2 : 1) }
      ]);
    } catch (error) {
      console.error('Failed to save tenant:', error);
      Alert.alert('Error', 'Failed to save tenant details.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.photoContainer} onPress={showImageSourceOptions}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera color={Colors.secondary} size={40} />
              <Text style={styles.photoText}>Add Profile Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Juan"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Dela Cruz"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Middle Initial</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="P."
                  value={middleInitial}
                  onChangeText={setMiddleInitial}
                  maxLength={5}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Extension (Optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Jr., Sr."
                  value={extension}
                  onChangeText={setExtension}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { width: 80 }]}>
              <Text style={styles.label}>Age</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="20"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Birthday (mm/dd/yyyy)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="00/00/0000"
                  value={birthday}
                  onChangeText={(text) => {
                    const clean = text.replace(/\D/g, '');
                    let final = clean;
                    if (clean.length > 2) final = clean.slice(0, 2) + '/' + clean.slice(2);
                    if (clean.length > 4) final = final.slice(0, 5) + '/' + final.slice(5, 9);
                    setBirthday(final);
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date (mm/dd/yyyy)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="00/00/0000"
                value={startDate}
                onChangeText={(text) => {
                  const clean = text.replace(/\D/g, '');
                  let final = clean;
                  if (clean.length > 2) final = clean.slice(0, 2) + '/' + clean.slice(2);
                  if (clean.length > 4) final = final.slice(0, 5) + '/' + final.slice(5, 9);
                  setStartDate(final);
                }}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign Room</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomList}>
              {rooms.length === 0 ? (
                <Text style={styles.noRoomsText}>No rooms available to assign.</Text>
              ) : (
                rooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.roomChip,
                      selectedRoom?.id === room.id && styles.roomChipActive
                    ]}
                    onPress={() => setSelectedRoom(room)}
                  >
                    <Text style={[
                      styles.roomChipText,
                      selectedRoom?.id === room.id && styles.roomChipTextActive
                    ]}>
                      {room.title}
                    </Text>
                    <Text style={[
                      styles.roomTypeText,
                      selectedRoom?.id === room.id && styles.roomTypeTextActive
                    ]}>
                      {room.roomType}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail color={Colors.secondary} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="juan@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone color={Colors.secondary} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0912 345 6789"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
          <Text style={styles.submitButtonText}>{editingTenant ? 'Save Changes' : 'Register Tenant'}</Text>
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
  photoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F0F2F5',
    alignSelf: 'center',
    marginBottom: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center' },
  photoText: { marginTop: 8, color: Colors.secondary, fontSize: 12, fontWeight: '600' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.secondary },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  inputRow: { flexDirection: 'row', gap: 15 },
  roomList: { flexDirection: 'row', marginBottom: 5 },
  roomChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roomChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roomChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  roomChipTextActive: {
    color: Colors.white,
  },
  roomTypeText: {
    fontSize: 10,
    color: Colors.secondary,
    marginTop: 2,
  },
  roomTypeTextActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  noRoomsText: {
    color: Colors.secondary,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' }
});

export default AddTenantScreen;
