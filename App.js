import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CameraPage from "./pages/CameraPage";
import ResultPage from "./pages/ResultPage";

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Camera"
          component={CameraPage}
          options={{ title: "Camera", unmountOnBlur: true }}
          screenOptions={{ unmountOnBlur: true }}
        />
        <Stack.Screen
          name="Resultado"
          component={ResultPage}
          options={{
            title: "Resultado",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
