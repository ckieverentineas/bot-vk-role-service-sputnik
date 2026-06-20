import { Attachment, Keyboard, KeyboardBuilder, PhotoAttachment, VK } from "vk-io";
import { answerTimeLimit, chat_id, group_id, root, starting_date, timer_text, vk } from "..";
import { Account, Blank } from "@prisma/client";
import prisma from "./prisma";
import { compareTwoStrings } from "string-similarity";
import { DamerauLevenshteinDistance, DiceCoefficient, JaroWinklerDistance, LevenshteinDistance } from "natural";
import * as fs from 'fs/promises';
import { ico_list } from "./icon_list";
import { tag_list } from "./datacenter/tag";

export function Sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
//автополучение идвк группы
export async function Group_Id_Get(token: string) {
    //console.log(`Вычисляем ид группы`)
	const vk = new VK({ token: token, apiLimit: 1 });
	const [group] = await vk.api.groups.getById(vk);
	const groupId = group.id;
	return groupId
}
export async function User_Id_Get(token: string) {
	const vk = new VK({ token: token, apiLimit: 1 });
	const [user] = await vk.api.users.get(vk);
	const groupId = user.id;
	return groupId
}

export async function Fixed_Number_To_Five(num: number) {
    let res = 0
    res = num < 5 ? 0 : Math.floor(num / 5) * 5
    //console.log(`${num} --> ${res}`)
	return res
}
export async function Worker_Checker() {
    await vk.api.messages.send({
        peer_id: chat_id,
        random_id: 0,
        message: `✅ Все ок! ${await Up_Time()}\n🗿 Поставьте здесь свою реакцию о том, как прошел ваш день!`,
    })
}

async function Up_Time() {
    const now = new Date();
    const diff = now.getTime() - starting_date.getTime();
    const timeUnits = [
        { unit: "дней", value: Math.floor(diff / 1000 / 60 / 60 / 24) },
        { unit: "часов", value: Math.floor((diff / 1000 / 60 / 60) % 24) },
        { unit: "минут", value: Math.floor((diff / 1000 / 60) % 60) },
        { unit: "секунд", value: Math.floor((diff / 1000) % 60) },
    ];
    return `Время работы: ${timeUnits.filter(({ value }) => value > 0).map(({ unit, value }) => `${value} ${unit}`).join(" ")}`
}

export async function Logger(text: String) {
    const project_name = `Sputnik`
    /*const options = {
        era: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };*/
    console.log(`[${project_name}] --> ${text} <-- (${new Date().toLocaleString("ru"/*, options*/)})`)
}

export async function Send_Message(idvk: number, message: string, keyboard?: Keyboard, attachment?: string) {
    message = message ? message : 'invalid message'
    try {
        if (!attachment && !keyboard) { await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}` } ) }
        if (attachment && !keyboard) { await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}`, attachment: attachment } ) }
        if (!attachment && keyboard) { await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}`, keyboard: keyboard } ) }
        if (attachment && keyboard) { await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}`, keyboard: keyboard, attachment: attachment } ) }
    } catch (e) {
        await Logger(`Ошибка отправки сообщения: ${e}`)
    }
}
export async function Edit_Message(context: any, message: string, keyboard?: Keyboard, attached?: PhotoAttachment | null) {
    message = message ? message : 'invalid message'
    try {
        if (keyboard && attached) {
            await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${message}`, keyboard: keyboard, attachment: attached.toString()})
        }
        if (!keyboard && attached) {
            await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${message}`, attachment: attached.toString()})
        }
        if (keyboard && !attached) {
            await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${message}`, keyboard: keyboard})
        }
        if (!keyboard && !attached) {
            await vk.api.messages.edit({peer_id: context.peerId, conversation_message_id: context.conversationMessageId, message: `${message}`})
        }
    } catch (e) {
        const err = `⚠ Ошибка редактирования сообщения, попробуйте через 1-15 минут, в зависимости от ошибки: ${e}`
        await Logger(`Ошибка редактирования сообщения, попробуйте через 1-15 минут, в зависимости от ошибки: ${e}`)
        try {
            await vk.api.messages.send({
                peer_id: context.senderId ?? context.peerId,
                random_id: 0,
                message: err.slice(0,250)
            })
        } catch {
            await Logger(`Ошибка редактирования сообщения в квадрате: ${e}`)
        }
        
    }
}
export async function Confirm_User_Success(context: any, text: string) {
    let res = { status: false, text: `` }
    const confirmq: any = await context.question(`⁉ Вы уверены, что хотите ${text}`,
        {
            keyboard: Keyboard.builder()
            .textButton({ label: 'Да', payload: { command: 'confirm' }, color: 'secondary' })
            .textButton({ label: 'Нет', payload: { command: 'not' }, color: 'secondary' })
            .oneTime().inline(),
            answerTimeLimit
        }
    )
    if (confirmq.isTimeout) { return await context.send(`⏰ Время ожидания на подтверждение операции ${text} истекло!`) }
    if (confirmq?.payload?.command === 'confirm') {
        res.status = true
        res.text = `✅ Success agree: ${text}`
    } else {
        res.text = `🚫 Success denied: ${text}`
    }
    return res
}

export async function Carusel_Selector(context: any, data: { message_title: string, menu: Array<any>, smile: string, name: string, title: string }) {
    const ans = { id: null, status: false }
    let carusel_work = true
    let id_builder_sent = 0
    while (carusel_work) {
        const keyboard = new KeyboardBuilder()
        id_builder_sent = await Fixed_Number_To_Five(id_builder_sent)
        let event_logger = `❄ ${data.message_title}:\n\n`
        const builder_list: Array<any> = data.menu
        if (builder_list.length > 0) {
            const limiter = 5
            let counter = 0
            for (let i=id_builder_sent; i < builder_list.length && counter < limiter; i++) {
                const builder = builder_list[i]
                keyboard.textButton({ label: `${builder[data.smile]} №${i}-${builder[data.name].slice(0,30)}`, payload: { command: 'builder_control', id_builder_sent: i, target: builder.id }, color: 'secondary' }).row()
                event_logger += `\n\n🔒 ${data.title} №${i} <--\n📜 ID: ${builder.id}\n${builder[data.smile]} Название: ${builder[data.name]}`
                counter++
            }
            event_logger += `\n\n${builder_list.length > 1 ? `~~~~ ${builder_list.length > limiter ? id_builder_sent+limiter : limiter-(builder_list.length-id_builder_sent)} из ${builder_list.length} ~~~~` : ''}`
            //предыдущие ролевые
            if (builder_list.length > limiter && id_builder_sent > limiter-1 ) {
                keyboard.textButton({ label: '←', payload: { command: 'builder_control_multi', id_builder_sent: id_builder_sent-limiter}, color: 'secondary' })
            }
            //следующие ролевые
            if (builder_list.length > limiter && id_builder_sent < builder_list.length-limiter) {
                keyboard.textButton({ label: '→', payload: { command: 'builder_control_multi', id_builder_sent: id_builder_sent+limiter }, color: 'secondary' })
            }
        } else {
            event_logger = `⚠ [${data.title}] пока что нет...`
            carusel_work = false
            continue
        }
        const answer1: any = await context.question(`${event_logger}`, { keyboard: keyboard.inline(), answerTimeLimit })
        if (answer1.isTimeout) { return await context.send(`⏰ Время ожидания выбора [${data.title}] истекло!`) }
		if (!answer1.payload) {
			await context.send(`💡 Жмите только по кнопкам с иконками!`)
		} else {
            if (answer1.text == '→' || answer1.text =='←') {
                id_builder_sent = answer1.payload.id_builder_sent
            } else {
                ans.id = answer1.payload.target
                ans.status = true
                carusel_work = false
            }
		}
    }
    return ans
}

export async function Accessed(context: any) {
    const user: Account | null | undefined = await prisma.account.findFirst({ where: { idvk: context.senderId } })
    if (!user) { return }
    const config: any = {
        "1": `user`,
        "2": `admin`,
        "3": `root`
    }
    const role = config[user.id_role.toString()]
    return role
}

export async function Keyboard_Index(context: any, messa: any) {
    const user_check: Account | null | undefined = await prisma.account.findFirst({ where: { idvk: context.senderId } })
    if (!user_check) { return }
    const keyboard = new KeyboardBuilder()
    if (await Accessed(context) != `user`) {
        keyboard.textButton({ label: '!права', payload: { command: 'sliz' }, color: 'negative' }).row()
        keyboard.textButton({ label: '!бан', payload: { command: 'sliz' }, color: 'negative' }).row()
        keyboard.textButton({ label: '!донатер', payload: { command: 'sliz' }, color: 'negative' }).row()
    } 
    keyboard.textButton({ label: '!спутник', payload: { command: 'sliz' }, color: 'positive' }).row().oneTime()
    // Отправляем клавиатуру без сообщения
    try {
        await vk.api.messages.send({ peer_id: context.senderId, random_id: 0, message: `${messa}\u00A0`, keyboard: keyboard })
        .then(async (response: any) => { 
            await Sleep(1000)
            return await vk.api.messages.delete({ message_ids: [response], delete_for_all: 1 }) })
        .then(async () => { await Logger(`(private chat) ~ succes get keyboard is viewed by <user> №${context.senderId}`) })
        .catch(async (error) => { await Logger(`User ${context.senderId} fail get keyboard: ${error}`) });
    } catch (e) {
        await Logger(`User ${context.senderId} fail get keyboard second: ${e}`)
    }
}

export async function User_Info(context: any) {
    let [userData]= await vk.api.users.get({user_id: context.senderId});
    return userData
}

export async function Chat_Cleaner(context: any) {
    if (context.peerType == 'chat') { 
		/*try { 
			await vk.api.messages.delete({'peer_id': context.peerId, 'delete_for_all': 1, 'cmids': context.conversationMessageId, 'group_id': group_id})
			await Logger(`(public chat) ~ received a message from the <user> #${context.senderId} and was deleted by <system> №0`)
		} catch (error) { 
			await Logger(`(public chat) ~ received a message from the <user> #${context.senderId} and wasn't deleted by <system> №0`)
		}  */
		return true
	}
    return false
}
export interface Match {
    id: number,
    text: string,
    id_account: number,
    score: number
}
// Функция для поиска наилучшего совпадения для каждого предложения в query в массиве вопросов sentences
export async function Researcher_Better_Blank(query: string, sentences: Blank[]): Promise<Match[]> {
    const matches: Match[] = (await Promise.all(sentences.map(async (sentence) => {
        /*const jaroWinklerScore = JaroWinklerDistance(query_question, sentence.text, {});
        //const levenshteinScore = 1 / (levenshteinDistance(query_question, sentence.text) + 1);
        const cosineScore = compareTwoStrings(query_question, sentence.text);
        const score = (cosineScore*2 + jaroWinklerScore)/3;*/
        //const jaroWinklerScore = JaroWinklerDistance(sentence.text, query_question, {});
        //const levenshteinScore = 1 / (levenshteinDistance(sentence.text, query_question) + 1);
        //const levenshteinScore2 = 1 / (LevenshteinDistance(sentence.text, query_question) + 1)
        //const damer = 1 / (DamerauLevenshteinDistance(sentence.text, query_question) + 1);
        const cosineScore = compareTwoStrings(sentence.text, query);
        const diceCoefficient = DiceCoefficient(sentence.text, query)
        const score = (cosineScore*2/* + jaroWinklerScore/2 */+ diceCoefficient*2)/4;
        //console.log({ question: sentence, score: score, message: query_question, cosineScore, diceCoefficient })
        return { id: sentence.id, text: sentence.text, id_account: sentence.id_account, score: score };
    }))).filter((q): q is { id: number, text: string, id_account: number, score: number } => q !== undefined);
    return matches.sort((a, b) => b.score - a.score);
}
export async function Researcher_Better_Blank_Target_Old(query: string, sentence: Blank): Promise<Match> {
    //const jaroWinklerScore = JaroWinklerDistance(query, sentence.text, {});
    const cosineScore = compareTwoStrings(query, sentence.text);
    const diceCoefficient = DiceCoefficient(query, sentence.text)
    const cosineScorePro = cosineSimilarity(sentence.text, query)
    //const score = (cosineScore*2/* + jaroWinklerScore/2 */+ diceCoefficient*2)/4;
    const score = (cosineScorePro/2 + cosineScore/2 + diceCoefficient)/2
    //const datsd = { score: score, cosineScore, diceCoefficient, cosineScorePro}
    //fs.appendFile("file.txt", `Моя анкета: [${query}]\r\n Анкета другого: ${sentence.text}\n${JSON.stringify(datsd)}\n\n`);
    return { id: sentence.id, text: sentence.text, id_account: sentence.id_account, score: score };
}

function cosineSimilarity(str1: string, str2: string): number {
    const getWordFrequency = (str: string) => {
        const words = str.split(' ');
        const wordCount: { [word: string]: number } = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        return wordCount;
    };

    const vector1 = getWordFrequency(str1);
    const vector2 = getWordFrequency(str2);

    const keys = Array.from(new Set([...Object.keys(vector1), ...Object.keys(vector2)]));

    const dotProduct = keys.reduce((acc, word) => acc + (vector1[word] || 0) * (vector2[word] || 0), 0);
    const magnitude1 = Math.sqrt(keys.reduce((acc, word) => acc + (vector1[word] || 0) ** 2, 0));
    const magnitude2 = Math.sqrt(keys.reduce((acc, word) => acc + (vector2[word] || 0) ** 2, 0));

    return dotProduct / (magnitude1 * magnitude2);
}

export async function Online_Set(context: any) {
    const user = await prisma.account.findFirst({ where: { idvk: context.senderId } })
    if (user) {
        const user_online = await prisma.account.update({ where: { id: user.id }, data: { online: new Date() } })
        //await Logger(`(online) ~ change online from ${user.online} on ${user_online.online} for <user> №${context.senderId}`)
    }
}

export async function Blank_Inactivity() {
    const datenow: any = new Date()
    const timeouter = 2592000000 //месяц
    const timeouter_warn = 2592000000-86400000 //29 дней
    await Logger(`(system) ~ starting clear blanks inactivity by <system> №0`)
    for (const blank of await prisma.blank.findMany({})) {
        const online_check = await prisma.account.findFirst({ where: { id: blank.id_account } })
        if (!online_check) { continue }
        const dateold: any = new Date(online_check.online)
        if (datenow-dateold > timeouter_warn && datenow-dateold < timeouter) {
            await Sleep(Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000)
            await Send_Message(online_check.idvk, `⚠ Вы были оффлайн больше 29 дней, ваша анкета №${blank.id} будет снята с поиска завтра!`)
            continue
        }
        if (datenow-dateold > timeouter) {
            await Sleep(Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000)
            const blank_del = await prisma.blank.delete({ where: { id: blank.id } })
            if (!blank_del) { continue }
            await Send_Message(online_check.idvk, `⛔ Вы были оффлайн больше месяца, ваша анкета №${blank.id} удалена! Вот ее содержание:\n\n${blank.text}\n\n⚠ Если вы все еще ищете сорола, то опубликуйте новую анкету`)
            await Send_Message(chat_id, `⚠ Анкета №${blank.id} изъята из поиска из-за неактивности клиента.`)
        }
    }
    await Logger(`(system) ~ complete clear blanks inactivity by <system> №0`)
}

/*export async function Parser_IDVK(mention: string): Promise<string | false> {
    const regex = /(?<=id)[0-9]+|(?<=vk.com\/)[a-zA-Z0-9_]+/g;
    const match = mention.match(regex);

    if (match) {
        // Если найдено совпадение, возвращаем ID пользователя
        return match[0];
    }

    return false; // Если совпадений не найдено
}*/
export async function Parser_IDVK(mention: string): Promise<string | false> {
    const regex = /(?<=id)[0-9]+|(?<=vk\.com\/)([a-zA-Z0-9_.]+)/g; // Добавлен '.' в регулярное выражение
    const match = mention.match(regex);

    if (match) {
        const identifier = match[0];

        // Проверяем, является ли идентификатор числом (ID) или текстом (имя пользователя)
        if (!isNaN(Number(identifier))) {
            return identifier; // Если это ID, просто возвращаем его
        } else {
            try {
                const user = await vk.api.users.get({ user_id: identifier });
                return user.length > 0 ? user[0].id.toString() : false; // Возвращаем ID пользователя
            } catch {
                return false; // Если пользователь не найден, возвращаем false
            }
        }
    }

    return false; // Если совпадений не найдено
}

export async function User_Banned(context: any) {
    const user = await prisma.account.findFirst({ where: { idvk: context.senderId } })
    if (!user) { return false }
    if (user.banned) { return true }
    return false
}

export async function Exiter(context: any) {
    const text = `🧹 Здесь было сообщение от Спутника.`
    await Edit_Message(context, text)
    await vk.api.messages.sendMessageEventAnswer({
        event_id: context.eventId,
        user_id: context.userId,
        peer_id: context.peerId,
        event_data: JSON.stringify({
            type: "show_snackbar",
            text: "🔔 Выход из системы успешно завершен!"
        })
    })
}



export async function Input_Number(context: any, prompt: string, float: boolean, limit?: number) {
    limit = limit ?? 300
    let input_tr = false
    let input = 0
	while (input_tr == false) {
		const name = await context.question( `${ico_list['attach'].ico} ${prompt}\n\n${ico_list['warn'].ico} Допустимый лимит символов: ${limit}`, timer_text)
		if (name.isTimeout) { await context.send(`${ico_list['time'].ico} Время ожидания ввода истекло!`); return false }
		if (name.text.length <= limit && name.text.length > 0) {
            const confirma = await context.question( `${ico_list['question'].ico} Вы ввели: ${name.text}\n Вы уверены?`, {	
				keyboard: Keyboard.builder()
				.textButton({ label: `${ico_list['success'].ico} Да`, color: 'positive' })
				.textButton({ label: `${ico_list['cancel'].ico} Нет`, color: 'negative' }).row()
                .textButton({ label: `${ico_list['cancel'].ico} Назад`, color: 'primary' })
				.oneTime().inline(), answerTimeLimit
			})
		    if (confirma.isTimeout) { await context.send(`${ico_list['time'].ico} Время ожидания подтверждения ввода истекло!`); return false }
            if (confirma.text == `${ico_list['success'].ico} Да`) {
                if (typeof Number(name.text) === "number") {
                    const inputer = float ? Number(name.text) : Math.floor(Number(name.text))
                    if (inputer < 0) {
                        await context.send(`${ico_list['warn'].ico} Введите положительное число!`);
                        continue
                    }
                    if (Number.isNaN(inputer)) {
                        await context.send(`${ico_list['warn'].ico} Не, ну реально, ты дурак/дура или как? Число напиши нафиг!`);
                        continue
                    }
                    input = inputer
                    input_tr = true
                } else {
                    await context.send(`${ico_list['warn'].ico} Необходимо ввести число!`);
                    continue
                }
                
            } else {
                if (confirma.text == `${ico_list['cancel'].ico} Назад`) { await context.send(`${ico_list['cancel'].ico} Ввод прерван пользователем`); return false }
                continue
            }
		} else { 
            await context.send(`${ico_list['warn'].ico} Вы превысили лимит символов: ${name.text.length}/${limit}`)
        }
	}
    return input
}

export async function Reset_Sniper_Limits() {
    try {
        const now = new Date();
        const mskTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
        
        // Сбрасываем лимиты в 00:00 по МСК
        if (mskTime.getHours() === 0 && mskTime.getMinutes() === 0) {
            await Logger(`(system) ~ resetting sniper limits by <system> №0`)
            
            // Удаляем все записи об использовании снайпера
            const result = await prisma.sniperUsage.deleteMany({});
            
            await Logger(`(system) ~ deleted ${result.count} sniper usage records by <system> №0`)
            
            // Ждем 1 минуту чтобы не сбрасывать несколько раз за одну минуту
            await Sleep(60000);
        }
    } catch (error) {
        await Logger(`(system) ~ error resetting sniper limits: ${error}`)
    }
}

export const checkGroupSubscriber = async (userId: any, groupId: any) => {
    return await vk.api.groups.isMember({ group_id: groupId, user_id: userId }) === 1;
};

export async function isAgeVerified(userId: number): Promise<boolean> {
    const user = await prisma.account.findFirst({
        where: { idvk: userId }
    });
    if (!user) return false;
    return user.age_verified || false;
}

export async function getTagsForBlank(blankId: number): Promise<string> {
    const blank = await prisma.blank.findFirst({
        where: { id: blankId }
    });
    
    if (!blank || !blank.tag) return '';
    
    try {
        const tagIds = JSON.parse(blank.tag);
        if (!Array.isArray(tagIds) || tagIds.length === 0) return '';
        
        const { tag_categories } = require('./datacenter/tag_categories');
        
        // Создаем порядок тегов на основе категорий
        const categoryOrder: number[] = [];
        for (const category of tag_categories) {
            for (const tagId of category.tags) {
                if (!categoryOrder.includes(tagId)) {
                    categoryOrder.push(tagId);
                }
            }
        }

        // Находим позицию #романтика (17)
        const romanceIndex = categoryOrder.indexOf(17);
        if (romanceIndex !== -1) {
            // Вставляем подвиды романтики после #романтика
            const subtypes = [40, 41, 42]; // #гет, #яой, #юри
            // Удаляем их из категорий, если они там есть
            for (const subtype of subtypes) {
                const idx = categoryOrder.indexOf(subtype);
                if (idx !== -1) {
                    categoryOrder.splice(idx, 1);
                }
                // Вставляем после #романтика
                categoryOrder.splice(romanceIndex + 1, 0, subtype);
            }
        }
        
        // Сортируем ID тегов по порядку в категориях
        const sortedTagIds = tagIds.sort((a: number, b: number) => {
            const indexA = categoryOrder.indexOf(a);
            const indexB = categoryOrder.indexOf(b);
            // Если тег не найден в категориях, отправляем в конец
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
        
        const tagNames: string[] = [];
        for (const id of sortedTagIds) {
            const tag = tag_list.find(t => t.id === id);
            if (tag) tagNames.push(tag.text);
        }
        return tagNames.join(' ');
    } catch {
        return '';
    }
}

export async function getTagDisplaySettings(userId: number): Promise<{ mode: string; position: string }> {
    const user = await prisma.account.findFirst({
        where: { idvk: userId }
    });
    
    return {
        mode: user?.tag_display_mode || 'smart',
        position: user?.tag_position || 'bottom'
    };
}

export async function formatBlankWithTags(
    userId: number,
    blankId: number,
    baseText: string
): Promise<{ text: string; showTagsButton: boolean; tagsText: string }> {
    const settings = await getTagDisplaySettings(userId);
    const tags = await getTagsForBlank(blankId);
    
    const showTagsButton = settings.mode === 'hidden' || (settings.mode === 'smart' && (baseText.length + tags.length > 4000));
    
    let text = baseText;
    if (!(settings.mode === 'hidden' || showTagsButton) && tags.length > 0) {
        const tagBlock = `\n🏷 Теги: ${tags}`;
        if (settings.position === 'top') {
            text = tagBlock + '\n' + baseText;
        } else {
            text = baseText + tagBlock;
        }
    }
    
    return {
        text: text,
        showTagsButton: showTagsButton && tags.length > 0,
        tagsText: tags
    };
}