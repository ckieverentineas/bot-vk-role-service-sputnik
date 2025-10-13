import { Keyboard } from "vk-io";
import { users_pk as global_users_pk } from "..";
import prisma from "./prisma"

const caller = '[club226323522|@sputnikbot]'

// Обновленная структура для хранения данных пользователя ПКметра
interface PkUserData {
  idvk: number;
  authorTexts: Map<number, string>;
  authorMessageCounts: Map<number, number>;
  authorSentenceCounts: Map<number, number>;
  mode: boolean;
  text: string;
}

// Интерфейс для настроек ПКметра
interface PkMeterSettings {
  single_chars: boolean;
  single_chars_no_spaces: boolean;
  single_words: boolean;
  single_pk: boolean;
  single_mb: boolean;
  single_sentences: boolean;
  single_post_percent: boolean;
  single_comment_percent: boolean;
  single_discussion_percent: boolean;
  multi_chars: boolean;
  multi_chars_no_spaces: boolean;
  multi_words: boolean;
  multi_pk: boolean;
  multi_mb: boolean;
  multi_sentences: boolean;
  multi_message_count: boolean;
  multi_sentence_count: boolean;
}

let users_pk: PkUserData[] = [];

export async function Counter_PK_Module(context: any) {
  // Инициализируем пользователя ПЕРВЫМ делом
  await User_Pk_Init(context);
  const id = await User_Pk_Get(context);

  if (id == null) { 
    return false; 
  }

  // ОБРАБОТКА ВСЕХ PAYLOAD КОМАНД
  if (await handleAllPayloadCommands(context)) {
    return true;
  }

  // ОБРАБОТКА PAYLOAD
  if (context.eventPayload) {
    const payload = context.eventPayload;
    
    // Обрабатываем ВСЕ команды настроек ПКметра
    if (payload.command && (
        payload.command.startsWith('pk_settings_') || 
        payload.command.startsWith('pk_toggle_') || 
        payload.command === 'activate_pk' || 
        payload.command === 'finish_pk' || 
        payload.command === 'reset_pk' || 
        payload.command === 'pk_settings_guide'
    )) {
      await handlePkSettingsPayload(context, payload.command);
      return true;
    }
  }

  // ОБРАБОТКА ТЕКСТОВЫХ КОМАНД И КНОПОК БЕЗ PAYLOAD
  if (context.text) {
    // Обрабатываем команду !пкнастройки
    if (context.text == `!пкнастройки` || context.text == `${caller} !пкнастройки`) {
      // Проверяем, не активен ли режим ПКметра
      if (users_pk[id].mode) {
        await context.send({
          message: `⚠️ Сначала завершите текущий замер ПК, нажав !кончить, затем настройте вывод статистики через !пкнастройки`,
          keyboard: Keyboard.builder()
            .textButton({ label: '!кончить', payload: { command: 'finish_pk' }, color: 'negative' }).row()
            .oneTime().inline()
        });
        return true;
      }
      await showPkSettingsMenu(context);
      return true;
    }

    if (context.text == `🚀 Космоинструкция` || context.text == `${caller} 🚀 Космоинструкция`) {
      await showPkGuide(context);
      return true;
    }

    // Обрабатываем текстовые нажатия на кнопки меню настроек
    const settings = await getUserPkSettings(context.senderId);
    
    // Главное меню настроек
    if (context.text == `👥 Для нескольких ролевиков`) {
      await showMultiSettingsMenu(context);
      return true;
    }
    
    if (context.text == `📊 Для одного ролевика`) {
      await showSingleSettingsMenu(context);
      return true;
    }
    
    if (context.text == `🔄 Сбросить к стандартным`) {
      await resetPkSettings(context.senderId);
      await context.send({
        message: '✅ Настройки ПКметра сброшены к стандартным',
        keyboard: Keyboard.builder()
          .textButton({ label: '!пкметр', payload: { command: 'activate_pk' }, color: 'positive' }).row()
          .textButton({ label: '!пкнастройки', payload: { command: 'pk_settings_main' }, color: 'primary' }).row()
          .oneTime().inline()
      });
      return true;
    }
    
    if (context.text == `❌ Отмена`) {
      await context.send({
        message: '❌ Настройки ПКметра отменены',
        keyboard: Keyboard.builder()
          .textButton({ label: '!пкметр', payload: { command: 'activate_pk' }, color: 'positive' }).row()
          .textButton({ label: '!спутник', payload: { command: 'sputnik_menu' }, color: 'primary' }).row()
          .oneTime().inline()
      });
      return true;
    }
    
    if (context.text == `🔙 Назад`) {
      await showPkSettingsMenu(context);
      return true;
    }

    if (context.text == `🚀 Космоинструкция` || context.text == `${caller} 🚀 Космоинструкция`) {
      await showPkGuide(context);
      return true;
    }

    // Обработка текстовых нажатий на кнопки переключения настроек
    if (context.text.startsWith('✅') || context.text.startsWith('❌')) {
      const text = context.text.replace(/[✅❌]/g, '').trim();
      
      // Для одного ролевика
      if (text === 'Символы') {
        await toggleSetting(context, 'single_chars');
        return true;
      }
      if (text === 'Симв. без пробелов') {
        await toggleSetting(context, 'single_chars_no_spaces');
        return true;
      }
      if (text === 'Слова') {
        await toggleSetting(context, 'single_words');
        return true;
      }
      if (text === 'ПК') {
        await toggleSetting(context, 'single_pk');
        return true;
      }
      if (text === 'МБ') {
        await toggleSetting(context, 'single_mb');
        return true;
      }
      if (text === 'Предложения') {
        await toggleSetting(context, 'single_sentences');
        return true;
      }
      if (text === '% Поста') {
        await toggleSetting(context, 'single_post_percent');
        return true;
      }
      if (text === '% Комментария') {
        await toggleSetting(context, 'single_comment_percent');
        return true;
      }
      if (text === '% Обсуждения') {
        await toggleSetting(context, 'single_discussion_percent');
        return true;
      }
      
      // Для нескольких ролевиков (тут махинации с английскими буквами)
      if (text === 'Кол-во сообщений') {
        await toggleSetting(context, 'multi_message_count');
        return true;
      }
      if (text === 'Симвoлы') {
        await toggleSetting(context, 'multi_chars');
        return true;
      }
      if (text === 'Симв. без прoбелов') {
        await toggleSetting(context, 'multi_chars_no_spaces');
        return true;
      }
      if (text === 'Слoва') {
        await toggleSetting(context, 'multi_words');
        return true;
      }
      if (text === 'Предлoжения') {
        await toggleSetting(context, 'multi_sentences');
        return true;
      }
      if (text === 'ПK') {
        await toggleSetting(context, 'multi_pk');
        return true;
      }
      if (text === 'MБ') {
        await toggleSetting(context, 'multi_mb');
        return true;
      }
    }

    // Обрабатываем остальные текстовые команды ПКметра
    if (context.text == `!пкметр` || context.text == `📐 Пкметр`) {
      users_pk[id].mode = true;
      users_pk[id].authorTexts = new Map();
      users_pk[id].authorMessageCounts = new Map();
      users_pk[id].authorSentenceCounts = new Map();
      users_pk[id].text = ``;
      await context.send({
        message: `✅ Активирован режим замера ПК. Вводите РП посты или любой другой текст длины, какая нужна вам! Когда закончите, нажмите !кончить, чтобы обнулить счет, нажмите !обнулить\n\n📨 Теперь работает и с пересланными сообщениями!\n\n⚙️ Для кастомизации вывода статистики используйте команду !пкнастройки (сначала завершите текущий замер, нажав !кончить)`,
        keyboard: Keyboard.builder()
          .textButton({ label: '!кончить', payload: { command: 'finish_pk' }, color: 'negative' }).row()
          .oneTime().inline()
      });
      return true;
    }

    if (context.text == `!обнулить` || context.text == `${caller} !обнулить`) {
      if (!users_pk[id].mode) {
        await context.send({
          message: `⚠️ Обнаружена космическая аномалия! Похоже, произошла ошибка или сервер был перезагружен.\n\nПожалуйста, вызовите !пкметр заново для инициализации матрицы подсчета.`,
          keyboard: Keyboard.builder()
            .textButton({ label: '!пкметр', payload: { command: 'activate_pk' }, color: 'positive' }).row()
            .oneTime().inline()
        });
        return true;
      }
      
      users_pk[id].authorTexts = new Map();
      users_pk[id].authorMessageCounts = new Map();
      users_pk[id].authorSentenceCounts = new Map();
      users_pk[id].text = ``;
      await context.send(`🗑 Обнулен счетчик режима замера ПК`);
      return true;
    }

    if (context.text == `!кончить` || context.text == `${caller} !кончить`) {
      if (!users_pk[id].mode) {
        await context.send({
          message: `⚠️ Обнаружена космическая аномалия! Похоже, произошла ошибка или сервер был перезагружен.\n\nПожалуйста, вызовите !пкметр заново для инициализации матрицы подсчета.`,
          keyboard: Keyboard.builder()
            .textButton({ label: '!пкметр', payload: { command: 'activate_pk' }, color: 'positive' }).row()
            .oneTime().inline()
        });
        return true;
      }
      
      users_pk[id].mode = false;
      users_pk[id].authorTexts = new Map();
      users_pk[id].authorMessageCounts = new Map();
      users_pk[id].authorSentenceCounts = new Map();
      users_pk[id].text = ``;
      await context.send({
        message: `⛔️ Обнулен и выключен режим замера ПК`,
        keyboard: Keyboard.builder()
          .textButton({ label: '!пкнастройки', payload: { command: 'pk_settings_main' }, color: 'primary' }).row()
          .textButton({ label: '!спутник', payload: { command: 'sputnik_menu' }, color: 'primary' }).row()
          .oneTime().inline()
      });
      return true;
    }
  }

  // Основная логика обработки сообщений в режиме ПКметра
  if (context.isOutbox == false && context.senderId > 0 && users_pk[id].mode) {
    let hasText = false;

    // 1. Обрабатываем текст самого сообщения
    if (context.text && typeof context.text === 'string' && context.text.trim().length > 0) {
      users_pk[id].text += context.text;
      addTextToAuthor(users_pk[id], context.senderId, context.text);
      incrementMessageCount(users_pk[id], context.senderId);
      hasText = true;
    }

    // 2. Обрабатываем пересланные сообщения
    if (context.hasForwards) {
      try {
        const messageInfo = await context.api.messages.getById({
          message_ids: [context.id],
          extended: 1
        });

        if (messageInfo.items && messageInfo.items[0]) {
          const mainMessage = messageInfo.items[0];
          const allForwardedMessages = extractAllForwardedMessages(mainMessage);
          
          for (const fwdMessage of allForwardedMessages) {
            if (fwdMessage.text && fwdMessage.text.trim().length > 0) {
              users_pk[id].text += fwdMessage.text;
              addTextToAuthor(users_pk[id], fwdMessage.from_id, fwdMessage.text);
              incrementMessageCount(users_pk[id], fwdMessage.from_id);
              hasText = true;
            }
          }
        }
      } catch (error) {
        // Fallback
        if (context.forwards && context.forwards.length > 0) {
          for (const forward of context.forwards) {
            if (forward.text && typeof forward.text === 'string' && forward.text.trim().length > 0) {
              users_pk[id].text += forward.text;
              addTextToAuthor(users_pk[id], forward.senderId, forward.text);
              incrementMessageCount(users_pk[id], forward.senderId);
              hasText = true;
            }
          }
        }
      }
    }

    // Если какой-то текст был собран, выводим статистику
    if (hasText) {
      await sendPkStatistics(context, users_pk[id]);
    }
    return true;
  }

  return false;
}

// ФУНКЦИЯ ДЛЯ ОБРАБОТКИ ВСЕХ PAYLOAD КОМАНД
async function handleAllPayloadCommands(context: any) {
  if (!context.eventPayload?.command) {
    return false;
  }
  
  const payload = context.eventPayload;
  
  // Обрабатываем команды ПКметра
  if (payload.command.startsWith('pk_') || 
      payload.command === 'activate_pk' || 
      payload.command === 'finish_pk' || 
      payload.command === 'reset_pk' ||
      payload.command === 'pk_settings_guide') {
    await handlePkSettingsPayload(context, payload.command);
    return true;
  }
  
  return false;
}

// Функция для увеличения счетчика сообщений
function incrementMessageCount(pkUserData: PkUserData, authorId: number) {
  const currentCount = pkUserData.authorMessageCounts.get(authorId) || 0;
  pkUserData.authorMessageCounts.set(authorId, currentCount + 1);
}

// Рекурсивная функция для извлечения ВСЕХ пересланных сообщений из цепочки
function extractAllForwardedMessages(message: any): any[] {
  const allMessages: any[] = [];
  
  if (message.fwd_messages && Array.isArray(message.fwd_messages)) {
    for (const fwdMsg of message.fwd_messages) {
      // Добавляем текущее пересланное сообщение
      allMessages.push(fwdMsg);
      
      // Рекурсивно добавляем вложенные пересланные сообщения
      if (fwdMsg.fwd_messages && fwdMsg.fwd_messages.length > 0) {
        const nestedMessages = extractAllForwardedMessages(fwdMsg);
        allMessages.push(...nestedMessages);
      }
    }
  }
  
  return allMessages;
}

// Функция для добавления текста к автору
function addTextToAuthor(pkUserData: PkUserData, authorId: number, text: string) {
  const currentText = pkUserData.authorTexts.get(authorId) || "";
  const newText = currentText + (currentText ? " " : "") + text.trim();
  pkUserData.authorTexts.set(authorId, newText);
  return newText.length;
}

// Обновленная функция для отправки статистики
async function sendPkStatistics(context: any, pkUserData: PkUserData) {
  const sentences = pkUserData.text.match(/[^.!?]+[.!?]+/g);
  const lines = sentences ? sentences.length : 0;

  // Получаем настройки пользователя
  const settings = await getUserPkSettings(context.senderId);
  
  // Определяем, сколько авторов
  const authorEntries = Array.from(pkUserData.authorTexts.entries());
  const isMultiAuthor = authorEntries.length > 1;
  
  // ОБЩАЯ СТАТИСТИКА
  let baseMessage = `🔎 Результаты анализа для [${sentences ? sentences[0] : ''} <--...--> ${sentences && sentences.length > 1 ? sentences[sentences.length-1] : ''}]:\n`;
  
  // Если несколько авторов, используем настройки для нескольких, иначе - для одного
  if (isMultiAuthor) {
    // Используем настройки для нескольких ролевиков в основной статистике
    const stats = [];
    
    if (settings.multi_chars) stats.push(`📝 Cимволов: ${pkUserData.text.length}`);
    if (settings.multi_chars_no_spaces) stats.push(`📝 Cимволов без пробелов: ${await countWords(pkUserData.text)}`);
    if (settings.multi_words) stats.push(`📝 Cлов: ${await countWords2(pkUserData.text)}`);
    if (settings.multi_sentences) stats.push(`📝 Предложений: ${lines}`);
    if (settings.multi_pk) stats.push(`💻 ПК: ${(pkUserData.text.length/102).toFixed(2)}`);
    if (settings.multi_mb) stats.push(`📱 МБ: ${(pkUserData.text.length/35).toFixed(2)}`);
    
    baseMessage += stats.join('\n');
  } else {
    // Используем настройки для одного ролевика
    const stats = [];
    
    if (settings.single_chars) stats.push(`📕 Cимволов: ${pkUserData.text.length}`);
    if (settings.single_chars_no_spaces) stats.push(`📙 Cимволов без пробелов: ${await countWords(pkUserData.text)}`);
    if (settings.single_words) stats.push(`📗 Cлов: ${await countWords2(pkUserData.text)}`);
    if (settings.single_pk) stats.push(`💻 ПК: ${(pkUserData.text.length/102).toFixed(2)}`);
    if (settings.single_mb) stats.push(`📱 МБ: ${(pkUserData.text.length/35).toFixed(2)}`);
    if (settings.single_sentences) stats.push(`✏️ Предложений: ${lines}`);
    if (settings.single_post_percent) stats.push(`📰 Пост: ${(pkUserData.text.length/16384*100).toFixed(2)}%`);
    if (settings.single_comment_percent) stats.push(`📧 Комментарий: ${(pkUserData.text.length/280*100).toFixed(2)}% / ${(pkUserData.text.length/16384*100).toFixed(2)}% (rec/max)`);
    if (settings.single_discussion_percent) stats.push(`💬 Обсуждение: ${(pkUserData.text.length/4096*100).toFixed(2)}%`);
    
    baseMessage += stats.join('\n');
  }

  // Статистика по авторам (если авторов больше одного)
  const authorStats = [];
  
  for (const [authorId, text] of authorEntries) {
    const wordCount = await countWords2(text);
    const authorSentences = text.match(/[^.!?]+[.!?]+/g);
    const messageCount = pkUserData.authorMessageCounts.get(authorId) || 0;
    const sentenceCount = authorSentences ? authorSentences.length : 0;
    
    authorStats.push({
      id: authorId,
      text: text,
      charCount: text.length,
      wordCount: wordCount,
      sentenceCount: sentenceCount,
      pk: (text.length/102).toFixed(2),
      mb: (text.length/35).toFixed(2),
      messageCount: messageCount
    });
  }

  if (isMultiAuthor) {
    baseMessage += `\n\n👥 СТАТИСТИКА ПО РОЛЕВИКАМ:\n`;
    
    // Собираем информацию об авторах с именами и фамилиями
    const authorLines = [];
    for (const author of authorStats) {
      try {
        const userInfo = await context.api.users.get({ user_ids: [author.id] });
        const userName = userInfo[0] ? 
          `[id${author.id}|${userInfo[0].first_name} ${userInfo[0].last_name}]` : 
          `id${author.id}`;
        
        // Собираем статистику для автора в зависимости от настроек
        const authorStatsLines = [];
        if (settings.multi_message_count) authorStatsLines.push(`   📨 Сообщений: ${author.messageCount}`);
        if (settings.multi_chars) authorStatsLines.push(`   📝 Символов: ${author.charCount}`);
        if (settings.multi_chars_no_spaces) authorStatsLines.push(`   📝 Символов без пробелов: ${await countWords(author.text)}`);
        if (settings.multi_words) authorStatsLines.push(`   📝 Слов: ${author.wordCount}`);
        if (settings.multi_sentences) authorStatsLines.push(`   📝 Предложений: ${author.sentenceCount}`);
        if (settings.multi_pk) authorStatsLines.push(`   💻 ПК: ${author.pk}`);
        if (settings.multi_mb) authorStatsLines.push(`   📱 МБ: ${author.mb}`);
        
        const authorLine = `👤 ${userName}:\n${authorStatsLines.join('\n')}\n`;
        authorLines.push(authorLine);
      } catch (error) {
        // Fallback
        const authorStatsLines = [];
        if (settings.multi_message_count) authorStatsLines.push(`   📨 Сообщений: ${author.messageCount}`);
        if (settings.multi_chars) authorStatsLines.push(`   📝 Символов: ${author.charCount}`);
        if (settings.multi_chars_no_spaces) authorStatsLines.push(`   📝 Символов без пробелов: ${await countWords(author.text)}`);
        if (settings.multi_words) authorStatsLines.push(`   📝 Слов: ${author.wordCount}`);
        if (settings.multi_sentences) authorStatsLines.push(`   📝 Предложений: ${author.sentenceCount}`);
        if (settings.multi_pk) authorStatsLines.push(`   💻 ПК: ${author.pk}`);
        if (settings.multi_mb) authorStatsLines.push(`   📱 МБ: ${author.mb}`);
        
        const authorLine = `👤 id${author.id}:\n${authorStatsLines.join('\n')}\n`;
        authorLines.push(authorLine);
      }
    }
    
    // Добавляем авторов к основному сообщению
    let fullMessage = baseMessage;
    for (const authorLine of authorLines) {
      const potentialMessage = fullMessage + '\n' + authorLine;
      if (potentialMessage.length > 4000) {
        await context.send(fullMessage + '\n\n... продолжение следует ...');
        fullMessage = authorLine;
      } else {
        fullMessage = potentialMessage;
      }
    }
    
    // Добавляем финальную строку и отправляем последнее сообщение с кнопками
    fullMessage += `\n📊 Всего ролевиков: ${authorStats.length}`;
    await context.send(fullMessage, {
      keyboard: Keyboard.builder()
        .textButton({ label: '!обнулить', payload: { command: 'reset_pk' }, color: 'positive' }).row()
        .textButton({ label: '!кончить', payload: { command: 'finish_pk' }, color: 'negative' }).row()
        .oneTime().inline(),
    });
    
  } else {
    // Если только один автор, отправляем базовую статистику
    await context.send(baseMessage, {
      keyboard: Keyboard.builder()
        .textButton({ label: '!обнулить', payload: { command: 'reset_pk' }, color: 'positive' }).row()
        .textButton({ label: '!кончить', payload: { command: 'finish_pk' }, color: 'negative' }).row()
        .oneTime().inline(),
    });
  }
}

// Функция показа меню настроек
async function showPkSettingsMenu(context: any) {
  await context.send({
    message: `⚙️ Настройки ПКметра\n\nВыберите, что хотите настроить:`,
    keyboard: Keyboard.builder()
      .textButton({ label: '📊 Для одного ролевика', payload: { command: 'pk_settings_single' }, color: 'primary' }).row()
      .textButton({ label: '👥 Для нескольких ролевиков', payload: { command: 'pk_settings_multi' }, color: 'primary' }).row()
      .textButton({ label: '🔄 Сбросить к стандартным', payload: { command: 'pk_settings_reset' }, color: 'secondary' }).row()
      .textButton({ label: '🚀 Космоинструкция', payload: { command: 'pk_settings_guide' }, color: 'secondary' }).row()
      .textButton({ label: '❌ Отмена', payload: { command: 'pk_settings_cancel' }, color: 'negative' }).row()
      .oneTime().inline()
  });
}

// Обработка нажатий на кнопки настроек
async function handlePkSettingsPayload(context: any, command: string) {
  console.log('handlePkSettingsPayload вызвана с командой:', command);
  const userId = context.senderId;
  
  // Убедимся, что пользователь инициализирован
  await User_Pk_Init(context);
  const id = await User_Pk_Get(context);
  
  try {
    switch (command) {
      case 'pk_settings_single':
        await showSingleSettingsMenu(context);
        break;
      case 'pk_settings_multi':
        await showMultiSettingsMenu(context);
        break;
      case 'pk_settings_reset':
        await resetPkSettings(userId);
        await context.send({
          message: '✅ Настройки ПКметра сброшены к стандартным',
          keyboard: Keyboard.builder()
            .textButton({ label: '!пкнастройки', payload: { command: 'pk_settings_main' }, color: 'primary' }).row()
            .oneTime().inline()
        });
        break;
      case 'pk_settings_cancel':
        await context.send({
          message: '❌ Настройки отменены',
          keyboard: Keyboard.builder()
            .textButton({ label: '!пкметр', payload: { command: 'activate_pk' }, color: 'positive' }).row()
            .textButton({ label: '!спутник', payload: { command: 'sputnik_menu' }, color: 'primary' }).row()
            .oneTime().inline()
        });
        break;
      case 'pk_toggle_single_chars':
        await toggleSetting(context, 'single_chars');
        break;
      case 'pk_toggle_single_chars_no_spaces':
        await toggleSetting(context, 'single_chars_no_spaces');
        break;
      case 'pk_toggle_single_words':
        await toggleSetting(context, 'single_words');
        break;
      case 'pk_toggle_single_pk':
        await toggleSetting(context, 'single_pk');
        break;
      case 'pk_toggle_single_mb':
        await toggleSetting(context, 'single_mb');
        break;
      case 'pk_toggle_single_sentences':
        await toggleSetting(context, 'single_sentences');
        break;
      case 'pk_toggle_single_post_percent':
        await toggleSetting(context, 'single_post_percent');
        break;
      case 'pk_toggle_single_comment_percent':
        await toggleSetting(context, 'single_comment_percent');
        break;
      case 'pk_toggle_single_discussion_percent':
        await toggleSetting(context, 'single_discussion_percent');
        break;
      case 'pk_toggle_multi_message_count':
        await toggleSetting(context, 'multi_message_count');
        break;
      case 'pk_toggle_multi_chars':
        await toggleSetting(context, 'multi_chars');
        break;
      case 'pk_toggle_multi_chars_no_spaces':
        await toggleSetting(context, 'multi_chars_no_spaces');
        break;
      case 'pk_toggle_multi_words':
        await toggleSetting(context, 'multi_words');
        break;
      case 'pk_toggle_multi_sentences':
        await toggleSetting(context, 'multi_sentences');
        break;
      case 'pk_toggle_multi_pk':
        await toggleSetting(context, 'multi_pk');
        break;
      case 'pk_toggle_multi_mb':
        await toggleSetting(context, 'multi_mb');
        break;
      case 'pk_settings_guide':
        await showPkGuide(context);
        break;
      case 'pk_settings_main':
        await showPkSettingsMenu(context);
        break;
      case 'pk_settings_back':
        await showPkSettingsMenu(context);
        break;
      case 'activate_pk':
        if (id !== null) {
          users_pk[id].mode = true;
          users_pk[id].authorTexts = new Map();
          users_pk[id].authorMessageCounts = new Map();
          users_pk[id].authorSentenceCounts = new Map();
          users_pk[id].text = ``;
          await context.send({
            message: `✅ Активирован режим замера ПК. Вводите РП посты или любой другой текст длины, какая нужна вам! Когда закончите, нажмите !кончить, чтобы обнулить счет, нажмите !обнулить\n\n📨 Теперь работает и с пересланными сообщениями!\n\n⚙️ Для кастомизации вывода статистики используйте команду !пкнастройки (сначала завершите текущий замер, нажав !кончить)`,
            keyboard: Keyboard.builder()
              .textButton({ label: '!кончить', payload: { command: 'finish_pk' }, color: 'negative' }).row()
              .textButton({ label: '!обнулить', payload: { command: 'reset_pk' }, color: 'secondary' }).row()
              .oneTime().inline()
          });
        }
        break;
      case 'finish_pk':
        if (id !== null && users_pk[id].mode) {
          users_pk[id].mode = false;
          users_pk[id].authorTexts = new Map();
          users_pk[id].authorMessageCounts = new Map();
          users_pk[id].authorSentenceCounts = new Map();
          users_pk[id].text = ``;
          await context.send({
            message: `⛔️ Обнулен и выключен режим замера ПК`,
            keyboard: Keyboard.builder()
              .textButton({ label: '!пкнастройки', payload: { command: 'pk_settings_main' }, color: 'primary' }).row()
              .textButton({ label: '!спутник', payload: { command: 'sputnik_menu' }, color: 'primary' }).row()
              .oneTime().inline()
          });
        } else {
          await context.send(`ℹ️ Режим ПКметра уже выключен`);
        }
        break;
      case 'reset_pk':
        if (id !== null && users_pk[id].mode) {
          users_pk[id].authorTexts = new Map();
          users_pk[id].authorMessageCounts = new Map();
          users_pk[id].authorSentenceCounts = new Map();
          users_pk[id].text = ``;
          await context.send(`🗑 Обнулен счетчик режима замера ПК`);
        } else {
          await context.send(`ℹ️ Сначала активируйте режим ПКметра`);
        }
        break;
      default:
        await context.send(`❌ Неизвестная команда: ${command}`);
    }
  } catch (error) {
    console.error(`Ошибка обработки команды ПКметра ${command}:`, error);
    await context.send(`❌ Произошла ошибка при обработке команды`);
  }
}

// Новая функция для показа инструкции
async function showPkGuide(context: any) {
  await context.send({
    message: `🚀 КОСМОИНСТРУКЦИЯ ПО ПКМЕТРУ

📡 ЧТО ТАКОЕ ПКМЕТР?
Изначально задумывался как сервис легкого подсчета компьютерных строчек в ролевых постах (отсюда и название), но теперь показывает любую статистику!

🛰 КАК ПОЛЬЗОВАТЬСЯ?
1. Жмете !пкметр — активируется режим замера
2. Присылаете следующим сообщением пост/текст (пишете, вставляете или пересылаете)
3. Моментально получаете статистику по вашим настройкам
4. Если нужно замерить следующий пост отдельно — жмете !обнулить и сразу вкидываете новый
5. !кончить — полностью выключает режим замера

⚡ ЧТО ЗА ПК и МБ?
• 💻 ПК — количество компьютерных строк в ваших ролевых постах (102 символа = 1 ПК)
• 📱 МБ — мобильные строки (35 символов = 1 МБ)

📊 ПРОЦЕНТЫ — ЭТО ЛИМИТЫ
• % Поста/Комментария/Обсуждения — показывает, сколько % от лимита вы использовали, т.е. влезет ли ваш пост в лимит, например, обсуждения
• 100% = достигнут лимит
• Меньше 100% = ваш пост влезет в формат
• Больше 100% = не влезет, нужно сокращать

👤 ДЛЯ 1 РОЛЕВИКА vs 👥 ДЛЯ НЕСКОЛЬКИХ
• Для 1 ролевика — когда скидываете пост одного человека
• Для нескольких — когда пересылаете цепочку с несколькими участниками (даже пересыл пересыла бот сожрет).
• Настройки можно выставлять разные для каждого режима, а можно — одинаковые!

🛸 ПОГРЕШНОСТИ
Небольшая погрешность (1-2%) — особенно при анализе пересланных сообщений с несколькими участниками — это нормально и связано с особенностями обработки данных.

💫 ВАШИ ИДЕИ
Есть идеи по улучшению? Пишите сюда (https://vk.com/topic-226040488_51594062) — ваши предложения могут быть реализованы!

🌌 ПОДДЕРЖАТЬ РАЗРАБОТКУ
Спутник летает на чистом энтузиазме, но даже космические аппараты нуждаются в заправке. Хотите, чтобы бот не склеил пиксели от недофинансирования? Поддержите разработку! Донатеры получают:
• Доступ к 2 дополнительным режимам поиска соролевиков
• Возможность прикладывать произвольное сообщение к отклику на анкету

💳 Найти кнопку доната можно в группе Спутника или написать разработчику (указан в контактах группы) напрямую.`,

    keyboard: Keyboard.builder()
      .textButton({ label: '🔙 Назад', payload: { command: 'pk_settings_back' }, color: 'secondary' }).row()
      .oneTime().inline()
  });
}

// Меню настроек для одного ролевика
async function showSingleSettingsMenu(context: any) {
  const settings = await getUserPkSettings(context.senderId);
  
  await context.send({
    message: `⚙️ Настройки для ОДНОГО ролевика\n\nВыберите, что показывать в статистике:`,
    keyboard: Keyboard.builder()
      .textButton({ 
        label: `${settings.single_chars ? '✅' : '❌'} Символы`, 
        payload: { command: 'pk_toggle_single_chars' }, 
        color: settings.single_chars ? 'positive' : 'negative' 
      })
      .textButton({ 
        label: `${settings.single_chars_no_spaces ? '✅' : '❌'} Симв. без пробелов`, 
        payload: { command: 'pk_toggle_single_chars_no_spaces' }, 
        color: settings.single_chars_no_spaces ? 'positive' : 'negative' 
      }).row()
      .textButton({ 
        label: `${settings.single_words ? '✅' : '❌'} Слова`, 
        payload: { command: 'pk_toggle_single_words' }, 
        color: settings.single_words ? 'positive' : 'negative' 
      })
      .textButton({ 
        label: `${settings.single_sentences ? '✅' : '❌'} Предложения`, 
        payload: { command: 'pk_toggle_single_sentences' }, 
        color: settings.single_sentences ? 'positive' : 'negative' 
      }).row()
      .textButton({ 
        label: `${settings.single_mb ? '✅' : '❌'} МБ`, 
        payload: { command: 'pk_toggle_single_mb' }, 
        color: settings.single_mb ? 'positive' : 'negative' 
      })
      .textButton({ 
        label: `${settings.single_pk ? '✅' : '❌'} ПК`, 
        payload: { command: 'pk_toggle_single_pk' }, 
        color: settings.single_pk ? 'positive' : 'negative' 
      }).row()
      .textButton({ 
        label: `${settings.single_post_percent ? '✅' : '❌'} % Поста`, 
        payload: { command: 'pk_toggle_single_post_percent' }, 
        color: settings.single_post_percent ? 'positive' : 'negative' 
      })
      .textButton({ 
        label: `${settings.single_comment_percent ? '✅' : '❌'} % Комментария`, 
        payload: { command: 'pk_toggle_single_comment_percent' }, 
        color: settings.single_comment_percent ? 'positive' : 'negative' 
      }).row()
      .textButton({ 
        label: `${settings.single_discussion_percent ? '✅' : '❌'} % Обсуждения`, 
        payload: { command: 'pk_toggle_single_discussion_percent' }, 
        color: settings.single_discussion_percent ? 'positive' : 'negative' 
      })
      .textButton({ label: '🔙 Назад', payload: { command: 'pk_settings_back' }, color: 'secondary' }).row()
      .oneTime().inline()
  });
}

// Меню настроек для нескольких ролевиков (снова фокусы)
async function showMultiSettingsMenu(context: any) {
  const settings = await getUserPkSettings(context.senderId);
  
  await context.send({
    message: `⚙️ Настройки для НЕСКОЛЬКИХ ролевиков\n\nВыберите, что показывать в статистике:`,
    keyboard: Keyboard.builder()
      .textButton({ 
        label: `${settings.multi_chars ? '✅' : '❌'} Симвoлы`, 
        payload: { command: 'pk_toggle_multi_chars' }, 
        color: settings.multi_chars ? 'positive' : 'negative' 
      })
      .textButton({ 
        label: `${settings.multi_chars_no_spaces ? '✅' : '❌'} Симв. без прoбелов`, 
        payload: { command: 'pk_toggle_multi_chars_no_spaces' }, 
        color: settings.multi_chars_no_spaces ? 'positive' : 'negative' 
      }).row()
      .textButton({ 
        label: `${settings.multi_words ? '✅' : '❌'} Слoва`, 
        payload: { command: 'pk_toggle_multi_words' }, 
        color: settings.multi_words ? 'positive' : 'negative' 
      })
      .textButton({ 
        label: `${settings.multi_sentences ? '✅' : '❌'} Предлoжения`, 
        payload: { command: 'pk_toggle_multi_sentences' }, 
        color: settings.multi_sentences ? 'positive' : 'negative' 
      }).row()
      .textButton({ 
        label: `${settings.multi_mb ? '✅' : '❌'} MБ`, 
        payload: { command: 'pk_toggle_multi_mb' }, 
        color: settings.multi_mb ? 'positive' : 'negative' 
      })
      .textButton({ 
        label: `${settings.multi_pk ? '✅' : '❌'} ПK`, 
        payload: { command: 'pk_toggle_multi_pk' }, 
        color: settings.multi_pk ? 'positive' : 'negative' 
      }).row()
      .textButton({ 
        label: `${settings.multi_message_count ? '✅' : '❌'} Кол-во сообщений`, 
        payload: { command: 'pk_toggle_multi_message_count' }, 
        color: settings.multi_message_count ? 'positive' : 'negative' 
      })
      .textButton({ label: '🔙 Назад', payload: { command: 'pk_settings_back' }, color: 'secondary' }).row()
      .oneTime().inline()
  });
}

// Функция переключения настроек
async function toggleSetting(context: any, settingName: keyof PkMeterSettings) {
  const userId = context.senderId;
  
  try {
    // Сначала находим аккаунт пользователя
    const account = await prisma.account.findFirst({
      where: { idvk: userId }
    });

    if (!account) {
      await context.send(`❌ Ошибка: аккаунт не найден`);
      return;
    }

    // Получаем текущие настройки
    const currentSettings = await getUserPkSettings(userId);
    const newValue = !currentSettings[settingName];
    
    // Обновляем настройки через upsert
    await prisma.pkMeterSettings.upsert({
      where: { id_account: account.id },
      update: { [settingName]: newValue },
      create: {
        id_account: account.id,
        single_chars: true,
        single_chars_no_spaces: true,
        single_words: true,
        single_pk: true,
        single_mb: true,
        single_sentences: true,
        single_post_percent: true,
        single_comment_percent: true,
        single_discussion_percent: true,
        multi_chars: true,
        multi_chars_no_spaces: true,
        multi_words: true,
        multi_pk: true,
        multi_mb: true,
        multi_sentences: true,
        multi_message_count: true,
        multi_sentence_count: true,
        [settingName]: newValue
      }
    });
    
    // Определяем, в каком меню находимся и показываем его снова
    if (settingName.startsWith('single_')) {
      await showSingleSettingsMenu(context);
    } else if (settingName.startsWith('multi_')) {
      await showMultiSettingsMenu(context);
    }
    
  } catch (error) {
    console.error(`Ошибка переключения настройки ${settingName}:`, error);
    await context.send(`❌ Произошла ошибка при обновлении настройки`);
  }
}

// Получение настроек пользователя
async function getUserPkSettings(userId: number): Promise<PkMeterSettings> {
  try {
    // Сначала находим аккаунт пользователя
    const account = await prisma.account.findFirst({
      where: { idvk: userId }
    });

    if (!account) {
      return getDefaultPkSettings();
    }

    // Получаем настройки из базы
    let settings = await prisma.pkMeterSettings.findUnique({
      where: { id_account: account.id }
    });
    
    if (!settings) {
      settings = await prisma.pkMeterSettings.create({
        data: {
          id_account: account.id,
          single_chars: true,
          single_chars_no_spaces: true,
          single_words: true,
          single_pk: true,
          single_mb: true,
          single_sentences: true,
          single_post_percent: true,
          single_comment_percent: true,
          single_discussion_percent: true,
          multi_chars: true,
          multi_chars_no_spaces: true,
          multi_words: true,
          multi_pk: true,
          multi_mb: true,
          multi_sentences: true,
          multi_message_count: true,
          multi_sentence_count: true,
        }
      });
    }
    
    return settings;
  } catch (error) {
    console.error('Ошибка получения настроек ПКметра:', error);
    return getDefaultPkSettings();
  }
}

// Функция для получения настроек по умолчанию
function getDefaultPkSettings(): PkMeterSettings {
  return {
    single_chars: true,
    single_chars_no_spaces: true,
    single_words: true,
    single_pk: true,
    single_mb: true,
    single_sentences: true,
    single_post_percent: true,
    single_comment_percent: true,
    single_discussion_percent: true,
    multi_chars: true,
    multi_chars_no_spaces: true,
    multi_words: true,
    multi_pk: true,
    multi_mb: true,
    multi_sentences: true,
    multi_message_count: true,
    multi_sentence_count: true,
  };
}

// Сброс настроек к стандартным
async function resetPkSettings(userId: number) {
  try {
    // Сначала находим аккаунт пользователя
    const account = await prisma.account.findFirst({
      where: { idvk: userId }
    });

    if (!account) {
      return;
    }

    await prisma.pkMeterSettings.upsert({
      where: { id_account: account.id },
      update: getDefaultPkSettings(),
      create: {
        id_account: account.id,
        ...getDefaultPkSettings()
      }
    });
  } catch (error) {
    console.error('Ошибка сброса настроек ПКметра:', error);
    throw error;
  }
}

// Вспомогательные функции для подсчета
async function countWords(text: string) {
  return text.replace(/\s+/g, '').length;
}

async function countWords2(text: string) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Функции для работы с пользователями ПКметра
async function User_Pk_Init(context: any) {
  const id = await User_Pk_Get(context);
  if (id == null) {
    users_pk.push({
      idvk: context.senderId,
      authorTexts: new Map(),
      authorMessageCounts: new Map(),
      authorSentenceCounts: new Map(),
      mode: false,
      text: ''
    });
  }
}

async function User_Pk_Get(context: any) {
  for (let i = 0; i < users_pk.length; i++) {
    if (users_pk[i].idvk == context.senderId) {
      return i;
    }
  }
  return null;
}

export { users_pk };
