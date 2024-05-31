import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: 'white',
    flex: 1,
  },
  textSign: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  smallIcon: {
    marginRight: 10,
    fontSize: 24,
    color: '#420475',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: width * 1,
    width: width * 1,
    marginBottom: 0,
  },
  text_footer: {
    color: '#05375a',
    fontSize: 18,
  },
  action: {
    flexDirection: 'row',
    paddingTop: 8, // 패딩 조정
    paddingBottom: 8, // 패딩 조정
    marginTop: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#420475',
    borderRadius: 50,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  textInput: {
    flex: 1,
    color: '#05375a',
    marginLeft: 10, // 텍스트 입력 필드와 아이콘 사이 간격 추가
  },
  loginContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 50,
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  text_header: {
    color: '#420475',
    fontWeight: 'bold',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    alignItems: 'center',
  },
  inBut: {
    width: '70%',
    backgroundColor: '#420475',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 50,
    marginTop: 20,
  },
  bottomButton: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  smallIcon2: {
    fontSize: 40,
    color: '#420475',
  },
  bottomText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    backgroundColor: 'white',
  },
});

export default styles;
