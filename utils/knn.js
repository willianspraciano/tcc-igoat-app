import { distance } from "ml-distance"; // biblioteca para obter Distância Euclidiana
import { mode } from "simple-statistics"; // biblioteca para obter a Moda
import hexRgb from "hex-rgb";

const trainingData = [
  {
    red: 213,
    green: 46,
    blue: 37,
    label: "NT",
  },
  {
    red: 231,
    green: 136,
    blue: 108,
    label: "NT",
  },
  {
    red: 245,
    green: 140,
    blue: 119,
    label: "NT",
  },
  {
    red: 243,
    green: 114,
    blue: 95,
    label: "NT",
  },
  {
    red: 236,
    green: 107,
    blue: 88,
    label: "NT",
  },
  {
    red: 253,
    green: 102,
    blue: 78,
    label: "NT",
  },
  {
    red: 238,
    green: 106,
    blue: 94,
    label: "NT",
  },
  {
    red: 225,
    green: 96,
    blue: 74,
    label: "NT",
  },
  {
    red: 233,
    green: 118,
    blue: 121,
    label: "NT",
  },
  {
    red: 212,
    green: 108,
    blue: 115,
    label: "NT",
  },
  {
    red: 193,
    green: 90,
    blue: 117,
    label: "NT",
  },
  {
    red: 216,
    green: 94,
    blue: 105,
    label: "NT",
  },
  {
    red: 196,
    green: 85,
    blue: 104,
    label: "NT",
  },
  {
    red: 215,
    green: 93,
    blue: 106,
    label: "NT",
  },
  {
    red: 166,
    green: 44,
    blue: 55,
    label: "NT",
  },
  {
    red: 249,
    green: 108,
    blue: 101,
    label: "NT",
  },
  {
    red: 218,
    green: 104,
    blue: 103,
    label: "NT",
  },
  {
    red: 231,
    green: 113,
    blue: 111,
    label: "NT",
  },
  {
    red: 202,
    green: 89,
    blue: 85,
    label: "NT",
  },
  {
    red: 202,
    green: 78,
    blue: 70,
    label: "NT",
  },
  {
    red: 214,
    green: 96,
    blue: 82,
    label: "NT",
  },
  {
    red: 188,
    green: 64,
    blue: 56,
    label: "NT",
  },
  {
    red: 207,
    green: 94,
    blue: 80,
    label: "NT",
  },
  {
    red: 233,
    green: 137,
    blue: 157,
    label: "NT",
  },
  {
    red: 207,
    green: 102,
    blue: 99,
    label: "NT",
  },
  {
    red: 221,
    green: 127,
    blue: 117,
    label: "NT",
  },
  {
    red: 207,
    green: 119,
    blue: 107,
    label: "NT",
  },
  {
    red: 238,
    green: 152,
    blue: 139,
    label: "NT",
  },
  {
    red: 209,
    green: 128,
    blue: 137,
    label: "NT",
  },
  {
    red: 178,
    green: 122,
    blue: 135,
    label: "NT",
  },
  {
    red: 255,
    green: 141,
    blue: 123,
    label: "NT",
  },
  {
    red: 214,
    green: 101,
    blue: 85,
    label: "NT",
  },
  {
    red: 227,
    green: 137,
    blue: 173,
    label: "NT",
  },
  {
    red: 222,
    green: 110,
    blue: 149,
    label: "NT",
  },
  {
    red: 203,
    green: 112,
    blue: 153,
    label: "NT",
  },

  {
    red: 247,
    green: 184,
    blue: 167,
    label: "T",
  },
  {
    red: 252,
    green: 222,
    blue: 212,
    label: "T",
  },
  {
    red: 254,
    green: 249,
    blue: 246,
    label: "T",
  },
  {
    red: 231,
    green: 158,
    blue: 133,
    label: "T",
  },
  {
    red: 232,
    green: 179,
    blue: 158,
    label: "T",
  },
  {
    red: 247,
    green: 223,
    blue: 199,
    label: "T",
  },
  {
    red: 205,
    green: 207,
    blue: 216,
    label: "T",
  },
  {
    red: 216,
    green: 168,
    blue: 184,
    label: "T",
  },
  {
    red: 236,
    green: 162,
    blue: 146,
    label: "T",
  },
  {
    red: 199,
    green: 139,
    blue: 138,
    label: "T",
  },
  {
    red: 191,
    green: 126,
    blue: 124,
    label: "T",
  },
  {
    red: 202,
    green: 141,
    blue: 138,
    label: "T",
  },
  {
    red: 186,
    green: 123,
    blue: 152,
    label: "T",
  },
  {
    red: 170,
    green: 150,
    blue: 162,
    label: "T",
  },
  {
    red: 154,
    green: 109,
    blue: 140,
    label: "T",
  },
  {
    red: 171,
    green: 159,
    blue: 171,
    label: "T",
  },
  {
    red: 100,
    green: 77,
    blue: 95,
    label: "T",
  },
  {
    red: 169,
    green: 158,
    blue: 166,
    label: "T",
  },
  {
    red: 207,
    green: 193,
    blue: 229,
    label: "T",
  },
  {
    red: 221,
    green: 224,
    blue: 229,
    label: "T",
  },
  {
    red: 191,
    green: 179,
    blue: 199,
    label: "T",
  },
  {
    red: 206,
    green: 205,
    blue: 213,
    label: "T",
  },
  {
    red: 202,
    green: 186,
    blue: 197,
    label: "T",
  },
  {
    red: 215,
    green: 233,
    blue: 243,
    label: "T",
  },
  {
    red: 196,
    green: 187,
    blue: 190,
    label: "T",
  },
  {
    red: 200,
    green: 190,
    blue: 181,
    label: "T",
  },
  {
    red: 175,
    green: 174,
    blue: 121,
    label: "T",
  },
  {
    red: 204,
    green: 168,
    blue: 156,
    label: "T",
  },
  {
    red: 203,
    green: 196,
    blue: 178,
    label: "T",
  },
];

// valores = cor exadecimal
export function knn(corHEX) {
  let corRGB = hexRgb(corHEX);

  let values = { red: corRGB.red, green: corRGB.green, blue: corRGB.blue };
  const k = 5;
  const data = trainingData;

  const classe = data.map((info) => info.label);

  let obj = data.map((info) => {
    let aux = [];
    aux.push(info.red);
    aux.push(info.green);
    aux.push(info.blue);
    return aux;
  });

  // valores máximos de cada coluna
  const max0 = Math.max.apply(
    null,
    obj.map((a, i) => a[0])
  );
  const max1 = Math.max.apply(
    null,
    obj.map((a, i) => a[1])
  );
  const max2 = Math.max.apply(
    null,
    obj.map((a, i) => a[2])
  );

  // normalizando entrada
  // values = [values[0] / max0, values[1] / max1, values[2] / max2];
  values = [values.red / max0, values.green / max1, values.blue / max2];

  // normalizando vetor
  obj = obj.map((a, i) => {
    a[0] = a[0] / max0;
    a[1] = a[1] / max1;
    a[2] = a[2] / max2;

    return a;
  });

  // obtendo distância euclidiana
  const dist = obj.map((a, i) => distance.euclidean(a, values));

  // Ordenando as distâncias do menor para maior
  var distwithlabel = dist.map((a, i) => [a, classe[i]]);
  distwithlabel = distwithlabel.sort((a, b) => {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return 0;
  });

  // retornando apenas a classificação dos K primeiro elementos que mais se repete
  return mode(distwithlabel.slice(0, k));
}
