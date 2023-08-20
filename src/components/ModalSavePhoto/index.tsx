import { Image, Modal, TouchableOpacity, View } from 'react-native';

import { Entypo, FontAwesome } from '@expo/vector-icons';

import { styles } from './styles';

interface IProps {
  openModal: boolean;
  capturedPhoto: string;
  setOpenModal: (newValue: boolean) => void;
  savePicture: () => void;
}

export function ModalSavePhoto({
  capturedPhoto,
  openModal,
  setOpenModal,
  savePicture,
}: IProps) {
  console.log('capturedPhoto', capturedPhoto);

  return (
    <Modal animationType="slide" transparent={false} visible={openModal}>
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
            <FontAwesome name="close" size={50} color="#FF0000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ margin: 10 }}
            onPress={() => savePicture()}
          >
            <Entypo name="save" size={50} color="#0091ea" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
