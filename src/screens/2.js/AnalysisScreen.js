import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";

export default function AnalysisScreen({ route, navigation }) {
  const { fileId, existingTranscript } = route.params;
  const [transcript, setTranscript] = useState(existingTranscript || '');
  const [loading, setLoading] = useState(!existingTranscript);
  const [hateSpeechResults, setHateSpeechResults] = useState([]);
  const [speechRate, setSpeechRate] = useState(null);
  const [speedScore, setSpeedScore] = useState('');
  const [silenceDurations, setSilenceDurations] = useState([]);
  const [topKeywords, setTopKeywords] = useState([]);
  const [regexWordCounts, setRegexWordCounts] = useState({});
  const [normalWordCounts, setNormalWordCounts] = useState({});
  const [loadingMessage, setLoadingMessage] = useState(new Animated.Value(0));
  const [contentOpacity, setContentOpacity] = useState(new Animated.Value(0));

  const fetchTranscript = async () => {
    const token = await AsyncStorage.getItem('@user_token');
    if (!token) {
      console.error('No token found');
      return;
    }
    console.log('Token for fetching transcript:', token);
    try {
      const response = await axios.get(`http://192.168.219.148:5002/recordings/${fileId}/transcript`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Transcript fetched successfully:', response.data);
      setTranscript(response.data.transcript || '');
      setHateSpeechResults(response.data.hate_speech_results || []);
      setSpeechRate(response.data.speech_rate || null);
      setSpeedScore(response.data.speed_score || '');
      setSilenceDurations(response.data.silence_durations || []);
      setTopKeywords(response.data.top_keywords || []);
      setRegexWordCounts(response.data.regex_word_counts || {});
      setNormalWordCounts(response.data.normal_word_counts || {});
      await AsyncStorage.setItem(`@transcript_${fileId}`, JSON.stringify(response.data));
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to fetch transcript', error.response ? error.response.data : error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTranscript = async () => {
      const storedData = await AsyncStorage.getItem(`@transcript_${fileId}`);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setTranscript(parsedData.transcript || '');
        setHateSpeechResults(parsedData.hate_speech_results || []);
        setSpeechRate(parsedData.speech_rate || null);
        setSpeedScore(parsedData.speed_score || '');
        setSilenceDurations(parsedData.silence_durations || []);
        setTopKeywords(parsedData.top_keywords || []);
        setRegexWordCounts(parsedData.regex_word_counts || {});
        setNormalWordCounts(parsedData.normal_word_counts || {});
        setLoading(false);
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else if (!existingTranscript) {
        fetchTranscript();
      }
    };

    loadTranscript();

    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingMessage, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(loadingMessage, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      headerBackTitleVisible: false,
    });
  }, [navigation]);

  const getTokenStyle = (prob) => {
    if (prob >= 0.8) {
      return styles.highHateSpeechToken;
    } else if (prob >= 0.5) {
      return styles.mediumHateSpeechToken;
    } else {
      return styles.lowHateSpeechToken;
    }
  };

  const renderHateSpeechResults = () => {
    if (!hateSpeechResults || !hateSpeechResults.length) {
      return <Text style={styles.noResults}>혐오 표현이 감지되지 않았습니다.</Text>;
    }

    return hateSpeechResults.map((result, index) => (
      <View key={index} style={styles.resultContainer}>
        {result.model2_results.map((item, idx) => (
          <View key={idx} style={styles.hateSpeechItem}>
            <Text style={getTokenStyle(item[1])}>{item[0]}</Text>
            <View style={styles.progressBar}>
              <View style={{ ...styles.progress, width: `${item[1] * 100}%` }} />
            </View>
            <Text style={styles.percentage}>{(item[1] * 100).toFixed(2)}%</Text>
          </View>
        ))}
      </View>
    ));
  };

  const renderSilenceDurations = () => {
    if (!silenceDurations.length) {
      return <Text style={styles.noResults}>긴 침묵 구간이 없습니다.</Text>;
    }

    return silenceDurations.map((duration, index) => (
      <Text key={index} style={styles.silenceItem}>
        {duration[0]} - {duration[1]}: {duration[2].toFixed(2)}초
      </Text>
    ));
  };

  const renderWordCounts = (wordCounts) => {
    if (!wordCounts || !Object.keys(wordCounts).length) {
      return <Text style={styles.noResults}>단어 빈도 정보가 없습니다.</Text>;
    }

    return Object.entries(wordCounts).map(([word, count], index) => (
      <Text key={index} style={styles.wordCountItem}>
        {word}: {count}회
      </Text>
    ));
  };

  return (
    <LinearGradient colors={["#FFDEE9", "#B5FFFC"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>텍스트</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4b7bec" />
            <Animated.Text style={[styles.loadingText, { opacity: loadingMessage }]}>발표를 분석하는 중...</Animated.Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: contentOpacity }}>
            <Text style={styles.transcript}>{transcript}</Text>
            <Text style={styles.header}>말의 속도</Text>
            <Text style={styles.speechRate}>
              말의 속도: {speechRate ? speechRate.toFixed(2) : 'N/A'} ({speedScore})
            </Text>
            <Text style={styles.header}>혐오 표현 감지 결과</Text>
            {renderHateSpeechResults()}
            <Text style={styles.header}>침묵 구간</Text>
            {renderSilenceDurations()}
            <Text style={styles.header}>핵심 키워드</Text>
            <Text style={styles.keywords}>{topKeywords.join(', ')}</Text>
            <Text style={styles.header}>불필요한 말</Text>
            {renderWordCounts(regexWordCounts)}
            <Text style={styles.header}>반복된 단어</Text>
            {renderWordCounts(normalWordCounts)}
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 20,
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
  speechRate: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultContainer: {
    marginBottom: 15,
  },
  hateSpeechItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  highHateSpeechToken: {
    fontSize: 16,
    color: 'red',
    marginRight: 10,
  },
  mediumHateSpeechToken: {
    fontSize: 16,
    color: 'orange',
    marginRight: 10,
  },
  lowHateSpeechToken: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 10,
  },
  progress: {
    height: '100%',
    backgroundColor: '#ff6347',
  },
  percentage: {
    fontSize: 16,
    color: '#333',
  },
  noResults: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  silenceItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  wordCountItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  keywords: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
});
