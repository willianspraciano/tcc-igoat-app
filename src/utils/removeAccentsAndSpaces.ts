export function removeAccentsAndSpaces(text: string) {
  let textFormatted = text.toLowerCase();
  textFormatted = textFormatted.replace(/[ÁÀÂÃ]/gi, 'a');
  textFormatted = textFormatted.replace(/[ÉÈÊ]/gi, 'e');
  textFormatted = textFormatted.replace(/[ÍÌÎ]/gi, 'i');
  textFormatted = textFormatted.replace(/[ÓÒÔÕ]/gi, 'o');
  textFormatted = textFormatted.replace(/[ÚÙÛ]/gi, 'u');
  textFormatted = textFormatted.replace(/[Ç]/gi, 'c');
  textFormatted = textFormatted.replace(/[/ /]/gi, '_'); // substitui espaço por _
  return textFormatted;
}
