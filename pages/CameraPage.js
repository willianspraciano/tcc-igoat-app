import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { Camera } from "expo-camera";

import { MaterialIcons, FontAwesome } from "@expo/vector-icons";

import * as tf from "@tensorflow/tfjs";
import { fetch, bundleResourceIO } from "@tensorflow/tfjs-react-native";
import * as automl from "@tensorflow/tfjs-automl";

import Svg, { Rect } from "react-native-svg";
import * as jpeg from "jpeg-js";

import "expo-dev-client";

import ImageColors from "react-native-image-colors";

import { manipulateAsync, FlipType, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from 'expo-image-picker';

import { useIsFocused } from "@react-navigation/native";

export default function CameraPage({ navigation }) {
  const camRef = useRef(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [hasPermission, setHasPermission] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [mucosas, setMucosas] = useState([]);
  const [model, setModel] = useState();

  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === "granted") setHasPermission(true);

      let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert("Permission to access camera roll is required!");
        return;
      }

      if (!model) {
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

  async function takePicture() {
    if (camRef) {
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
      camRef.current.pausePreview();
      navigation.navigate("Resultado", { image: imageObj, model: model });
    }
  }

  function flipCamera() {
    type === Camera.Constants.Type.back 
      ? setType(Camera.Constants.Type.front)
      : setType(Camera.Constants.Type.back);
  }

  const pickImage = async () => {
    if (camRef) {
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
          [{ resize: { width: 240, height: 240 } }],
          { compress: 1, format: SaveFormat.JPG }
        );
        console.log(imageObj);
        navigation.navigate("Resultado", { image: imageObj, model: model });
      }
    }
  };

  if (hasPermission === null) return <View />;

  if (hasPermission === false) return <Text> Acesso negado! </Text>;

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && 
        <>
          <Camera style={{ flex: 1 }} type={type} ref={camRef} ratio={'4:3'}/>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={flipCamera}>
              <MaterialIcons name="flip-camera-ios" size={30} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <MaterialIcons name="photo-camera" size={35} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <MaterialIcons name="image" size={30} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      }

      {capturedPhoto && (
        <Modal animationType="slide" transparent={false} visible={openModal}>
          <View style={styles.containerModal}>
            <TouchableOpacity
              style={{ margin: 10 }}
              onPress={() => setOpenModal(false)}
            >
              <FontAwesome name="window-close" size={50} color="#FF0000" />
            </TouchableOpacity>
            <Image
              style={{ width: "100%", height: 300, borderRadius: 20 }}
              source={{ uri: capturedPhoto }}
            />
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "20%",
    padding: 10
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    margin: 10,
    borderRadius: 50,
    height: 60,
    width: 60,
  },
  containerModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: 20,
  },
});
