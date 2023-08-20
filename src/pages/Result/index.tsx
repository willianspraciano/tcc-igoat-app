import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ImageColors from 'react-native-image-colors'; // BIBLIOTECA DE TRATAMENTO DE CORES

import { useRoute } from '@react-navigation/native';
import * as tf from '@tensorflow/tfjs';
import * as automl from '@tensorflow/tfjs-automl';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import {
  ImageResult,
  manipulateAsync,
  SaveFormat,
} from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as jpeg from 'jpeg-js';

import { ModalSavePhoto } from '../../components/ModalSavePhoto';
import { MucosaRectangles } from '../../components/MucosaRectangles';
import { lmknn } from '../../utils/lmknn';
import { removeAccentsAndSpaces } from '../../utils/removeAccentsAndSpaces';
import { styles } from './styles';

interface IRouteParams {
  imageResized: ImageResult;
  capturedPhoto: string;
  model: automl.ObjectDetectionModel;
}

interface IBox {
  height: number;
  width: number;
  left: number;
  top: number;
}

interface IMucosa {
  id: number | string;
  location: IBox;
  color: string;
}

export default function ResultPage() {
  const route = useRoute();

  const { model, imageResized, capturedPhoto } = route.params as IRouteParams;

  const [mucosas, setMucosas] = useState<IMucosa[]>([]);
  const [croppedImage, setCroppedImage] = useState<ImageResult>();
  const [color, setColor] = useState('');
  const [textResult, setTextResult] = useState('');
  const [textResultModel, setTextResultModel] = useState('');
  const [textScoreModel, setTextScoreModel] = useState('');
  const [openModal, setOpenModal] = useState(false);

  /**
   *Função para converter imagens jpeg para tensor
   * @param rawImageData Uint8Array
   * @returns tf.Tensor3D
   */
  const imageToTensor = async (rawImageData: Uint8Array) => {
    const { width, height, data } = jpeg.decode(rawImageData, {
      useTArray: true,
    });

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
  };

  /**
   * Função para recortar imagem
   * @param imageUri string
   * @param box IBox
   */
  const cropImage = async (imageUri: string, box: IBox) => {
    const resizedImg = await manipulateAsync(
      imageUri,
      [{ resize: { width: 224, height: 224 } }],
      { compress: 1, format: SaveFormat.JPEG },
    );

    console.log('resizedImg', resizedImg);
    const croppedImg = await manipulateAsync(
      resizedImg.uri,
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
      { format: SaveFormat.JPEG },
    );
    // console.log(resizedImage);
    console.log('Cropped:', imageUri);
    setCroppedImage(croppedImg);

    /**
     * TRATAMENTO DE COR DOMINANTE DA IMAGEM - INÍCIO
     */
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
    const diagnosis = lmknn(dominantColor);
    console.log('Diagnóstico: ', diagnosis);
    console.log('Color: ', dominantColor);
    setTextResult(diagnosis === 'T' ? 'Vermifugar' : 'Não Vermifugar');
    /**
     * TRATAMENTO DE COR DOMINANTE DA IMAGEM - FIM
     */
  };

  /**
   * Função para obter posições da mucosa em uma imagem usando TensorFlow
   * @param imageObj ImageResult
   * @returns void
   */
  const getMucosa = useCallback(
    async (imageObj: ImageResult) => {
      try {
        // await tf.ready();
        console.log(`[+] Retrieving image from link :${imageObj}`);

        const imageAssetPath = Image.resolveAssetSource(imageObj);

        console.log('imageAssetPath', imageAssetPath);
        const imgB64 = await FileSystem.readAsStringAsync(imageAssetPath.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
        const raw = new Uint8Array(imgBuffer);
        const imageTensor = await imageToTensor(raw);
        const imageTensorResized = imageTensor.resizeBilinear([
          240, 240,
        ]) as automl.ImageInput;

        const options = { score: 0.25, iou: 0.5, topk: 20 };
        const predictions = await model.detect(imageTensorResized, options);
        console.log('Predictions: ', predictions);

        console.log('[+] Prediction Completed');

        if (predictions.length === 0) {
          setTextResultModel('Mucosa não detectada!');
          return;
        }

        const tempArray: IMucosa[] = [];
        // Loop through the available faces, check if the person is wearing a mask.
        for (let i = 0; i < predictions.length; i++) {
          tempArray.push({
            id: i,
            location: predictions[i].box,
            color: 'red',
          });
        }
        setTextResultModel(predictions[0].label);
        setTextScoreModel(
          `${(Number(predictions[0].score) * 100).toFixed(2)}%`,
        );

        console.log('imageObj ', imageObj);
        cropImage(imageObj.uri, predictions[0].box);
        setMucosas(tempArray);
      } catch (err) {
        console.log('[-] Unable to load image', err);
      }
    },
    [model],
  );

  /**
   * Função para salvar uma imagem capturada no dispositivo
   */
  const handleSavePicture = async () => {
    /**
     * Nome do arquivo
     */
    const formattedDate = format(new Date(), "dd-MM-yyyy_HH'h'mm");

    const newName = `${formattedDate}_LMKNN_${removeAccentsAndSpaces(
      textResult,
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
  };

  /**
   * Efeito disparado logo que a página é aberta
   * ou sempre que getMucosa e imageResized mudarem
   */
  useEffect(() => {
    (async () => {
      await getMucosa(imageResized);
    })();
  }, [getMucosa, imageResized]);

  return (
    <ScrollView>
      <View style={styles.container}>
        <Image
          style={styles.images}
          source={{
            uri: imageResized?.uri,
          }}
        />

        <MucosaRectangles mucosas={mucosas} />

        {croppedImage && (
          <Image style={styles.images} source={{ uri: croppedImage?.uri }} />
        )}
        {textResultModel && (
          <Text style={{ fontWeight: 'bold' }}>
            Mucosa detectada com precisão de: {textScoreModel}
          </Text>
        )}
        {color && (
          <Text style={{ color: '#000' }}>
            Cor analisada:
            <Text style={{ fontWeight: 'bold', color }}>{color}</Text>
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
          <ModalSavePhoto
            capturedPhoto={capturedPhoto || imageResized.uri}
            openModal={openModal}
            setOpenModal={setOpenModal}
            savePicture={handleSavePicture}
          />
        )}
      </View>
    </ScrollView>
  );
}
