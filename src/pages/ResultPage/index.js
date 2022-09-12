import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { FontAwesome, Entypo } from '@expo/vector-icons';

import { format } from 'date-fns';

import { Button, Input } from 'react-native-elements';

import * as tf from '@tensorflow/tfjs';
import { fetch, bundleResourceIO } from '@tensorflow/tfjs-react-native';
import * as automl from '@tensorflow/tfjs-automl';

import Svg, { Rect } from 'react-native-svg';
import * as jpeg from 'jpeg-js';

import ImageColors from 'react-native-image-colors';

import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import { styles } from './styles';
import { knn } from '../../utils/knn';
import { lmknn } from '../../utils/lmknn';

export default function ResultPage({ navigation, route }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [mucosas, setMucosas] = useState([]);
  const [model, setModel] = useState(route.params?.model);

  const [imageResized, setImageResized] = useState(route.params?.imageResized);
  const [capturedPhoto, setCapturedPhoto] = useState(
    route.params?.capturedPhoto
  );

  const [croppedImage, setCroppedImage] = useState();

  const [color, setColor] = useState();
  const [textResult, setTextResult] = useState();
  const [textResultModel, setTextResultModel] = useState();
  const [textScoreModel, setTextScoreModel] = useState();

  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    (async () => {
      await getMucosa(imageResized);
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
      console.log('[+] Retrieving image from link :' + imageObj);
      // const response = await fetch(imageLink, {}, { isBinary: true });
      // const rawImageData = await response.arrayBuffer();
      // const imageTensor = await imageToTensor(rawImageData).resizeBilinear([
      //   224, 224,
      // ]);

      const imageAssetPath = Image.resolveAssetSource(imageObj);

      console.log(imageAssetPath);
      const imgB64 = await FileSystem.readAsStringAsync(imageAssetPath.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
      const raw = new Uint8Array(imgBuffer);
      const imageTensor = imageToTensor(raw).resizeBilinear([240, 240]);

      const options = { score: 0.25, iou: 0.5, topk: 20 };
      const predictions = await model.detect(imageTensor, options);
      console.log('Predict: ', predictions);

      console.log('[+] Prediction Completed');

      if (predictions.length === 0) {
        setTextResultModel('Mucosa não detectada!');
        return;
      }

      var tempArray = [];
      //Loop through the available faces, check if the person is wearing a mask.
      for (let i = 0; i < predictions.length; i++) {
        let color = 'red';
        let width = predictions[i].box.width;
        let height = predictions[i].box.height;
        tempArray.push({
          id: i,
          location: predictions[i].box,
          color: color,
        });
      }
      setTextResultModel(predictions[0].label);
      setTextScoreModel((Number(predictions[0].score) * 100).toFixed(2) + '%');

      cropImage(imageObj.uri, predictions[0].box);
      setMucosas(tempArray);
    } catch (err) {
      console.log('[-] Unable to load image', err);
    }
  }

  const cropImage = async (img, box) => {
    const resizedImg = await manipulateAsync(
      img,
      [{ resize: { width: 224, height: 224 } }],
      { compress: 1, format: SaveFormat.JPG }
    );

    const croppedImg = await manipulateAsync(
      resizedImg.uri,
      // img,
      [
        {
          crop: {
            originY: box.top + box.height * 0.25,
            originX: box.left + box.width * 0.25,
            height: box.height * 0.5,
            width: box.width * 0.5,
            // height: box.height,
            // originX: box.left,
            // originY: box.top,
            // width: box.width,
          },
        },
      ],
      { format: SaveFormat.JPG }
    );
    //console.log(resizedImage);
    console.log('Cropped:', img);
    setCroppedImage(croppedImg);

    const result = await ImageColors.getColors(croppedImg.uri, {
      fallback: '#ffffff',
      pixelSpacing: 5,
      key: 'unique_key',
      quality: 'highest',
    });
    console.log('Cores: ', result);

    setTextResult('Identificando cor...');

    let dominantColor;
    // dominantColor = result?.dominant;

    switch (result.platform) {
      case 'android':
        // android result properties
        dominantColor = result.average;
        break;
      case 'web':
        // web result properties
        dominantColor = result.dominant;
        break;
      case 'ios':
        // iOS result properties
        dominantColor = result.primary;
        break;
      default:
        throw new Error('Unexpected platform key');
    }

    setColor(dominantColor);
    const diagnosis = knn(dominantColor);
    console.log('Diagnóstico: ', diagnosis);
    console.log('Color: ', dominantColor);
    setTextResult(diagnosis === 'T' ? 'Vermifugar' : 'Não Vermifugar');
  };

  async function savePicture() {
    /**
     * Nome do arquivo
     */
    // let currentDate = new Date(
    //   new Date().getTime() - new Date().getTimezoneOffset() * 60000
    // ).toISOString();
    let formattedDate = format(new Date(), "dd-MM-yyyy_HH'h'mm");

    let newName = `${formattedDate}_LMKNN_${removeAccentsAndSpaces(
      textResult
    )}_AML_${textResultModel.charAt(0)}.jpg`;
    console.log('[ NOVO NOME ]:', newName);

    const imagesDir = FileSystem.cacheDirectory + newName;

    await FileSystem.copyAsync({
      from: capturedPhoto,
      to: imagesDir,
    });
    const picture = await FileSystem.getInfoAsync(imagesDir, {
      size: true,
    });
    if (picture.exists) {
      console.log('file saved from asset. . . : ', picture);
    }

    console.log('[ PICTURE ]:', picture);
    const asset = await MediaLibrary.createAssetAsync(picture.uri);
    // .then((a) => {
    //   alert('Salva com sucesso!', a);
    // })
    // .catch((error) => {
    //   console.log('[Erro ao salvar]:', error);
    // });
    console.log('[ ASSET ]', asset);
    const imagesFolder = await MediaLibrary.getAlbumAsync('MeuCaprino');
    if (imagesFolder == null) {
      await MediaLibrary.createAlbumAsync('MeuCaprino', asset, false);
      alert('Imagem salva com sucesso!');
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], imagesFolder, false);
      alert('Imagem salva com sucesso!');
    }
  }

  function removeAccentsAndSpaces(text) {
    text = text.toLowerCase();
    text = text.replace(new RegExp('[ÁÀÂÃ]', 'gi'), 'a');
    text = text.replace(new RegExp('[ÉÈÊ]', 'gi'), 'e');
    text = text.replace(new RegExp('[ÍÌÎ]', 'gi'), 'i');
    text = text.replace(new RegExp('[ÓÒÔÕ]', 'gi'), 'o');
    text = text.replace(new RegExp('[ÚÙÛ]', 'gi'), 'u');
    text = text.replace(new RegExp('[Ç]', 'gi'), 'c');
    text = text.replace(new RegExp('[/ /]', 'gi'), '_'); // substitui espaõ por _
    return text;
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        <Image
          style={styles.images}
          source={{
            uri: imageResized.uri,
          }}
          PlaceholderContent={<View>No Image Found</View>}
        />

        <Svg height='224' width='224' style={{ position: 'absolute' }}>
          {mucosas.map((mucosa, i) => {
            return (
              <Rect
                key={i}
                x={mucosa.location.left}
                y={mucosa.location.top + 20} // + 20 se refere ao padding top da View
                width={mucosa.location.width}
                height={mucosa.location.height}
                stroke={mucosa.color}
                strokeWidth='3'
                fill=''
              />
            );
          })}
        </Svg>

        {croppedImage && (
          <>
            <Image
              style={styles.images}
              source={{ uri: croppedImage?.uri }}
              PlaceholderContent={<View>No Image Found</View>}
            />
          </>
        )}
        {textResultModel && (
          <Text style={{ fontWeight: 'bold' }}>
            Mucosa detectada com precisão de: {textScoreModel}
          </Text>
        )}
        {color && (
          <Text style={{ color: '#000' }}>
            Cor analisada:
            <Text style={{ fontWeight: 'bold', color: color }}>{color}</Text>
          </Text>
        )}

        {textResult && (
          <Text style={{ fontWeight: 'bold' }}>
            Resultado LMKNN:{' '}
            <Text
              style={{
                fontWeight: 'bold',
                color: textResult === 'Vermifugar' ? '#FF0000' : '#00CF04',
              }}
            >
              {textResult}
            </Text>
          </Text>
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => setOpenModal(true)}
        >
          <Text style={styles.buttonText}>Salvar Imagem</Text>
        </TouchableOpacity>

        {openModal && (
          <Modal animationType='slide' transparent={false} visible={openModal}>
            <View style={styles.containerModal}>
              <Image
                style={{ width: '50%', height: '50%', borderRadius: 20 }}
                source={{ uri: capturedPhoto }}
              />

              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={{ margin: 10 }}
                  onPress={() => setOpenModal(false)}
                >
                  <FontAwesome name='close' size={50} color='#FF0000' />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ margin: 10 }}
                  onPress={() => savePicture()}
                >
                  <Entypo name='save' size={50} color='#0091ea' />
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </ScrollView>
  );
}
