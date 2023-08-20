import * as React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CameraPage from './pages/Camera';
import ResultPage from './pages/Result';

const Stack = createNativeStackNavigator();

export function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Camera"
          component={CameraPage}
          options={{ title: 'iGoat' }}
        />
        <Stack.Screen
          name="Resultado"
          component={ResultPage}
          options={{
            title: 'Resultado',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
