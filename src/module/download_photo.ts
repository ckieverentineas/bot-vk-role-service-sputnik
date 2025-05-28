import { Logger } from "./helper";
import * as path from "path";
import { promisify } from 'util';
import * as https from "https";
import * as fs from 'fs';
import { vk } from "..";

// Метод для фотографий 1.0 устарел
export async function Photo_Uploads(context: any) {
    // Получаем информацию о вложенной фотографии
    const attachment = context.message.attachments[0];
    const photoId = attachment.photo.id;
    const ownerId = attachment.photo.owner_id;
    // Формат для вложения
    const attachmentStr = `photo${ownerId}_${photoId}`;
    const photoUrl = attachment.photo.sizes[attachment.photo.sizes.length - 1].url
    // Сохраняем фото для пользователя
    const userId = context.senderId;
    //console.log(attachmentStr)
    await context.send('Фото сохранено!');
    try {
        await context.send({ attachment: attachmentStr });
        return attachmentStr
    } catch (e) {
        await context.send(`Произошла ошибка: ${e}`);
    }
    
    //await vk.api.messages.send({ peer_id: 463031671, random_id: 0, message: `тест`, attachment: attachmentStr } )
    return ''
}
// устаревший метод загрузки фото 2.0 т.к. загруженные фотки доступны неделю две
export async function Photo_Upload(context: any) {
    // Получаем информацию о вложенной фотографии
    const attachment = context.attachments[0];
    //console.log(context.attachments[0])
    const photoId = attachment.id;
    const ownerId = attachment.ownerId;
    // Формат для вложения
    const attachmentStr = `photo${ownerId}_${photoId}_${attachment.accessKey}`;
    //const photoUrl = attachment.photo.sizes[attachment.photo.sizes.length - 1].url
    // Сохраняем фото для пользователя
    //const userId = context.senderId;
    //console.log(attachmentStr)
    //await context.send('Фото сохранено!');
    try {
        //console.log({ attachment: attachmentStr });
        return attachmentStr
    } catch (e) {
        await Logger(`Произошла ошибка: ${e}`);
    }
    
    //await vk.api.messages.send({ peer_id: 463031671, random_id: 0, message: `тест`, attachment: attachmentStr } )
    return ''
}

// пользователь скидывает фото, бот скачивает себе, затем загружает в вк и очищает память Фото 3.0 новый
const statAsync = promisify(fs.stat);
const mkdirAsync = promisify(fs.mkdir);
export async function Photo_Upload_Pro(context: any): Promise<any> {
    //console.log(context)
    // получаем ссылку на фотку пользователя
    const url = context.attachments[0].largeSizeUrl
    //console.log(url)
    const dialogDirectory = path.join('./temp');
    await ensureDirectoryExists(dialogDirectory);
    const filename = path.basename(url);
    const filePath = path.join(dialogDirectory, filename.split('?')[0]);
    // проверяем, есть ли такой файл
    if (fs.existsSync(filePath)) {
      await Logger(`AlreadyExists ${url}`);
    }
    // загружаем фотку в папку temp
    await new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      https.get(url, (response) => {
        response.pipe(file);
        response.on("end", async () => {
          file.close();
          await Logger(`Downloaded ${filename}`);
          resolve();
        });
      }).on("error", (error) => {
        reject(error);
      });
    });
    // загружаем фотку в вк и очищаем память
    const photo = await uploadAndDeleteImage(filePath)
    //console.log(photo)
    try {
        //console.log({ attachment: attachmentStr });
        return photo
    } catch (e) {
        await Logger(`Произошла ошибка: ${e}`);
    }
    //await vk.api.messages.send({ peer_id: 463031671, random_id: 0, message: `тест`, attachment: attachmentStr } )
    return ''
}
async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await statAsync(dirPath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        await mkdirAsync(dirPath, { recursive: true });
      } else {
        throw err;
      }
    }
  }
  
async function uploadAndDeleteImage(filePath: any) {
    try {
        // Загрузка изображения в ВКонтакте
        const photo = await vk.upload.messagePhoto({ source: { value: `${filePath}` } });
        //console.log(photo)
        //console.log(`Uploaded image. Owner ID: ${owner_id}, Media ID: ${media_id}`);
        // Удаление файла после загрузки
        fs.unlinkSync(filePath);
        await Logger(`Deleted file: ${filePath}`);
        const attachment = photo;
        //console.log(context.attachments[0])
        const photoId = attachment.id;
        const ownerId = attachment.ownerId;
        // Формат для вложения
        const attachmentStr = `photo${ownerId}_${photoId}`;
        return attachmentStr
    } catch (error) {
        await Logger(`Error uploading image or deleting file: ${error}`);
        return ''
    }
}