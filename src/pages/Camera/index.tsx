import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import * as tf from '@tensorflow/tfjs';
import * as automl from '@tensorflow/tfjs-automl';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { Camera } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import modelWeight from '../../../assets/model/group1-shard.bin';
import modelJson from '../../../assets/model/model.json';
import { styles } from './styles';

const CameraBackType = Camera.Constants.Type['back'];
const CameraFrontType = Camera.Constants.Type['front'];

export default function CameraPage() {
  const navigation = useNavigation();
  const camRef = useRef(null);

  const [type, setType] = useState(CameraBackType);
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [model, setModel] = useState<automl.ObjectDetectionModel>();

  const isFocused = useIsFocused();
  const [showCamera, setShowCamera] = useState(true);

  /**
   * Função para capturar uma fotografia a partir da câmera
   */
  const handleTakePicture = async () => {
    if (camRef) {
      const data = await camRef.current.takePictureAsync();
      setCapturedPhoto(data.uri);
      // setOpenModal(true);
      console.log(data);

      const imageResized = await manipulateAsync(
        data?.uri,
        [{ resize: { width: 224, height: 224 } }],
        { compress: 1, format: SaveFormat.JPEG },
      );
      console.log('[ IMAGE RESIZED ]:', imageResized);
      console.log('[ CAPTURED PHOTO ]:', capturedPhoto);

      camRef.current.pausePreview();
      navigation.navigate('Resultado', {
        imageResized,
        model,
        capturedPhoto: data.uri,
      });
    }
  };

  /**
   * Função para alternar entre camera traseira e frontal
   */
  const handleFlipCamera = () => {
    type === CameraBackType
      ? setType(CameraFrontType)
      : setType(CameraBackType);
  };

  /**
   * Função para escolher uma imagem a partir da galeria
   */
  const handlePickImage = async () => {
    await setShowCamera(false);
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // allowsEditing: true,
      // aspect: [1, 1],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled && !!result?.assets) {
      console.log('result?.assets[0].uri', result?.assets[0].uri);
      const imageObj = await manipulateAsync(
        result?.assets[0].uri,
        [{ resize: { width: 224, height: 224 } }],
        { compress: 1, format: SaveFormat.JPEG },
      );
      console.log('imageObj', imageObj);
      // setShowCamera(true);
      navigation.navigate('Resultado', {
        imageResized: imageObj,
        model,
      });
    } else {
      await setShowCamera(true);
    }
  };

  /**
   * Efeito que é disparado logo que o App incia para solicitar permissões
   */
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === 'granted') setHasPermission(true);

      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
      }
    })();
  }, []);

  /**
   * Efeito que é disparado logo que o app inicia ou que a variável model mudar
   * para carregar o modelo do AutoML
   */
  useEffect(() => {
    (async () => {
      if (!model) {
        console.log('[+] Application started');
        // Wait for tensorflow module to be ready
        await tf.ready();

        console.log('[+] Loading Mucosa detection model');
        const maskDetector = await tf
          .loadGraphModel(
            bundleResourceIO(modelJson as tf.io.ModelJSON, modelWeight),
          )
          .catch((err) => console.log(err));

        if (maskDetector) {
          const mod = new automl.ObjectDetectionModel(maskDetector, [
            'background',
            'Mucosa',
            // 'saudavel',
            // 'doente',
          ]);
          await setModel(mod);

          await console.log('[+] Model Loaded');
        }
      }
    })();
  }, [model]);

  /**
   * Efeito que é disparado logo que o App incia ou sempre que as variáveis
   * isFocused e showCamera mudarem para definir o estado que controla se a
   * câmera deve ser mostrada ou não
   */
  useEffect(() => {
    (async () => {
      if (isFocused && !showCamera) await setShowCamera(true);
    })();
  }, [isFocused, showCamera]);

  if (!hasPermission) return <Text> Acesso negado! </Text>;

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && (
        <>
          {showCamera && (
            <Camera style={{ flex: 1 }} type={type} ref={camRef} ratio="4:3" />
          )}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={handleFlipCamera}>
              <MaterialIcons name="flip-camera-ios" size={35} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ ...styles.button, height: 70, width: 70 }}
              onPress={handleTakePicture}
            >
              <MaterialIcons name="photo-camera" size={40} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handlePickImage}>
              <MaterialIcons name="image" size={35} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
