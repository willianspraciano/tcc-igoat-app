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
import * as FileSystem from 'expo-file-system';

export default function ResultPage({ navigation, route }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [mucosas, setMucosas] = useState([]);
  const [model, setModel] = useState(route.params?.model);

  const [image, setImage] = useState(route.params?.image);
  const [croppedImage, setCroppedImage] = useState();

  useEffect(() => {
    (async () => {
      await getMucosa(image);
    })();
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

  async function getMucosa(imageObj) {
    try {
      console.log("[+] Retrieving image from link :" + imageObj);
      // const response = await fetch(imageLink, {}, { isBinary: true });
      // const rawImageData = await response.arrayBuffer();
      // const imageTensor = await imageToTensor(rawImageData).resizeBilinear([
      //   224, 224,
      // ]);

      const imageAssetPath = Image.resolveAssetSource(imageObj)

      console.log(imageAssetPath);
      const imgB64 = await FileSystem.readAsStringAsync(imageAssetPath.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
      const raw = new Uint8Array(imgBuffer);
      const imageTensor = imageToTensor(raw)
        .resizeBilinear([
          240, 240,
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
      cropImage(imageObj.uri, predictions[0].box);
      setMucosas(tempArray);
    } catch (err) {
      console.log("[-] Unable to load image", err);
    }
  }

  const cropImage = async (img, box) => {
    // const resizedImg = await manipulateAsync(
    //   img,
    //   [{ resize: { width: 240, height: 240 } }],
    //   { compress: 1, format: SaveFormat.JPG }
    // );

    const croppedImg = await manipulateAsync(
      // resizedImg.uri,
      img,
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
    setCroppedImage(croppedImg);

    const result = await ImageColors.getColors(croppedImg.uri, {
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
              uri: image.uri,
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

          {croppedImage && (
            <>
              <Image
                style={{
                  width: 224,
                  height: 224,
                  borderWidth: 2,
                  borderColor: "black",
                  resizeMode: "stretch",
                }}
                source={{ uri: croppedImage?.uri }}
                PlaceholderContent={<View>No Image Found</View>}
              />
            </>
          )}
        </View>
        {/* <Button
          title="Predict"
          onPress={() => {
            getMucosa(image);
          }}
          disabled={!isEnabled}
        /> */}
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
