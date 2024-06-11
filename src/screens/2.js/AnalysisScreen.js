import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card } from 'react-native-paper';
import { LinearGradient } from "expo-linear-gradient";

export default function AnalysisScreen({ route, navigation }) {
  const { fileId, existingTranscript } = route.params;
  const [transcript, setTranscript] = useState(existingTranscript || "");
  const [loading, setLoading] = useState(!existingTranscript);
  const [showTranscript, setShowTranscript] = useState(false);
  const [hateSpeechResults, setHateSpeechResults] = useState([]);
  const [hateSpeechRatio, setHateSpeechRatio] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const [wordRate, setWordRate] = useState(null);
  const [speedScore, setSpeedScore] = useState("");
  const [silenceDurations, setSilenceDurations] = useState([]);
  const [topKeywords, setTopKeywords] = useState([]);
  const [regexWordCounts, setRegexWordCounts] = useState({});
  const [normalWordCounts, setNormalWordCounts] = useState({});
  const [loadingMessage, setLoadingMessage] = useState(new Animated.Value(0));
  const [contentOpacity, setContentOpacity] = useState(new Animated.Value(0));

  const fetchTranscript = async () => {
    const token = await AsyncStorage.getItem("@user_token");
    if (!token) {
      console.error("No token found");
      return;
    }
    console.log("Token for fetching transcript:", token);
    try {
      const response = await axios.get(
        `http://192.168.219.100:5002/recordings/${fileId}/transcript`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 0  // 시간 제한을 무제한으로 설정
        }
      );
      console.log("Transcript fetched successfully:", response.data);
      setTranscript(response.data.transcript || "");
      setHateSpeechResults(response.data.hate_speech_results || []);
      setHateSpeechRatio(response.data.hate_speech_ratio || 0);
      setWordRate(response.data.word_rate || null);
      setSpeedScore(response.data.speed_score || "");
      setSilenceDurations(response.data.silence_durations || []);
      setTopKeywords(response.data.keywords_nouns || []);
      setRegexWordCounts(response.data.regex_word_counts || {});
      setNormalWordCounts(response.data.normal_word_counts || {});
      await AsyncStorage.setItem(
        `@transcript_${fileId}`,
        JSON.stringify(response.data)
      );
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error(
        "Failed to fetch transcript",
        error.response ? error.response.data : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTranscript = async () => {
      const storedData = await AsyncStorage.getItem(`@transcript_${fileId}`);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setTranscript(parsedData.transcript || "");
        setHateSpeechResults(parsedData.hate_speech_results || []);
        setHateSpeechRatio(parsedData.hate_speech_ratio || 0);
        setWordRate(parsedData.word_rate || null);
        setSpeedScore(parsedData.speed_score || "");
        setSilenceDurations(parsedData.silence_durations || []);
        setTopKeywords(parsedData.keywords_nouns || []);
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
      ])
    ).start();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: "",
      headerBackTitleVisible: false,
    });
  }, [navigation]);

  const renderHateSpeechResults = () => {
    if (!hateSpeechResults || hateSpeechResults.length === 0) {
      return <Text style={styles.noResults}>혐오 표현이 없습니다.</Text>;
    }

    const hateSpeechTokens = new Set();
    hateSpeechResults.forEach((result) => {
      result.model2_results.forEach((item) => {
        hateSpeechTokens.add(item[0]);
      });
    });

    return Array.from(hateSpeechTokens).map((token, index) => (
      <View key={index} style={styles.hateSpeechTokenContainer}>
        <Text style={styles.hateSpeechToken}>{token}</Text>
        <Text style={styles.suggestionText}>다른 표현으로 바꿔보세요.</Text>
      </View>
    ));
  };

  const highlightText = (text, highlights, style) => {
    const regex = new RegExp(`\\b(${highlights.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      highlights.includes(part.toLowerCase()) ? (
        <Text key={index} style={style}>{part}</Text>
      ) : (
        <Text key={index} style={styles.boldText}>{part}</Text>
      )
    );
  };

  const highlightKeywordsInTranscript = (transcript, keywords, silenceDurations) => {
    if (!transcript) {
      return null;
    }

    const silenceMarkers = Array.isArray(silenceDurations) ? silenceDurations.reduce((acc, [start, end], index) => {
      acc[start] = { type: 'start', index };
      acc[end] = { type: 'end', index };
      return acc;
    }, {}) : {};

    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    const regexWords = Object.keys(regexWordCounts);
    const normalWords = Object.keys(normalWordCounts);

    let highlightedTranscript = [];
    let currentIndex = 0;
    let silenceOpen = false;

    for (let i = 0; i < transcript.length; i++) {
      const slice = transcript.slice(currentIndex, i + 1);

      if (silenceMarkers[i]) {
        const marker = silenceMarkers[i];
        if (marker.type === 'start' && !silenceOpen) {
          highlightedTranscript.push(<Text key={`text-${currentIndex}`} style={styles.boldText}>{slice.slice(0, -1)}</Text>);
          silenceOpen = true;
          currentIndex = i;
        } else if (marker.type === 'end' && silenceOpen) {
          highlightedTranscript.push(
            <Text key={`silence-${currentIndex}`} style={styles.silenceHighlight}>
              {slice}
            </Text>
          );
          silenceOpen = false;
          currentIndex = i + 1;
        }
      }

      const keywordMatch = slice.match(keywordRegex);
      const regexMatch = slice.match(new RegExp(`\\b(${regexWords.join('|')})\\b`, 'gi'));
      const normalMatch = slice.match(new RegExp(`\\b(${normalWords.join('|')})\\b`, 'gi'));

      if (keywordMatch || regexMatch || normalMatch) {
        highlightedTranscript.push(<Text key={`text-${currentIndex}`} style={styles.boldText}>{slice.split(keywordMatch || regexMatch || normalMatch)[0]}</Text>);
        const highlightStyle = keywordMatch
          ? styles.keywordHighlight
          : regexMatch
          ? styles.unnecessaryWordHighlight
          : styles.repeatedWordHighlight;

        highlightedTranscript.push(
          <Text key={`highlight-${i}`} style={highlightStyle}>
            {keywordMatch ? keywordMatch[0] : regexMatch ? regexMatch[0] : normalMatch[0]}
          </Text>
        );
        currentIndex = i + 1;
      }
    }

    if (currentIndex < transcript.length) {
      highlightedTranscript.push(<Text key={`text-${currentIndex}`} style={styles.boldText}>{transcript.slice(currentIndex)}</Text>);
    }

    return highlightedTranscript;
  };

  const renderSilenceDurations = () => {
    if (!silenceDurations.length) {
      return <Text style={styles.noResults}>긴 침묵 구간이 없습니다.</Text>;
    }

    return silenceDurations.map((duration, index) => (
      <Text key={index} style={styles.silenceItem}>
        <Text style={styles.silenceHighlight}>{duration[0]} - {duration[1]}: {duration[2].toFixed(2)}초</Text>
      </Text>
    ));
  };

  const renderWordCounts = (wordCounts, highlightStyle) => {
    if (!wordCounts || !Object.keys(wordCounts).length) {
      return <Text style={styles.noResults}>단어 빈도 정보가 없습니다.</Text>;
    }

    return Object.entries(wordCounts).map(([word, count], index) => (
      <Text key={index} style={styles.wordCountItem}>
        <Text style={highlightStyle}>{word}</Text>: {count}회
      </Text>
    ));
  };

  const getSpeedFeedback = (speedScore) => {
    switch (speedScore) {
      case "Slow":
        return "말하기 속도가 느립니다. 조금 더 빠르게 말해보세요.";
      case "Fast":
        return "말하기 속도가 빠릅니다. 조금 더 천천히 말해보세요.";
      case "Good":
        return "말하기 속도가 적절합니다.";
      default:
        return "";
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient
        colors={['#FFDEE9', '#B5FFFC']}
        style={styles.container}
      >


      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Animated.Text
            style={[
              styles.loadingMessage,
              { opacity: loadingMessage },
            ]}
          >
            분석 중입니다. 잠시만 기다려주세요...
          </Animated.Text>
        </View>
      ) : (
        <Animated.View style={{ opacity: contentOpacity }}>
          <TouchableOpacity
            style={styles.transcriptContainer}
            onPress={() => setShowTranscript(!showTranscript)}
          >
            <Text style={styles.sectionTitle}>텍스트</Text>
            {showTranscript && (
              <View style={styles.transcriptContent}>
                <Text style={styles.transcriptText}>
                  {highlightKeywordsInTranscript(transcript, topKeywords, silenceDurations)}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.sectionContainer}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Card.Title title="혐오 표현" />
              {showDetails && (
                <Card.Content style={styles.hateSpeechContainer}>
                  <View style={styles.hateSpeechTokensContainer}>
                    {renderHateSpeechResults()}
                  </View>
                  <Text style={styles.hateSpeechFeedback}>
                  </Text>
                </Card.Content>
              )}
            </TouchableOpacity>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="말의 속도" />
            <Card.Content>
              <Text style={styles.sectionContent}>
                {wordRate !== null
                  ? `평균 말하기 속도: ${wordRate.toFixed(2)} 단어/초`
                  : "말의 속도 정보를 불러올 수 없습니다."}
              </Text>
              <Text style={styles.speedScore}>{speedScore}</Text>
              <Text style={styles.speedFeedback}>{getSpeedFeedback(speedScore)}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="긴 침묵 구간" />
            <Card.Content>
              {renderSilenceDurations()}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="주요 키워드" />
            <Card.Content>
              {topKeywords.length > 0 ? (
                topKeywords.map((keyword, index) => (
                  <Text key={index} style={styles.keywordItem}>
                    {highlightText(keyword, topKeywords, styles.keywordHighlight)}
                  </Text>
                ))
              ) : (
                <Text style={styles.noResults}>주요 키워드가 없습니다.</Text>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="불필요한 단어 빈도" />
            <Card.Content>
              {renderWordCounts(regexWordCounts, styles.unnecessaryWordHighlight)}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="반복된 빈도" />
            <Card.Content>
              {renderWordCounts(normalWordCounts, styles.repeatedWordHighlight)}
            </Card.Content>
          </Card>
        </Animated.View>
      )}
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMessage: {
    marginTop: 10,
    fontSize: 16,
    color: "#4caf50",
    fontWeight: "bold",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#3f51b5",
  },
  sectionContent: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
  },
  transcriptContainer: {
    marginBottom: 20,
  },
  transcriptContent: {
    marginTop: 10,
    backgroundColor: "#f1f1f1",
    padding: 15,
    borderRadius: 10,
  },
  transcriptText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    fontWeight: "bold",
  },
  hateSpeechContainer: {
    marginBottom: 20,
  },
  hateSpeechTokensContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  hateSpeechTokenContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    padding: 5,
    backgroundColor: "#ffebee",
    borderRadius: 5,
  },
  hateSpeechToken: {
    fontSize: 14,
    color: "#c62828",
    marginRight: 5,
    fontWeight: "bold",
  },
  suggestionText: {
    fontSize: 12,
    color: "#c62828",
    fontWeight: "bold",
  },
  hateSpeechFeedback: {
    marginTop: 10,
    fontSize: 16,
    color: "#c62828",
    fontWeight: "bold",
  },
  keywordHighlight: {
    backgroundColor: "#ffeb3b",
    fontWeight: "bold",
  },
  silenceHighlight: {
    backgroundColor: "#ffc0cb",
    fontWeight: "bold",
    color: "#ff1493",
  },
  unnecessaryWordHighlight: {
    backgroundColor: "#bbdefb",
    fontWeight: "bold",
  },
  repeatedWordHighlight: {
    backgroundColor: "#c8e6c9",
    fontWeight: "bold",
  },
  speedScore: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#ff5722",
  },
  speedFeedback: {
    fontSize: 16,
    color: "#ff5722",
    fontWeight: "bold",
  },
  silenceItem: {
    fontSize: 16,
    marginBottom: 5,
    color: "#757575",
    fontWeight: "bold",
  },
  keywordItem: {
    fontSize: 16,
    marginBottom: 5,
    color: "#3f51b5",
    fontWeight: "bold",
  },
  wordCountItem: {
    fontSize: 16,
    marginBottom: 5,
    color: "#757575",
    fontWeight: "bold",
  },
  noResults: {
    fontSize: 16,
    color: "#bdbdbd",
    fontWeight: "bold",
  },
  card: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 3,
  },
  boldText: {
    fontWeight: "bold",
  },
});
