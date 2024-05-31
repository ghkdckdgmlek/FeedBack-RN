import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmptyScreen = () => {
  return (
    <View style={styles.container}>
      <Text>빈 화면</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EmptyScreen;
