import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PitchScreen({ route, navigation, onPitchScoreUpdate }) {
  const { fileId } = route.params;
  const [pitchData, setPitchData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeStamps, setTimeStamps] = useState([]);
  const [duration, setDuration] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [pitchScore, setPitchScore] = useState(0); // pitchScore 상태 추가
  const [pitchRanges, setPitchRanges] = useState({
    low: 0,
    slightlyLow: 0,
    medium: 0,
    slightlyHigh: 0,
    high: 0,
    minPitch: 0,
    maxPitch: 0,
    avgPitch: 0
  });

  const fetchPitchData = async () => {
    const token = await AsyncStorage.getItem('@user_token');
    if (!token) {
      console.error('No token found');
      return;
    }
  
    const cachedPitchData = await AsyncStorage.getItem(`@pitch_data_${fileId}`);
    if (cachedPitchData) {
      const parsedData = JSON.parse(cachedPitchData);
      setPitchData(parsedData.pitch_values);
      setPitchScore(parsedData.pitch_score);
      setDuration(parsedData.duration);
      setPitchRanges(parsedData.pitch_ranges);
      setIsLoading(false);
      return;
    }
  
    try {
      const response = await axios.get(`http://192.168.35.47:5002/recordings/${fileId}/transcript`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const { pitch_values, pitch_score } = response.data;
  
      // pitch_score 배열의 첫 번째 요소를 가져옴
      const pitchScoreValue = Array.isArray(pitch_score) ? pitch_score[0] : 0;
      setPitchScore(pitchScoreValue);
      onPitchScoreUpdate(pitchScoreValue); // 콜백 함수 호출
  
      const totalDuration = pitch_values.length / 100;
      setDuration(totalDuration);
  
      const sampledPitchData = [];
      const sampledTimeStamps = [];
  
      let low = 0, slightlyLow = 0, medium = 0, slightlyHigh = 0, high = 0;
      let minPitch = Math.min(...pitch_values);
      let maxPitch = Math.max(...pitch_values);
      let sumPitch = 0;
  
      for (let i = 0; i < pitch_values.length; i++) {
        const pitch = pitch_values[i];
        sampledPitchData.push(pitch);
        if (i % 100 === 0) {
          sampledTimeStamps.push((i / 100).toFixed(1));
        }
        sumPitch += pitch;
  
        if (pitch < 85) low++;
        else if (pitch < 125) slightlyLow++;
        else if (pitch < 180) medium++;
        else if (pitch < 255) slightlyHigh++;
        else high++;
      }
  
      const avgPitch = sumPitch / pitch_values.length;
  
      setPitchData(sampledPitchData);
      setTimeStamps(sampledTimeStamps);
      setPitchRanges({
        low,
        slightlyLow,
        medium,
        slightlyHigh,
        high,
        minPitch,
        maxPitch,
        avgPitch
      });
  
      const pitchDataToCache = {
        pitch_values: sampledPitchData,
        pitch_score: pitchScoreValue,
        duration: totalDuration,
        pitch_ranges: {
          low,
          slightlyLow,
          medium,
          slightlyHigh,
          high,
          minPitch,
          maxPitch,
          avgPitch
        }
      };
  
      await AsyncStorage.setItem(`@pitch_data_${fileId}`, JSON.stringify(pitchDataToCache));
    } catch (error) {
      console.error('Failed to fetch pitch data', error.response ? error.response.data : error.message);
    } finally {
      setIsLoading(false);
    }
  };  

  useEffect(() => {
    fetchPitchData();
  }, []);

  const chartData = {
    labels: timeStamps,
    datasets: [{
      data: pitchData,
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      strokeWidth: 2,
      withDots: false,  // 점을 표시하지 않음
    }]
  };

  const getColorForRange = (value) => {
    if (value < 85) return 'red';
    if (value < 125) return 'red';
    if (value < 180) return 'orange';
    if (value < 255) return 'orange';
    return 'green';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>에너지 분석 결과 로딩중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>목소리 높낮이 분석 결과</Text>
      </View>
      <View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.infoText}>범위기준?</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>피치 사용 범위</Text>
      <View style={styles.legendContainer}>
        <Text style={{ color: getColorForRange(pitchRanges.minPitch) }}>{`최소값(${pitchRanges.minPitch.toFixed(1)}Hz)`}</Text>
        <Text style={{ color: getColorForRange(pitchRanges.avgPitch) }}>{`평균값(${pitchRanges.avgPitch.toFixed(1)}Hz)`}</Text>
        <Text style={{ color: getColorForRange(pitchRanges.maxPitch) }}>{`최대값(${pitchRanges.maxPitch.toFixed(1)}Hz)`}</Text>
      </View>
      <View style={styles.rangeContainer}>
        {pitchRanges.low > 0 && <View style={{ flex: pitchRanges.low / pitchData.length, backgroundColor: 'red' }} />}
        {pitchRanges.slightlyLow > 0 && <View style={{ flex: pitchRanges.slightlyLow / pitchData.length, backgroundColor: 'red' }} />}
        {pitchRanges.medium > 0 && <View style={{ flex: pitchRanges.medium / pitchData.length, backgroundColor: 'orange' }} />}
        {pitchRanges.slightlyHigh > 0 && <View style={{ flex: pitchRanges.slightlyHigh / pitchData.length, backgroundColor: 'orange' }} />}
        {pitchRanges.high > 0 && <View style={{ flex: pitchRanges.high / pitchData.length, backgroundColor: 'green' }} />}
      </View>
      <View style={styles.legendContainer}>
        {pitchRanges.low > 0 && <Text style={{ color: 'red' }}>낮음</Text>}
        {pitchRanges.medium > 0 && <Text style={{ color: 'orange' }}>보통</Text>}
        {pitchRanges.high > 0 && <Text style={{ color: 'green' }}>높음</Text>}
      </View>
      <Text style={styles.subHeader}>시간에 따른 피치 변화</Text>
      <ScrollView horizontal>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width * 2}
        height={300}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '0',  // 점을 거의 보이지 않게 설정
            strokeWidth: '0',
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        withInnerLines={false}
        withOuterLines={false}
        yLabelsOffset={-5}
        xLabelsOffset={-10}
        fromZero
        yAxisInterval={1}
        yLabelsWidth={60}
        formatYLabel={(y) => {
          if (y == 0) return `${y}Hz`;
          if (y <= 85) return `${y}Hz 낮음`;
          if (y <= 125) return `${y}Hz 약간 낮음`;
          if (y <= 180) return `${y}Hz 보통`;
          if (y <= 255) return `${y}Hz 약간 높음`;
          return `${y}Hz 높음`;
        }}
        formatXLabel={(x) => `${parseFloat(x).toFixed(1)}s`}
      />
      </ScrollView>
      <View style={styles.timeContainer}>
        <Text>0s</Text>
        <Text>{(duration / 2).toFixed(1)}s</Text>
        <Text>{duration.toFixed(1)}s</Text>
        </View>
        <Text style={styles.subHeader}>피치 점수</Text>
        <View style={styles.legendContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flex: pitchScore / 100, height: 20, backgroundColor: 'blue', marginRight: 10 }} />
            <Text style={{ color: 'black' }}>{`피치 점수: ${pitchScore.toFixed(1)} %`}</Text>
          </View>
        </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>❖ 피치 범위 기준 ❖</Text>
            <Text style={[styles.modalText, { color: 'red' }]}>· 낮음 (Low): 85Hz 이하</Text>
            <Text style={[styles.modalText, { color: 'red' }]}>· 약간 낮음 (Slightly Low): 85Hz ~ 125Hz</Text>
            <Text style={[styles.modalText, { color: 'orange' }]}>· 보통 (Medium): 125Hz ~ 180Hz</Text>
            <Text style={[styles.modalText, { color: 'orange' }]}>· 약간 높음 (Slightly High): 180Hz ~ 255Hz</Text>
            <Text style={[styles.modalText, { color: 'green' }]}>· 높음 (High): 255Hz 이상</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}>
              <Text style={styles.textStyle}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  rangeContainer: {
    flexDirection: 'row',
    height: 20,
    marginBottom: 5,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginBottom: 20,
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
  graphContainer: {
    height: 220,
    marginBottom: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  yAxisContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 220,
    position: 'absolute',
    left: 10,
    top: 220,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    color: '#888',
    marginRight: 5,
    textAlign: 'right',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});
