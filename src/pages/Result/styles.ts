import { StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Dimensions.get('window').height,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
    position: 'relative',
  },
  images: {
    width: 224,
    height: 224,
    borderWidth: 2,
    borderColor: 'black',
    resizeMode: 'stretch',
    marginBottom: 20,
  },
  saveButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0091ea',
    margin: 10,
    borderRadius: 30,
    height: 55,
    width: 150,
    marginTop: 30,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
