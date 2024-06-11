import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient"; // Import LinearGradient

const ChangeNameScreen = () => {
  const [newName, setNewName] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '', // 뒤로 가기 버튼의 텍스트를 제거합니다
      headerBackTitleVisible: false, // 뒤로 가기 타이틀이 보이지 않도록 합니다
    });
  }, [navigation]);

  const handleChangeName = async () => {
    const token = await AsyncStorage.getItem("@user_token");
    try {
      const response = await axios.post(
        "http://192.168.219.100:5001/changeName",
        { newName },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert("성공", response.data.message);
      navigation.goBack();
    } catch (error) {
      Alert.alert("오류", "이름 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <LinearGradient colors={["#FFDEE9", "#B5FFFC"]} style={styles.container}>
      <Text style={styles.label}>새 이름</Text>
      <TextInput
        style={styles.input}
        value={newName}
        onChangeText={setNewName}
      />
      <TouchableOpacity style={styles.button} onPress={handleChangeName}>
        <Text style={styles.buttonText}>변경</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const ChangeEmailScreen = () => {
  const [newEmail, setNewEmail] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '', // 뒤로 가기 버튼의 텍스트를 제거합니다
      headerBackTitleVisible: false, // 뒤로 가기 타이틀이 보이지 않도록 합니다
    });
  }, [navigation]);

  const handleChangeEmail = async () => {
    const token = await AsyncStorage.getItem("@user_token");
    try {
      const response = await axios.post(
        "http://192.168.100.145:5001/changeEmail",
        { newEmail },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert("성공", response.data.message);
      navigation.goBack();
    } catch (error) {
      Alert.alert("오류", "이메일 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <LinearGradient colors={["#FFDEE9", "#B5FFFC"]} style={styles.container}>
      <Text style={styles.label}>새 이메일</Text>
      <TextInput
        style={styles.input}
        value={newEmail}
        onChangeText={setNewEmail}
      />
      <TouchableOpacity style={styles.button} onPress={handleChangeEmail}>
        <Text style={styles.buttonText}>변경</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const ChangePasswordScreen = () => {
  const [newPassword, setNewPassword] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '', // 뒤로 가기 버튼의 텍스트를 제거합니다
      headerBackTitleVisible: false, // 뒤로 가기 타이틀이 보이지 않도록 합니다
    });
  }, [navigation]);

  const handleChangePassword = async () => {
    const token = await AsyncStorage.getItem("@user_token");
    try {
      const response = await axios.post(
        "http://192.168.219.100:5001/changePassword",
        { newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert("성공", response.data.message);
      navigation.goBack();
    } catch (error) {
      Alert.alert("오류", "비밀번호 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <LinearGradient colors={["#FFDEE9", "#B5FFFC"]} style={styles.container}>
      <Text style={styles.label}>새 비밀번호</Text>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>변경</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#1c1c1c",
  },
  label: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 5,
    color: "#fff",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#0a6ed6",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});

export { ChangeNameScreen, ChangeEmailScreen, ChangePasswordScreen };
