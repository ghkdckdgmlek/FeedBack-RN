import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import PitchScreen from './PitchScreen';
import VolumeScreen from './VolumeScreen';

const CustomTabs = ({ route }) => {
  const { fileId, pitchScore = 0, volumeScore = 0 } = route.params || {};

  console.log("Received fileId: ", fileId);
  console.log("Received pitchScore: ", pitchScore);
  console.log("Received volumeScore: ", volumeScore);

  const validPitchScore = isNaN(pitchScore) ? 0 : pitchScore;
  const validVolumeScore = isNaN(volumeScore) ? 0 : volumeScore;
  const [updatedPitchScore, setUpdatedPitchScore] = useState(validPitchScore); // 추가된 상태
  const [updatedVolumeScore, setUpdatedVolumeScore] = useState(validVolumeScore); // 추가된 상태
  const energyScore = (updatedPitchScore + updatedVolumeScore) / 2;

  const progress = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState('Pitch');

  useEffect(() => {
    Animated.timing(progress, {
      toValue: energyScore,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [energyScore]);

  const progressInterpolation = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getColor = (score) => {
    if (score <= 20) return 'red';
    if (score <= 40) return 'orange';
    if (score <= 60) return 'yellow';
    if (score <= 80) return 'lightgreen';
    return 'green';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Pitch':
        return <PitchScreen route={{ params: { fileId } }} onPitchScoreUpdate={setUpdatedPitchScore} />; // 콜백 함수 전달
      case 'Volume':
        return <VolumeScreen route={{ params: { fileId } }} onVolumeScoreUpdate={setUpdatedVolumeScore} />; // 콜백 함수 전달
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
});

export default CustomTabs;
