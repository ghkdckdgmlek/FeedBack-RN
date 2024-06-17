import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import PitchScreen from './PitchScreen';
import VolumeScreen from './VolumeScreen';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 비동기 스토리지를 사용하기 위해 불러옴
// (비동기 스토리지: 데이터 저장 및 가져오는 작업을 비동기로 처리할 수 있게해주는 저장소, 앱 종료·재시작 되어도 데이터 유지)

const CustomTabs = ({ route }) => {
  const { fileId, pitchScore = 0, volumeScore = 0 } = route.params || {}; // route에서 fileId, pitchScore, volumeScore를 추출

  console.log("Received fileId: ", fileId);

  const [updatedPitchScore, setUpdatedPitchScore] = useState(pitchScore); // 피치 점수 상태 관리
  const [updatedVolumeScore, setUpdatedVolumeScore] = useState(volumeScore); // 볼륨 점수 상태 관리
  const [energyScore, setEnergyScore] = useState((pitchScore + volumeScore) / 2); // 에너지 점수 상태 관리
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 관리

  console.log("Received pitchScore: ", updatedPitchScore);
  console.log("Received volumeScore: ", updatedVolumeScore);

  // (useEffect 훅은 특정 값 변경될 때마다 실행되는 함수)
  useEffect(() => {
    const fetchData = async () => { // 데이터 불러오는 비동기 함수
      const token = await AsyncStorage.getItem('@user_token'); // 토큰을 비동기 스토리지에서 가져옴 (사용자 로그인 인증 토큰을 저장해 두고 서버 요청 시 이 토큰 사용)
      if (!token) {
        console.error('No token found');
        return;
      }

      try { // 서버에서 분석 데이터 가져옴
        const response = await axios.get(`http://192.168.219.148:5002/recordings/${fileId}/analysis`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { pitch_analysis, volume_analysis } = response.data; // 응답에서 피치, 볼륨 분석 데이터 추출
        if (pitch_analysis && volume_analysis) {
          const pitchScore = Array.isArray(pitch_analysis.pitch_score) ? pitch_analysis.pitch_score[0] : pitch_analysis.pitch_score;
          const volumeScore = Array.isArray(volume_analysis.volume_score) ? volume_analysis.volume_score[0] : volume_analysis.volume_score;
          setUpdatedPitchScore(pitchScore); // 피치 점수 업데이트
          setUpdatedVolumeScore(volumeScore); // 볼륨 점수 업데이트
          setEnergyScore((pitchScore + volumeScore) / 2); // 에너지 점수 업데이트
          setIsLoading(false); // 로딩 상태 false
        } else {
          console.error('No analysis data found');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch analysis data', error.response ? error.response.data : error.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fileId]); // fileId가 변경될 때마다 useEffect 훅을 다시 실행하여 데이터 가져오기

  const progress = useRef(new Animated.Value(0)).current; // 애니메인션 값 초기화
  const [activeTab, setActiveTab] = useState('Pitch'); // 활성 탭 상태 관리 (피치, 볼륨)

  useEffect(() => { // 에너지 점수 애니메이션
    Animated.timing(progress, {
      toValue: energyScore,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [energyScore]);

  const progressInterpolation = progress.interpolate({ // 애니메이션 값 퍼센트로 변환
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getColor = (score) => { // (에너지) 점수에 따른 색상 변환 함수
    if (score <= 20) return 'red';
    if (score <= 40) return 'orange';
    if (score <= 60) return 'yellow';
    if (score <= 80) return 'lightgreen';
    return 'green';
  };

// 현재 활성화된 탭 따라 내용 렌더링 함수
  const renderContent = () => { 
    if (isLoading) { // 로딩 중인 경우
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>에너지 분석 결과 로딩중...</Text>
        </View>
      );
    }

    switch (activeTab) { // 활성 탭에 따라 다른 화면 렌더링
      case 'Pitch':
        return <PitchScreen route={{ params: { fileId } }} onPitchScoreUpdate={setUpdatedPitchScore} />;
      case 'Volume':
        return <VolumeScreen route={{ params: { fileId } }} onVolumeScoreUpdate={setUpdatedVolumeScore} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>에너지 점수: {energyScore.toFixed(2)}%</Text>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressInterpolation,
                backgroundColor: getColor(energyScore),
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Pitch' && styles.activeTabButton]}
          onPress={() => setActiveTab('Pitch')}
        >
          <Text style={styles.tabText}>피치</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Volume' && styles.activeTabButton]}
          onPress={() => setActiveTab('Volume')}
        >
          <Text style={styles.tabText}>볼륨</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '80%',
    height: 30,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeTabButton: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#000',
  },
});

export default CustomTabs;