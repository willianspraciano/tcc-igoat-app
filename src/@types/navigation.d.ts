import * as automl from '@tensorflow/tfjs-automl';
import { ImageResult } from 'expo-image-manipulator';

export declare global {
  namespace ReactNavigation {
    interface RootParamList {
      [pageName: string]: undefined;
      Resultado: {
        imageResized: ImageResult;
        capturedPhoto?: string;
        model: automl.ObjectDetectionModel;
      };
    }
  }
}
