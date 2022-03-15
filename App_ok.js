import React, { useState, useEffect } from "react";
import { StyleSheet, View, Image, ScrollView } from "react-native";
import { Button, Input } from "react-native-elements";

import * as tf from "@tensorflow/tfjs";
import { fetch, bundleResourceIO } from "@tensorflow/tfjs-react-native";
import * as automl from "@tensorflow/tfjs-automl";

import Svg, { Rect } from "react-native-svg";
import * as jpeg from "jpeg-js";

import "expo-dev-client";

import ImageColors from "react-native-image-colors";

import { manipulateAsync, FlipType, SaveFormat } from "expo-image-manipulator";

export default function App() {
  const [imageLink, setImageLink] = useState(
    "https://raw.githubusercontent.com/ohyicong/masksdetection/master/dataset/without_mask/142.jpg"
  );
  const [isEnabled, setIsEnabled] = useState(true);
  const [mucosas, setMucosas] = useState([]);
  const [model, setModel] = useState("");

  const [image, setImage] = useState();

  useEffect(() => {
    async function loadModel() {
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
    loadModel();
  }, []);

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

  const getMucosa = async () => {
    try {
      console.log("[+] Retrieving image from link :" + imageLink);
      const response = await fetch(imageLink, {}, { isBinary: true });
      const rawImageData = await response.arrayBuffer();

      const imageTensor = await imageToTensor(rawImageData).resizeBilinear([
        224, 224,
      ]);

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
  };

  const cropImage = async (img, box) => {
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
    //console.log(resizedImage);
    console.log(img);
    setImage(croppedImage);

    const result = await ImageColors.getColors(croppedImage.uri, {
      fallback: "#228B22",
      cache: true,
      key: "unique_key",
    });
    console.log("Cores: ", result);

    switch (result.platform) {
      case "android":
        // android result properties
        const vibrantColor = result.vibrant;
        break;
      case "web":
        // web result properties
        const lightVibrantColor = result.lightVibrant;
        break;
      case "ios":
        // iOS result properties
        const primaryColor = result.primary;
        break;
      default:
        throw new Error("Unexpected platform key");
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Input
          placeholder="image link"
          onChangeText={(inputText) => {
            console.log(inputText);
            setImageLink(inputText);
            // const elements= inputText.split(".");
            // if(elements.slice(-1)[0]=="jpg" || elements.slice(-1)[0]=="jpeg"){
            //   setIsEnabled(true);
            // }else{
            //   setIsEnabled(false);
            // }

            setIsEnabled(true);
          }}
          value={imageLink}
          containerStyle={{ height: 40, fontSize: 10, margin: 15 }}
          inputContainerStyle={{
            borderRadius: 10,
            borderWidth: 1,
            paddingHorizontal: 5,
          }}
          inputStyle={{ fontSize: 15 }}
        />
        <View style={{ marginBottom: 20 }}>
          <Image
            style={{
              width: 224,
              height: 224,
              borderWidth: 2,
              borderColor: "black",
              resizeMode: "stretch",
            }}
            source={{
              uri: imageLink,
            }}
            PlaceholderContent={<View>No Image Found</View>}
          />

          <Svg height="224" width="224" style={{ marginTop: -224 }}>
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

          {image && (
            <>
              <Image
                style={{
                  width: 224,
                  height: 224,
                  borderWidth: 2,
                  borderColor: "black",
                  resizeMode: "stretch",
                }}
                source={{ uri: image.uri }}
                PlaceholderContent={<View>No Image Found</View>}
              />
            </>
          )}
        </View>
        <Button
          title="Predict"
          onPress={() => {
            getMucosa();
          }}
          disabled={!isEnabled}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
