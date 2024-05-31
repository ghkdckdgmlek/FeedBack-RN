import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';

export default function RecordingsScreen({ navigation }) {
  const [recordedFiles, setRecordedFiles] = useState([]);

  const fetchRecordings = async () => {
    const token = await AsyncStorage.getItem('@user_token');
    if (!token) {
      console.error('No token found');
      return;
    }
    console.log('Token for fetching recordings:', token);
    try {
      const response = await axios.get('http://192.168.219.175:5001/recordings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Recordings fetched successfully:', response.data);
      setRecordedFiles(response.data.recordings);
    } catch (error) {
      console.error('Failed to fetch recordings', error.response ? error.response.data : error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecordings();
    }, [])
  );

  const handleDelete = (id) => {
    Alert.alert(
      "녹음 삭제",
      "이 녹음을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem('@user_token');
            if (!token) {
              console.error('No token found');
              return;
            }
            console.log('Token for deleting recording:', token);
            try {
              await axios.delete(`http://192.168.219.175:5001/recordings/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              // 녹음 목록 업데이트
              fetchRecordings();
            } catch (error) {
              console.error('Failed to delete recording', error.response ? error.response.data : error.message);
            }
          }
        }
      ]
    );
  };

  const handlePress = (fileId, transcript) => {
    navigation.navigate('분석', { fileId, existingTranscript: transcript });
  };

  const getMostRecentRecording = () => {
    if (recordedFiles.length === 0) return null;
    return recordedFiles.reduce((latest, current) => {
      return new Date(latest.createdAt) > new Date(current.createdAt) ? latest : current;
    });
  };

  const mostRecentRecording = getMostRecentRecording();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Recordings</Text>
      <FlatList
        data={recordedFiles}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.itemContainer,
              item._id === mostRecentRecording?._id && styles.recentItemContainer
            ]}
          >
            <TouchableOpacity
              style={styles.itemContent}
              onPress={() => handlePress(item.fileId, item.transcript)}
            >
              <Icon name="file-audio-o" size={24} color="#4b7bec" style={styles.icon} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle} numberOfLines={1} ellipsizeMode='tail'>{item.fileName}</Text>
                <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)}>
              <Icon name="trash" size={24} color="#e74c3c" style={styles.icon} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 3,
  },
  recentItemContainer: {
    backgroundColor: '#d4edda', // Light green background for the most recent item
  },
  icon: {
    marginHorizontal: 10,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '500',
    flexShrink: 1, // 제목이 잘리지 않도록 설정
  },
  itemDate: {
    fontSize: 14,
    color: '#6c757d',
  },
});
