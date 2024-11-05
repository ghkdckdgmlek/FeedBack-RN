import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from "@react-navigation/native";
import { Card, Title, Paragraph } from "react-native-paper";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";

export default function RecordingsScreen({ navigation }) {
  const [recordedFiles, setRecordedFiles] = useState([]);

  const fetchRecordings = async () => {
    const token = await AsyncStorage.getItem("@user_token");
    if (!token) {
      console.error("No token found");
      return;
    }
    console.log("Token for fetching recordings:", token);
    try {
      const response = await axios.get(
        "${Your_IP}:5001/recordings",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Recordings fetched successfully:", response.data);
      setRecordedFiles(response.data.recordings);
    } catch (error) {
      console.error(
        "Failed to fetch recordings",
        error.response ? error.response.data : error.message
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecordings();
    }, [])
  );

  const handleDelete = (id) => {
    Alert.alert("녹음 삭제", "이 녹음을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          const token = await AsyncStorage.getItem("@user_token");
          if (!token) {
            console.error("No token found");
            return;
          }
          console.log("Token for deleting recording:", token);
          try {
            await axios.delete(`${Your_IP}:5001/recordings/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            // 녹음 목록 업데이트
            fetchRecordings();
          } catch (error) {
            console.error(
              "Failed to delete recording",
              error.response ? error.response.data : error.message
            );
          }
        },
      },
    ]);
  };

  const handlePress = (fileId, transcript) => {
    navigation.navigate("분석", { fileId, existingTranscript: transcript });
  };

  const getMostRecentRecording = () => {
    if (recordedFiles.length === 0) return null;
    return recordedFiles.reduce((latest, current) => {
      return new Date(latest.createdAt) > new Date(current.createdAt)
        ? latest
        : current;
    });
  };

  const renderRightActions = (progress, dragX, itemId) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(itemId)}
      >
        <Icon name="trash" size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  const mostRecentRecording = getMostRecentRecording();

  return (
    <LinearGradient colors={["#FFDEE9", "#B5FFFC"]} style={styles.container}>
      <Text style={styles.header}>My Recordings</Text>
      <FlatList
        data={recordedFiles}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={(progress, dragX) =>
              renderRightActions(progress, dragX, item._id)
            }
          >
            <Card
              style={[
                styles.card,
                item._id === mostRecentRecording?._id && styles.recentCard,
              ]}
            >
              <TouchableOpacity
                style={styles.cardContent}
                onPress={() => handlePress(item.fileId, item.transcript)}
              >
                <Card.Content>
                  <Title numberOfLines={1} ellipsizeMode="tail">
                    {item.fileName}
                  </Title>
                  <Paragraph>
                    {new Date(item.createdAt).toLocaleString()}
                  </Paragraph>
                </Card.Content>
              </TouchableOpacity>
            </Card>
          </Swipeable>
        )}
        contentContainerStyle={styles.listContent}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    color: "#FFA500", // 오렌지 색상으로 설정
  },
  card: {
    marginVertical: 5,
    borderRadius: 10,
    elevation: 3,
    width: 350, // 카드 너비를 고정하여 중앙 정렬 효과
  },
  recentCard: {
    backgroundColor: "#d4edda", // Light green background for the most recent item
  },
  cardContent: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 10,
    marginVertical: 5,
  },
});
