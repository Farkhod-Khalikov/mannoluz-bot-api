import fs from 'fs';

export default class FileManager {
  public static renameFile(oldPath: string, newPath: string): string {
    fs.renameSync(oldPath, newPath);
    return newPath;
  }

  public static deleteFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}