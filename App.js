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
import * as FileSystem from 'expo-file-system';

import { FontAwesome } from '@expo/vector-icons';

import * as tf from "@tensorflow/tfjs";
import { fetch, bundleResourceIO } from "@tensorflow/tfjs-react-native";
import * as automl from "@tensorflow/tfjs-automl";

import Svg, { Rect } from "react-native-svg";
import * as jpeg from "jpeg-js";

import "expo-dev-client";

import ImageColors from "react-native-image-colors";

import { manipulateAsync, FlipType, SaveFormat } from "expo-image-manipulator";

export default function App() {
  const camRef = useRef(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const [hasPermission, setHasPermission] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [isEnabled, setIsEnabled] = useState(true);
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

        const modelJson = await require("./assets/model/model.json");
        const modelWeight = await require("./assets/model/group1-shard.bin");
        const maskDetector = await tf
          .loadGraphModel(bundleResourceIO(modelJson, modelWeight))
          .catch((e) => console.log(e));
        const mod = new automl.ObjectDetectionModel(maskDetector, [
          "background",
          "Mucosa",
        ]);
        setModel(mod);

        console.log("[+] Model Loaded");
      }
    })();
  }, []);

  async function takePicture(){
    if(camRef){
      const data = await camRef.current.takePictureAsync();
      setCapturedPhoto(data.uri);
      getMucosa(data);
      setOpenModal(true);
      console.log(data); 
    }
  }

  function imageToTensor(rawImageData) {
    //Function to convert jpeg image to tensors
    const TO_UINT8ARRAY = true;
    const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY);
    // Drop the alpha channel info for mobilenet
    const buffer = new Uint8Array(width * height * 3);
    let offset = 0; // offset into original data
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset];
      buffer[i + 1] = data[offset + 1];
      buffer[i + 2] = data[offset + 2];
      offset += 4;
    }
    return tf.tensor3d(buffer, [height, width, 3]);
  }

  async function getMucosa(imageLink) {
    try {
      console.log("[+] Retrieving image from link :" + imageLink);
      // const response = await fetch(imageLink, {}, { isBinary: true });
      // const rawImageData = await response.arrayBuffer();
      // const imageTensor = await imageToTensor(rawImageData).resizeBilinear([
      //   224, 224,
      // ]);

      const imgB64 = await FileSystem.readAsStringAsync(imageLink, { 
        encoding: 'base64'
      });
      const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
      const raw = new Uint8Array(imgBuffer)  
      const imageTensor = decodeJpeg(raw);

      const options = { score: 0.5, iou: 0.5, topk: 20 };
      const predictions = await model.detect(imageTensor, options);
      console.log("Predict: ", predictions);

      console.log("[+] Prediction Completed");

      var tempArray = [];
      //Loop through the available faces, check if the person is wearing a mask.
      for (let i = 0; i < predictions.length; i++) {
        let color = "red";
        let width = predictions[i].box.width;
        let height = predictions[i].box.height;
        tempArray.push({
          id: i,
          location: predictions[i].box,
          color: color,
        });
      }
      cropImage(imageLink, predictions[0].box);
      setMucosas(tempArray);
    } catch (err) {
      console.log("[-] Unable to load image", err);
    }
  }

  async function cropImage(img, box) {
    const resizedImage = await manipulateAsync(
      img,
      [{ resize: { width: 240, height: 240 } }],
      { compress: 1, format: SaveFormat.JPG }
    );
    const croppedImage = await manipulateAsync(
      resizedImage.uri,
      [
        {
          crop: {
            height: box.height,
            originX: box.left,
            originY: box.top,
            width: box.width,
          },
        },
      ],
      { compress: 1, format: SaveFormat.JPG }
    );

    console.log(img);
    setImage(croppedImage);

    const result = await ImageColors.getColors(croppedImage.uri, {
      fallback: "#228B22",
      cache: true,
      key: "unique_key",
    });
    console.log("Cores: ", result);
  };

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
            {/* <Image
              style={{ width: '100%', height: 300, borderRadius: 20 }}
              source={{ uri: capturedPhoto }}
            /> */}
            <Svg style={{ width: '100%', height: 300 }}>
              {mucosas.map((mucosa, i) => {
                return (
                  <Rect
                    key={i}
                    x={mucosa.location.left}
                    y={mucosa.location.top}
                    width={mucosa.location.width}
                    height={mucosa.location.height}
                    stroke={mucosa.color}
                    strokeWidth="3"
                    fill=""
                  />
                );
              })}
            </Svg>
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