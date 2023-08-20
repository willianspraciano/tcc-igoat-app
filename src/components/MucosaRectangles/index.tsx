import Svg, { Rect } from 'react-native-svg';

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

interface IProps {
  mucosas: IMucosa[];
}

export function MucosaRectangles({ mucosas }: IProps) {
  return (
    <Svg height="224" width="224" style={{ position: 'absolute' }}>
      {mucosas.map((mucosa) => {
        return (
          <Rect
            key={mucosa.id}
            x={mucosa.location.left}
            y={mucosa.location.top + 20} // + 20 se refere ao padding top da View
            width={mucosa.location.width}
            height={mucosa.location.height}
            stroke="red"
            strokeWidth="3"
            fill="transparent"
          />
        );
      })}
    </Svg>
  );
}
