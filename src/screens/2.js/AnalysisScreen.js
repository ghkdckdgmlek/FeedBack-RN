import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";


export default function AnalysisScreen({ route, navigation }) {
  const { fileId, existingTranscript } = route.params;  // 기존 변환 결과를 전달받음
  const [transcript, setTranscript] = useState(existingTranscript || '');  // 초기값 설정
  const [loading, setLoading] = useState(!existingTranscript);  // 기존 변환 결과가 있으면 로딩을 하지 않음
  const [speechRate, setSpeechRate] = useState(null);
  const [speedScore, setSpeedScore] = useState(null);

  const fetchTranscript = async () => {
    const token = await AsyncStorage.getItem('@user_token');
    if (!token) {
      console.error('No token found');
      return;
    }
    console.log('Token for fetching transcript:', token);
    try {
      const response = await axios.get(`http://192.168.219.175:5002/recordings/${fileId}/transcript`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Transcript fetched successfully:', response.data);
      setTranscript(response.data.transcript);
      setSpeechRate(response.data.speech_rate);
      setSpeedScore(response.data.speed_score);
    } catch (error) {
      console.error('Failed to fetch transcript', error.response ? error.response.data : error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!existingTranscript) {
      fetchTranscript();
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '', // 뒤로 가기 버튼의 텍스트를 제거합니다
      headerBackTitleVisible: false, // 뒤로 가기 타이틀이 보이지 않도록 합니다
    });
  }, [navigation]);

  return (
    <LinearGradient colors={["#FFDEE9", "#B5FFFC"]} style={styles.container}>
      <Text style={styles.header}>Transcript</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4b7bec" />
      ) : (
        <View>
          <Text style={styles.transcript}>{transcript}</Text>
          <Text style={styles.analysis}>Speech Rate: {speechRate ? speechRate.toFixed(2) : 'N/A'} words/second</Text>
          <Text style={styles.analysis}>Speed Score: {speedScore}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  transcript: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    marginBottom: 20,
  },
  analysis: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    marginBottom: 10,
  },
});
