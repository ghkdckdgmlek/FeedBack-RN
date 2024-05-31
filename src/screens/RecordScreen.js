import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Text, Modal } from 'react-native';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

export default function RecordScreen() {
    const [recording, setRecording] = useState(null);
    const [filePath, setFilePath] = useState('');
    const [title, setTitle] = useState('');
    const [showModal, setShowModal] = useState(false);
    const navigation = useNavigation();

    const startRecording = async () => {
        if (recording) {
            await stopRecording();
        } else {
            try {
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                    alert('Sorry, we need audio recording permissions to make this work!');
                    return;
                }

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const recording = new Audio.Recording();
                await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
                await recording.startAsync();
                setRecording(recording);
            } catch (err) {
                console.error('Failed to start recording', err);
            }
        }
    };

    const stopRecording = async () => {
        console.log('Stopping recording..');
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setFilePath(uri);
            setRecording(null);
            setShowModal(true);
        } catch (err) {
            console.error('Failed to stop recording', err);
        }
    };

    const handleSaveTitle = async () => {
        const token = await AsyncStorage.getItem('@user_token');
        if (!token) {
            console.error('No token found');
            return;
        }
        console.log('Token:', token);

        const formData = new FormData();
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        console.log('File Info:', fileInfo);

        formData.append('file', {
            uri: filePath,
            type: 'audio/x-wav',
            name: `${title || `Recording_${Date.now()}`}.wav`
        });
        formData.append('fileName', title || `Recording_${Date.now()}`);

        console.log('Form Data:', formData);

        try {
            const response = await axios.post(
                'http://192.168.219.175:5001/recordings',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            console.log('Response:', response.data);
        } catch (error) {
            console.error('Failed to save recording', error.response ? error.response.data : error.message);
        }

        setTitle('');
        setFilePath('');
        setShowModal(false);
        navigation.navigate('보관함', { refresh: true });
    };

    const handleCancel = () => {
        setTitle('');
        setFilePath('');
        setShowModal(false);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                <Icon name={recording ? 'stop' : 'microphone'} size={30} color="#FFF" />
            </TouchableOpacity>
            <Modal
                animationType="slide"
                transparent={true}
                visible={showModal}
                onRequestClose={() => setShowModal(!showModal)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Save Recording</Text>
                        <TextInput
                            style={styles.titleInput}
                            onChangeText={setTitle}
                            value={title}
                            placeholder="Enter recording title"
                        />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTitle}>
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ecf0f1',
    },
    recordButton: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FF0000',
        borderRadius: 35,
        marginTop: 20,
    },
    titleInput: {
        width: '100%',
        height: 40,
        margin: 12,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Make the background semi-transparent
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
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
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
