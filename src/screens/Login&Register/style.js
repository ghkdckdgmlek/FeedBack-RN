import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView2: {
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
  emailIcon: {
    marginLeft: 0,
    paddingRight: 5,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: width * 0.5,
    width: width * 0.5,
    marginBottom: 0,
  },
  text_footer: {
    color: '#05375a',
    fontSize: 18,
  },
  action: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 8,
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
    marginLeft: 10,
  },
  loginContainer: {
    width: '100%',
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
  errorText: {
    marginLeft: 20,
    color: 'red',
  },
});

export default styles;
