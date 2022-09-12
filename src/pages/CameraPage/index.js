import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { Camera } from 'expo-camera';

import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

import * as tf from '@tensorflow/tfjs';
import { fetch, bundleResourceIO } from '@tensorflow/tfjs-react-native';
import * as automl from '@tensorflow/tfjs-automl';

import Svg, { Rect } from 'react-native-svg';
import * as jpeg from 'jpeg-js';

import ImageColors from 'react-native-image-colors';

import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';

import { useIsFocused } from '@react-navigation/native';

import { styles } from './styles';

import * as MediaLibrary from 'expo-media-library';

export default function CameraPage({ navigation }) {
  const camRef = useRef(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [hasPermission, setHasPermission] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [mucosas, setMucosas] = useState([]);
  const [model, setModel] = useState();

  const isFocused = useIsFocused();
  const [showCamera, setShowCamera] = useState(true);

  const [status, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    (async () => {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status === 'granted') setHasPermission(true);
    })();

    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === 'granted') setHasPermission(true);

      let permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }

      if (!model) {
        console.log('[+] Application started');
        //Wait for tensorflow module to be ready
        const tfReady = await tf.ready();

        console.log('[+] Loading Mucosa detection model');

        const modelJson = await require('../../../assets/model/model.json');
        const modelWeight =
          await require('../../../assets/model/group1-shard.bin');
        const maskDetector = await tf
          .loadGraphModel(bundleResourceIO(modelJson, modelWeight))
          .catch((e) => console.log(e));
        const mod = new automl.ObjectDetectionModel(maskDetector, [
          'background',
          'Mucosa',
          // 'saudavel',
          // 'doente',
        ]);
        await setModel(mod);

        await console.log('[+] Model Loaded');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (isFocused && !showCamera) await setShowCamera(true);
    })();
  }, [isFocused]);

  async function takePicture() {
    if (camRef) {
      const data = await camRef.current.takePictureAsync();
      setCapturedPhoto(data.uri);
      // setOpenModal(true);
      console.log(data);

      const imageResized = await manipulateAsync(
        data.uri,
        [{ resize: { width: 224, height: 224 } }],
        { compress: 1, format: SaveFormat.JPG }
      );
      console.log('[ IMAGE RESIZED ]:', imageResized);
      console.log('[ CAPTURED PHOTO ]:', capturedPhoto);

      camRef.current.pausePreview();
      navigation.navigate('Resultado', {
        imageResized,
        model: model,
        capturedPhoto: data.uri,
      });
    }
  }

  function flipCamera() {
    type === Camera.Constants.Type.back
      ? setType(Camera.Constants.Type.front)
      : setType(Camera.Constants.Type.back);
  }

  const pickImage = async () => {
    await setShowCamera(false);
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // allowsEditing: true,
      // aspect: [1, 1],
      quality: 1,
    });

    console.log(result);

    if (!result.cancelled) {
      const imageObj = await manipulateAsync(
        result.uri,
        [{ resize: { width: 224, height: 224 } }],
        { compress: 1, format: SaveFormat.JPG }
      );
      console.log(imageObj);
      // setShowCamera(true);
      navigation.navigate('Resultado', { image: imageObj, model: model });
    } else {
      await setShowCamera(true);
    }
  };

  if (hasPermission === null) return <View />;

  if (hasPermission === false) return <Text> Acesso negado! </Text>;

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && (
        <>
          {showCamera && (
            <Camera
              style={{ flex: 1 }}
              type={type}
              ref={camRef}
              ratio={'4:3'}
            />
          )}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={flipCamera}>
              <MaterialIcons name='flip-camera-ios' size={35} color='#FFF' />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ ...styles.button, height: 70, width: 70 }}
              onPress={takePicture}
            >
              <MaterialIcons name='photo-camera' size={40} color='#FFF' />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <MaterialIcons name='image' size={35} color='#FFF' />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
