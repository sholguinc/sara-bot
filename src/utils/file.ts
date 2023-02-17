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

export function deleteFile() {
  // Dir
  const dir = 'static';

  // files directory
  const filenames = fs.readdirSync(dir);

  // Except File
  const gitkeep = '.gitkeep';

  // Empty directory
  filenames.forEach((file) => {
    // Path
    const filePath = dir + '/' + file;

    // Delete File
    if (file !== gitkeep) {
      fs.unlinkSync(filePath);
    }
  });
}
