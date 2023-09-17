import axios from "axios";
import { extractColors } from "extract-colors";
import { getImageData, imageFromBuffer } from "@canvas/image";

export const getImageColors = async ({url} : {url: string}) => {

  const response = await axios.get(url, {
    responseType: "arraybuffer"
  });

  const imageBuffer = Buffer.from(response.data, "binary");
  const image = await imageFromBuffer(imageBuffer);
  const imageData = getImageData(image);

  if (imageData == null) {
    return null
  }

  return await extractColors(imageData);
}

