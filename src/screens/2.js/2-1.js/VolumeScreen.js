import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VolumeScreen({ route, navigation, onVolumeScoreUpdate }) {
  const { fileId } = route.params;
  const [volumeData, setVolumeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeStamps, setTimeStamps] = useState([]);
  const [duration, setDuration] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [volumeScore, setVolumeScore] = useState(0); // 볼륨 점수 상태 추가
  const [volumeRanges, setVolumeRanges] = useState({
    low: 0,
    slightlyLow: 0,
    medium: 0,
    slightlyHigh: 0,
    high: 0,
    minVolume: 0,
    maxVolume: 0,
    avgVolume: 0
  });

  const fetchVolumeData = async () => {
    const token = await AsyncStorage.getItem('@user_token');
    if (!token) {
      console.error('No token found');
      return;
    }
  
    const cachedVolumeData = await AsyncStorage.getItem(`@volume_data_${fileId}`);
    if (cachedVolumeData) {
      const parsedData = JSON.parse(cachedVolumeData);
      setVolumeData(parsedData.rms_values);
      setVolumeScore(parsedData.volume_score);
      setDuration(parsedData.duration);
      setVolumeRanges(parsedData.volume_ranges);
      setIsLoading(false);
      return;
    }
  
    try {
      console.log('Fetching volume data...');
      const response = await axios.get(`http://192.168.35.47:5002/recordings/${fileId}/transcript`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log('Response data:', response.data);
  
      if (response.data.volume_analysis) {
        const { volume_analysis } = response.data;
        const { rms_values, volume_score } = volume_analysis; // volume_score 추가
  
        setVolumeScore(volume_score); // volume_score 설정  
        onVolumeScoreUpdate(volume_score); // 콜백 함수 호출      
  
        console.log('RMS values:', rms_values);
  
        const totalDuration = rms_values.length / 100;
        setDuration(totalDuration);
  
        const sampledVolumeData = [];
        const sampledTimeStamps = [];
  
        let low = 0, slightlyLow = 0, medium = 0, slightlyHigh = 0, high = 0;
        let minVolume = Math.min(...rms_values);
        let maxVolume = Math.max(...rms_values);
        let sumVolume = 0;
  
        for (let i = 0; i < rms_values.length; i++) {
          const volume = rms_values[i];
          sampledVolumeData.push(volume);
          if (i % 100 === 0) {
            sampledTimeStamps.push((i / 100).toFixed(1));
          }
          sumVolume += volume;
  
          if (volume < 40) low++;
          else if (volume < 60) slightlyLow++;
          else if (volume < 75) medium++;
          else if (volume < 85) slightlyHigh++;
          else high++;
        }
  
        const avgVolume = sumVolume / rms_values.length;
  
        console.log('Volume data processed successfully');
        console.log('Sampled Volume Data:', sampledVolumeData);
        console.log('Sampled Time Stamps:', sampledTimeStamps);
        console.log('Volume Ranges:', { low, slightlyLow, medium, slightlyHigh, high, minVolume, maxVolume, avgVolume });
  
        setVolumeData(sampledVolumeData);
        setTimeStamps(sampledTimeStamps);
        setVolumeRanges({
          low,
          slightlyLow,
          medium,
          slightlyHigh,
          high,
          minVolume,
          maxVolume,
          avgVolume
        });
  
        const volumeDataToCache = {
          rms_values: sampledVolumeData,
          volume_score,
          duration: totalDuration,
          volume_ranges: {
            low,
            slightlyLow,
            medium,
            slightlyHigh,
            high,
            minVolume,
            maxVolume,
            avgVolume
          }
        };
  
        await AsyncStorage.setItem(`@volume_data_${fileId}`, JSON.stringify(volumeDataToCache));
      } else {
        console.error('No volume_analysis data found');
      }
    } catch (error) {
      console.error('Failed to fetch volume data', error.response ? error.response.data : error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVolumeData();
  }, []);  

  const chartData = {
    labels: timeStamps,
    datasets: [{
      data: volumeData,
      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      strokeWidth: 2,
      withDots: false,
    }]
  };

  const getColorForRange = (value) => {
    if (value < 40) return 'red'; // 낮음
    if (value < 60) return 'orange'; // 약간 낮음
    if (value < 75) return 'yellow'; // 보통
    if (value < 85) return 'lightgreen'; // 약간 높음
    return 'green'; // 높음
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
        <Text style={styles.header}>볼륨 분석 결과</Text>
      </View>
      <View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.infoText}>범위기준?</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>볼륨 사용 범위</Text>
      <View style={styles.legendContainer}>
        <Text style={{ color: getColorForRange(volumeRanges.minVolume) }}>{`최소값(${volumeRanges.minVolume.toFixed(2)}dB)`}</Text>
        <Text style={{ color: getColorForRange(volumeRanges.avgVolume) }}>{`평균값(${volumeRanges.avgVolume.toFixed(2)}dB)`}</Text>
        <Text style={{ color: getColorForRange(volumeRanges.maxVolume) }}>{`최대값(${volumeRanges.maxVolume.toFixed(2)}dB)`}</Text>
      </View>
      <View style={styles.rangeContainer}>
        {volumeRanges.low > 0 && <View style={{ flex: volumeRanges.low / volumeData.length, backgroundColor: 'red' }} />}
        {volumeRanges.slightlyLow > 0 && <View style={{ flex: volumeRanges.slightlyLow / volumeData.length, backgroundColor: 'orange' }} />}
        {volumeRanges.medium > 0 && <View style={{ flex: volumeRanges.medium / volumeData.length, backgroundColor: 'yellow' }} />}
        {volumeRanges.slightlyHigh > 0 && <View style={{ flex: volumeRanges.slightlyHigh / volumeData.length, backgroundColor: 'lightgreen' }} />}
        {volumeRanges.high > 0 && <View style={{ flex: volumeRanges.high / volumeData.length, backgroundColor: 'green' }} />}
      </View>
      <View style={styles.legendContainer}>
        {volumeRanges.low > 0 && <Text style={{ color: 'red' }}>낮음</Text>}
        {volumeRanges.medium > 0 && <Text style={{ color: 'yellow' }}>보통</Text>}
        {volumeRanges.high > 0 && <Text style={{ color: 'green' }}>높음</Text>}
      </View>
      <Text style={styles.subHeader}>시간에 따른 볼륨 변화</Text>
      <ScrollView horizontal>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width * 2}
          height={300}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 2, // 소수점 2자리로 설정
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '0', // 점을 거의 보이지 않게 설정
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
          yLabelsOffset={-2}
          xLabelsOffset={-10}
          fromZero
          yAxisInterval={1}
          yLabelsWidth={60}
          yAxisMin={-10} // y축 최소값 설정
          yAxisMax={10} // y축 최대값 설정
          formatYLabel={(y) => {
            if (y > 0 && y < 1) return `${parseFloat(y).toFixed(2)}dB 낮음`;
            if (y == 0) return `${y}dB`;
            if (y <= 40) return `${y}dB 낮음`;
            if (y <= 60) return `${y}dB 약간 낮음`;
            if (y <= 75) return `${y}dB 보통`;
            if (y <= 85) return `${y}dB 약간 높음`;
            return `${y}dB 높음`;
          }}
          formatXLabel={(x) => `${parseFloat(x).toFixed(1)}s`}
        />
      </ScrollView>

      <View style={styles.timeContainer}>
        <Text>0s</Text>
        <Text>{(duration / 2).toFixed(1)}s</Text>
        <Text>{duration.toFixed(1)}s</Text>
      </View>
      <Text style={styles.subHeader}>볼륨 점수</Text>
      <View style={styles.legendContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flex: volumeScore / 100, height: 20, backgroundColor: 'blue', marginRight: 10 }} />
          <Text style={{ color: 'black' }}>{`볼륨 점수: ${volumeScore.toFixed(1)} %`}</Text>
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
            <Text style={styles.modalText}>❖ 볼륨 범위 기준 ❖</Text>
            <Text style={[styles.modalText, { color: 'red' }]}>· 낮음 (Low): 40dB 이하</Text>
            <Text style={[styles.modalText, { color: 'orange' }]}>· 약간 낮음 (Slightly Low): 40dB ~ 60dB</Text>
            <Text style={[styles.modalText, { color: 'yellow' }]}>· 보통 (Medium): 60dB ~ 75dB</Text>
            <Text style={[styles.modalText, { color: 'lightgreen' }]}>· 약간 높음 (Slightly High): 75dB ~ 85dB</Text>
            <Text style={[styles.modalText, { color: 'green' }]}>· 높음 (High): 85dB 이상</Text>
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
