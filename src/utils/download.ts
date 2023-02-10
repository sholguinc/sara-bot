import * as fs from 'fs';
import axios from 'axios';

export async function downloadFile(fileName, url) {
  // Path
  const filePath = 'static' + '/' + fileName;
  const localFile = fs.createWriteStream(filePath);

  const response = await axios({
    method: 'GET',
    url,
    responseType: 'stream',
  });

  // File
  response.data.pipe(localFile);
}
