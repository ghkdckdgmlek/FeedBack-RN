import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import axios from 'axios';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';

const LogOutScreen = () => {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [isModalVisible, setModalVisible] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃 확인',
      '정말로 로그아웃 하시겠습니까?',
      [
        {
          text: '아니오',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: '예',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@user_token');
              logout();
              navigation.dispatch(CommonActions.reset({
                index: 0,
                routes: [{ name: '로그인' }],
              }));
              Alert.alert('로그아웃 완료', '성공적으로 로그아웃되었습니다.');
            } catch (error) {
              console.error('Logout failed', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleDeleteUser = async () => {
    setModalVisible(true);
  };

  const confirmDeleteUser = async () => {
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (!token) {
        return Alert.alert('오류', '인증 토큰이 없습니다.');
      }

      const response = await axios.post('http://192.168.219.175:5001/deleteUser', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === 'ok') {
        Alert.alert(
          '회원 탈퇴 완료!',
          '회원 탈퇴가 성공적으로 완료되었습니다.',
          [
            {
              text: 'OK', onPress: () => {
                logout();
                navigation.navigate('로그인');
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('오류', '회원 탈퇴에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('오류', '서버와 통신하는 동안 문제가 발생했습니다.');
    } finally {
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('ChangeName')}>
        <Text style={styles.optionText}>Change name</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('ChangeEmail')}>
        <Text style={styles.optionText}>Change email</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('ChangePassword')}>
        <Text style={styles.optionText}>Change password</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={handleLogout}>
        <Text style={styles.optionText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteUser}>
        <Text style={styles.deleteButtonText}>Delete account</Text>
      </TouchableOpacity>

      <Modal isVisible={isModalVisible}>
        <View style={styles.modalContent}>
          <Image source={require('../../../assets/cry.webp')} style={styles.image} />
          <Text style={styles.modalText}>정말로 회원탈퇴 하시겠습니까?</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.modalButton1} onPress={confirmDeleteUser}>
              <Text style={styles.modalButtonText}>예</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton2} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>아니오</Text>
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
    backgroundColor: '#1c1c1c',
    padding: 16,
  },
  header: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  optionText: {
    fontSize: 18,
    color: '#fff',
  },
  deleteButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'red',
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton1: {
    flex: 1,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  modalButton2: {
    flex: 1,
    padding: 10,
    backgroundColor: 'green',
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LogOutScreen;
