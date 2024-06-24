import { Keyboard, KeyboardBuilder, PhotoAttachment, VK } from "vk-io";
import { answerTimeLimit, chat_id, group_id, root, starting_date, vk } from "..";
import { Account, Blank } from "@prisma/client";
import prisma from "./prisma";
import { MessagesSendResponse } from "vk-io/lib/api/schemas/responses";
import { compareTwoStrings } from "string-similarity";
import { DiceCoefficient } from "natural";

export function Sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
//автополучение идвк группы
export async function Group_Id_Get(token: string) {
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

export async function Send_Message(idvk: number, message: string, keyboard?: Keyboard) {
    message = message ? message : 'invalid message'
    try {
        keyboard ? await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}`, keyboard: keyboard } ) : await vk.api.messages.send({ peer_id: idvk, random_id: 0, message: `${message}` } )
    } catch (e) {
        console.log(`Ошибка отправки сообщения: ${e}`)
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
        const err = `Ошибка редактирования сообщения, попробуйте через 1-15 минут, в зависимости от ошибки: ${e}`
        console.log(`Ошибка редактирования сообщения, попробуйте через 1-15 минут, в зависимости от ошибки: ${e}`)
        try {
            await vk.api.messages.send({
                peer_id: context.senderId ?? context.peerId,
                random_id: 0,
                message: err.slice(0,250)
            })
        } catch {
            console.log(`Ошибка редактирования сообщения в квадрате: ${e}`)
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
        keyboard.textButton({ label: '!операции', payload: { command: 'sliz' }, color: 'positive' }).row()
    } 
    if (await Accessed(context) == `root`) {
        keyboard.textButton({ label: '!операция', payload: { command: 'sliz' }, color: 'negative' }).row()
    } 
    keyboard.textButton({ label: '!спутник', payload: { command: 'sliz' }, color: 'primary' }).row().oneTime()
    // Отправляем клавиатуру без сообщения
    await vk.api.messages.send({ peer_id: context.senderId, random_id: 0, message: `${messa}\u00A0`, keyboard: keyboard })
    .then(async (response: MessagesSendResponse) => { 
        await Sleep(1000)
        return vk.api.messages.delete({ message_ids: [response], delete_for_all: 1 }) })
    .then(() => { Logger(`(private chat) ~ succes get keyboard is viewed by <user> №${context.senderId}`) })
    .catch((error) => { console.error(`User ${context.senderId} fail get keyboard: ${error}`) });

    // Получаем последнее сообщение из истории беседы
  const [lastMessage] = (await vk.api.messages.getHistory({
    peer_id: context.peerId,
    count: 1,
  })).items;

  // Если последнее сообщение от пользователя и не содержит текст "!банк",
  // помечаем беседу как "говорит"
  if (lastMessage.from_id !== group_id && lastMessage.text !== '!спутник') {
    await vk.api.messages.setActivity({
      type: 'typing',
      peer_id: context.peerId,
    });
  } else {
    // Иначе отправляем событие, что бот прочитал сообщение
    await vk.api.messages.markAsRead({
      peer_id: context.peerId,
    });
  }

}

export async function User_Info(context: any) {
    let [userData]= await vk.api.users.get({user_id: context.senderId});
    return userData
}

export async function Chat_Cleaner(context: any) {
    if (context.peerType == 'chat') { 
		try { 
			await vk.api.messages.delete({'peer_id': context.peerId, 'delete_for_all': 1, 'cmids': context.conversationMessageId, 'group_id': group_id})
			await Logger(`(public chat) ~ received a message from the <user> #${context.senderId} and was deleted by <system> №0`)
		} catch (error) { 
			await Logger(`(public chat) ~ received a message from the <user> #${context.senderId} and wasn't deleted by <system> №0`)
		}  
		return
	}
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
export async function Researcher_Better_Blank_Target(query: string, sentence: Blank): Promise<Match> {
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
}