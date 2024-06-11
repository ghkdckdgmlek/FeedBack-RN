import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  Modal,
  Image,
  FlatList,
  ActivityIndicator, // Import ActivityIndicator
} from "react-native";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";

import MicrophoneIcon from "../../../assets/icons8-microphone-64.png";
import Pause from "../../../assets/icons8-pause-64.png";
import Play from "../../../assets/icons8-play-64.png";
import Stop from "../../../assets/icons8-stop-64.png";

export default function RecordScreen() {
  const [recording, setRecording] = useState(null);
  const [paused, setPaused] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [title, setTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [waveform, setWaveform] = useState(new Array(50).fill(0));
  const [sound, setSound] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state
  const navigation = useNavigation();
  const recordingRef = useRef(null);

  useEffect(() => {
    let interval;
    if (recording && !paused) {
      interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (!recording || paused) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recording, paused]);

  useEffect(() => {
    let interval;
    if (recording && !paused) {
      interval = setInterval(() => {
        updateVolumeMeter();
      }, 100);
    } else if (!recording || paused) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recording, paused]);

  const updateVolumeMeter = async () => {
    if (recording) {
      const status = await recording.getStatusAsync();
      if (status.metering !== undefined) {
        const volume = status.metering;
        const scaledVolume = Math.max(0, Math.min(1, (volume + 160) / 160));
        setWaveform((prev) => {
          const newWaveform = [...prev.slice(1), scaledVolume];
          return newWaveform;
        });
      }
    }
  };

  const startRecording = async () => {
    if (recordingRef.current) {
      await stopRecording();
    }
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need audio recording permissions to make this work!");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      recordingRef.current = newRecording;

      await newRecording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await newRecording.startAsync();
      setRecording(newRecording);
      setElapsedTime(0);
      setWaveform(new Array(50).fill(0));
      setAnimate(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const pauseRecording = async () => {
    try {
      await recording.pauseAsync();
      setPaused(true);
    } catch (err) {
      console.error("Failed to pause recording", err);
    }
  };

  const resumeRecording = async () => {
    try {
      await recording.startAsync();
      setPaused(false);
    } catch (err) {
      console.error("Failed to resume recording", err);
    }
  };

  const stopRecording = async () => {
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setFilePath(uri);
      setRecording(null);
      setPaused(false);
      setShowModal(true);
      setElapsedTime(0);
      recordingRef.current = null;
      setAnimate(false);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const handleSaveTitle = async () => {
    setLoading(true); // Start loading
    const token = await AsyncStorage.getItem("@user_token");
    if (!token) {
      console.error("No token found");
      setLoading(false); // Stop loading
      return;
    }

    const formData = new FormData();
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    formData.append("file", {
      uri: filePath,
      type: "audio/x-wav",
      name: `${title || `Recording_${Date.now()}`}.wav`,
    });
    formData.append("fileName", title || `Recording_${Date.now()}`);

    try {
      const response = await axios.post(
        "http://192.168.219.100:5001/recordings",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Response:", response.data);
    } catch (error) {
      console.error(
        "Failed to save recording",
        error.response ? error.response.data : error.message
      );
    }

    setTitle("");
    setFilePath("");
    setShowModal(false);
    setWaveform(new Array(50).fill(0));
    navigation.navigate("보관함", { refresh: true });
    setLoading(false); // Stop loading
  };

  const handleCancel = () => {
    setTitle("");
    setFilePath("");
    setShowModal(false);
    setWaveform(new Array(50).fill(0));
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handlePlay = async () => {
    if (filePath) {
      const { sound: playbackSound } = await Audio.Sound.createAsync({
        uri: filePath,
      });
      setSound(playbackSound);
      await playbackSound.playAsync();
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const renderItem = ({ item }) => {
    const graphColor = item > 0.05 ? 'red' : 'rgba(0, 0, 0, 0.1)';
    return (
      <View
        style={{
          height: 1600,
          width: 6,
          backgroundColor: graphColor,
          marginHorizontal: 1,
          transform: [{ scaleY: item }],
        }}
      />
    );
  };

  return (
    <LinearGradient colors={["#FFDEE9", "#B5FFFC"]} style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
      </View>
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={startRecording}>
          <Image source={MicrophoneIcon} style={styles.icon} />
        </TouchableOpacity>
        {recording && !paused && (
          <TouchableOpacity onPress={pauseRecording}>
            <Image source={Pause} style={styles.icon} />
          </TouchableOpacity>
        )}
        {recording && paused && (
          <TouchableOpacity onPress={resumeRecording}>
            <Image source={Play} style={styles.icon} />
          </TouchableOpacity>
        )}
        {filePath && !recording && (
          <TouchableOpacity onPress={handlePlay}>
            <Image source={Play} style={styles.icon} />
          </TouchableOpacity>
        )}
        {recording && (
          <TouchableOpacity onPress={stopRecording}>
            <Image source={Stop} style={styles.icon} />
          </TouchableOpacity>
        )}
      </View>
      {animate && (
        <View style={styles.waveformContainer}>
          <FlatList
            horizontal
            data={waveform}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            contentContainerStyle={{ alignItems: "center" }}
          />
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(!showModal)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>오디오 저장</Text>
            <TextInput
              style={styles.titleInput}
              onChangeText={setTitle}
              value={title}
              placeholder="파일 제목을 입력하세요"
            />
            {loading ? ( // Show loading indicator if loading state is true
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveTitle}
                >
                  <Text style={styles.buttonText}>저장</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.buttonText}>취소</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timerContainer: {
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  controlsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  icon: {
    width: 64,
    height: 64,
    marginHorizontal: 10,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 300,
    overflow: "hidden",
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: '80%',
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  titleInput: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 10,
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
