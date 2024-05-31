import React, { useEffect, useState } from 'react';
const { View, Text, Image, TextInput, TouchableOpacity, Alert } = require('react-native');
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './style';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Error from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [nameVerify, setNameVerify] = useState(false);
    const [email, setEmail] = useState('');
    const [emailVerify, setEmailVerify] = useState(false);
    const [mobile, setMobile] = useState('');
    const [mobileVerify, setMobileVerify] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordVerify, setPasswordVerify] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordsMatch, setPasswordsMatch] = useState(false);

    const handleRegister = async () => {
      if (nameVerify && emailVerify && mobileVerify && passwordVerify && passwordsMatch) {
        try {
          const response = await axios.post('http://192.168.219.175:5001/register', {
            name, email, mobile, password
          });
          console.log(response.data); // 응답을 적절히 처리합니다
          if (response.data.status === "ok") {
            Alert.alert(
              "회원가입 완료!",
              "회원가입이 성공적으로 완료되었습니다.",
              [
                { text: "OK", onPress: () => navigation.navigate('로그인') }
              ],
              { cancelable: false }
            );
          } else {
            Alert.alert("오류", "회원가입에 실패했습니다. 다시 시도해 주세요.");
          }
        } catch (error) {
          if (error.response && error.response.data && error.response.data.message) {
            Alert.alert("오류", error.response.data.message);
          } else {
            Alert.alert("오류", "서버와 통신하는 동안 문제가 발생했습니다.");
          }
        }
      } else {
        Alert.alert("입력 값을 확인해 주세요."); // 기본적인 유효성 검증 피드백
      }
    };
    
    useEffect(() => {
      navigation.setOptions({
        headerBackTitle: '', // 뒤로 가기 버튼의 텍스트를 제거합니다
        headerBackTitleVisible: false, // 뒤로 가기 타이틀이 보이지 않도록 합니다
      });
    }, [navigation]);

    function handleName(e){
      const nameVar = e.nativeEvent.text;
      setName(nameVar);
      setNameVerify(nameVar.length > 1);
    }

    function handleEmail(e){
      const emailVar = e.nativeEvent.text;
      setEmail(emailVar);
      setEmailVerify(/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{1,}$/.test(emailVar));
    }

    function handleMobile(e){
      const mobileVar = e.nativeEvent.text;
      setMobile(mobileVar);
      setMobileVerify(/^\d{11}$/.test(mobileVar)); // 휴대폰 번호 형식 요구사항에 맞게 정규식을 조정합니다
    }

    function handlePassword(e){
      const passwordVar = e.nativeEvent.text;
      setPassword(passwordVar);
      setPasswordVerify(passwordVar.length >= 6);
      setPasswordsMatch(passwordVar === confirmPassword); // 비밀번호가 일치하는지 확인합니다
    }

    function handleConfirmPassword(e){
      const confirmPasswordVar = e.nativeEvent.text;
      setConfirmPassword(confirmPasswordVar);
      setPasswordsMatch(password === confirmPasswordVar); // 비밀번호가 일치하는지 확인합니다
    }

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      resetScrollToCoords={{ x: 0, y: 0 }}
      contentContainerStyle={{ flexGrow: 1 }}
      scrollEnabled={true}
      extraScrollHeight={20} // 스크롤 추가 높이 조정
      enableOnAndroid={true}
      keyboardShouldPersistTaps='handled'
    >
    <View>
      
      <View style={styles.loginContainer}>
      <View style={styles.logoContainer}>
        <Image
          style={styles.logo}
          source={require('../../../assets/ch.webp')}
        />
      </View>
        <Text style={styles.text_header}>환영합니다</Text>

        {/* 이름 입력 */}
        <View style={styles.action}>
          <FontAwesome name="user" color="#420475" style={styles.smallIcon}/>
          <TextInput placeholder="이름" 
          style={styles.textInput}
          onChange={handleName}
          />
          {name.length < 1 ? null : nameVerify ? (
            <Feather name ="check-circle" color = "green" size={20}/>
          ) : (
            <Error name = "error" color = "red" size={20} />
          )}
        </View>
        {name.length < 1 ? null : nameVerify ? null : (
          <Text
            style={{
              marginLeft: 20,
              color: 'red',
            }}>
            이름은 1자 이상이어야 합니다.
            </Text>
        )}

        {/* 이메일 입력 */}
        <View style={styles.action}>
          <Fontisto
            name = "email"
            color="#420475"
            size={24}
            style={{marginLeft: 0, paddingRight: 5}}
            />
          <TextInput 
          placeholder="이메일" 
          style={styles.textInput} 
          onChange={handleEmail}
          />
          {email.length < 1 ? null : emailVerify ? (
            <Feather name ="check-circle" color = "green" size={20}/>
          ) : (
            <Error name = "error" color = "red" size={20} />
          )}
        </View>
        {email.length < 1 ? null : emailVerify ? null : (
          <Text
            style={{
              marginLeft: 20,
              color: 'red',
            }}>
              올바른 이메일 주소를 입력하세요.
            </Text>
        )}

        {/* 휴대폰 번호 입력 */}
        <View style={styles.action}>
          <FontAwesome name="phone" color="#420475" style={styles.smallIcon}/>
          <TextInput placeholder="번호" style={styles.textInput} onChange={handleMobile}/>
          {mobile.length < 1 ? null : mobileVerify ? (
            <Feather name ="check-circle" color = "green" size={20}/>
          ) : (
            <Error name = "error" color = "red" size={20} />
          )}
        </View>
        {mobile.length < 1 ? null : mobileVerify ? null : (
          <Text
            style={{
              marginLeft: 20,
              color: 'red',
            }}>
              11자리 숫자를 입력하세요.
            </Text>
        )}

        {/* 비밀번호 입력 */}
        <View style={styles.action}>
          <FontAwesome name="lock" color="#420475" style={styles.smallIcon}/>
          <TextInput 
            placeholder="비밀번호" 
            style={styles.textInput} 
            onChange={handlePassword}
            secureTextEntry={true}  // 비밀번호 가리기 활성화
          />
          {password.length < 1 ? null : passwordVerify ? (
            <Feather name="check-circle" color="green" size={20}/>
          ) : (
            <Error name="error" color="red" size={20} />
          )}
        </View>
        {password.length < 1 ? null : passwordVerify ? null : (
          <Text
            style={{
              marginLeft: 20,
              color: 'red',
            }}>
              비밀번호는 6자 이상이어야 합니다.
          </Text>
        )}

        {/* 비밀번호 확인 입력 */}
        <View style={styles.action}>
          <FontAwesome name="lock" color="#420475" style={styles.smallIcon}/>
          <TextInput 
            placeholder="비밀번호 확인" 
            style={styles.textInput} 
            onChange={handleConfirmPassword}
            secureTextEntry={true}  // 비밀번호 가리기 활성화
          />
          {confirmPassword.length < 1 ? null : passwordsMatch ? (
            <Feather name="check-circle" color="green" size={20}/>
          ) : (
            <Error name="error" color="red" size={20} />
          )}
        </View>
        {confirmPassword.length < 1 ? null : passwordsMatch ? null : (
          <Text
            style={{
              marginLeft: 20,
              color: 'red',
            }}>
              비밀번호가 일치하지 않습니다.
          </Text>
        )}
        <TouchableOpacity style = {styles.inBut} onPress={handleRegister}>
            <View>
              <Text style={styles.textSign}>가입하기</Text>
            </View>
          </TouchableOpacity>
      </View>      
    </View>
    </KeyboardAwareScrollView>
  );
}

export default RegisterScreen;
