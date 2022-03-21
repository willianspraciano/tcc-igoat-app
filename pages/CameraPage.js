import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Image 
} from 'react-native';
import { Camera } from 'expo-camera';

import { FontAwesome } from '@expo/vector-icons';

import * as tf from "@tensorflow/tfjs";
import { fetch, bundleResourceIO } from "@tensorflow/tfjs-react-native";
import * as automl from "@tensorflow/tfjs-automl";

import Svg, { Rect } from "react-native-svg";
import * as jpeg from "jpeg-js";

import "expo-dev-client";

import ImageColors from "react-native-image-colors";

import { manipulateAsync, FlipType, SaveFormat } from "expo-image-manipulator";

export default function CameraPage({ navigation }) {
  const camRef = useRef(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [hasPermission, setHasPermission] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  
  const [mucosas, setMucosas] = useState([]);
  const [model, setModel] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if(status === 'granted'){
        setHasPermission(true);
        console.log("[+] Application started");
        //Wait for tensorflow module to be ready
        const tfReady = await tf.ready();

        console.log("[+] Loading Mucosa detection model");

        const modelJson = await require("../assets/model/model.json");
        const modelWeight = await require("../assets/model/group1-shard.bin");
        const maskDetector = await tf
          .loadGraphModel(bundleResourceIO(modelJson, modelWeight))
          .catch((e) => console.log(e));
        const mod = new automl.ObjectDetectionModel(maskDetector, [
          "background",
          "Mucosa",
        ]);
        await setModel(mod);

        await console.log("[+] Model Loaded");
      }
    })();
  }, []);

  async function takePicture(){
    if(camRef){
      const data = await camRef.current.takePictureAsync();
      setCapturedPhoto(data.uri);
      // setOpenModal(true);
      console.log(data);

      const imageObj = await manipulateAsync(
        data.uri,
        [{ resize: { width: 240, height: 240 } }],
        { compress: 1, format: SaveFormat.JPG }
      );
      console.log(imageObj);
      navigation.navigate('Resultado', { image: imageObj, model: model });
    }
  }

  if(hasPermission === null)
    return <View/>;

  if(hasPermission === false)
    return <Text> Acesso negado! </Text>;

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        style={{ flex: 1 }}
        type={type}
        ref={camRef}
      />
      <TouchableOpacity style={styles.button} onPress={takePicture}>
        <FontAwesome name="camera" size={23} color="#FFF"/>
      </TouchableOpacity>
      {
        capturedPhoto &&
        <Modal
          animationType="slide"
          transparent={false}
          visible={openModal}
        >
          <View style={styles.containerModal}>
            <TouchableOpacity 
              style={{ margin: 10 }} 
              onPress={() => setOpenModal(false)}
            >
              <FontAwesome name="window-close" size={50} color="#FF0000"/>
            </TouchableOpacity>
            <Image
              style={{ width: '100%', height: 300, borderRadius: 20 }}
              source={{ uri: capturedPhoto }}
            />

          </View>
        </Modal>
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    margin: 20,
    borderRadius: 10,
    height: 50,
  },
  containerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
});