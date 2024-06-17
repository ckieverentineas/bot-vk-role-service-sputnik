import { VK, Keyboard } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import {
    QuestionManager,
    IQuestionMessageContext
} from 'vk-io-question';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { Keyboard_Index, Logger, Send_Message, User_Info, Worker_Checker } from './module/helper';
import { InitGameRoutes } from './init';
import { registerUserRoutes } from './command';
import prisma from './module/prisma';
dotenv.config()

export const token: string = String(process.env.token)
export const root: number = Number(process.env.root) //root user
export const chat_id: number = Number(process.env.chat_id) //chat for logs
export const group_id: number = Number(process.env.group_id)//clear chat group
export const timer_text = { answerTimeLimit: 300_000 } // ожидать пять минут
export const timer_text_oper = { answerTimeLimit: 60_000 } // ожидать пять минут
export const answerTimeLimit = 300_000 // ожидать пять минут
export const starting_date = new Date(); // время работы бота
//авторизация
async function Group_Id_Get() {
	const vk = new VK({ token: token, apiLimit: 1 });
	const [group] = await vk.api.groups.getById(vk);
	const groupId = group.id;
	return groupId
}
export const vk = new VK({ token: token, pollingGroupId: Number(Group_Id_Get()), apiLimit: 20, apiMode: 'parallel_selected' });
//инициализация
const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();

/*prisma.$use(async (params, next) => {
	console.log('This is middleware!')
	// Modify or interrogate params here
	console.log(params)
	return next(params)
})*/

//настройка
vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

//регистрация роутов из других классов
InitGameRoutes(hearManager)
registerUserRoutes(hearManager)
export const users_pk: Array<{ idvk: number, text: string, mode: boolean }> = []
//миддлевар для предварительной обработки сообщений
vk.updates.on('message_new', async (context: any, next: any) => {
	if (context.peerType == 'chat') { 
		try { 
			await vk.api.messages.delete({'peer_id': context.peerId, 'delete_for_all': 1, 'cmids': context.conversationMessageId, 'group_id': group_id})
			await Logger(`In chat received a message from the user ${context.senderId} and was deleted`)
			//await vk.api.messages.send({ peer_id: chat_id, random_id: 0, message: `✅🚫 @id${context.senderId} ${context.text}`})  
		} catch (error) { 
			await Logger(`In chat received a message from the user ${context.senderId} and wasn't deleted`)
			//await vk.api.messages.send({ peer_id: chat_id, random_id: 0, message: `⛔🚫 @id${context.senderId} ${context.text}`}) 
		}  
		return
	}
	//проверяем есть ли пользователь в базах данных
	const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
	//если пользователя нет, то начинаем регистрацию
	if (!user_check) {
		//согласие на обработку
		const answer = await context.question(`⌛ Вы входите в Центрзнаком Министерства Магии 🏦, из ниоткуда перед вами предстали два розовых единорога и произнесли: \n — Купидон Ролевик говорил нам о вас. Но прежде чем продолжить, распишитесь здесь о своем согласии на обработку персональных данных и о не разгрлашении других персональных данных. \n В тот же миг в их руках магическим образом появился пергамент. \n 💡 У вас есть 5 минут на принятие решения!`,
			{	
				keyboard: Keyboard.builder()
				.textButton({ label: '✏', payload: { command: 'Согласиться' }, color: 'positive' }).row()
				.textButton({ label: '👣', payload: { command: 'Отказаться' }, color: 'negative' }).oneTime(),
				answerTimeLimit
			}
		);
		if (answer.isTimeout) { return await context.send(`⏰ Время ожидания подтверждения согласия истекло!`) }
		if (!/да|yes|Согласиться|конечно|✏/i.test(answer.text|| '{}')) {
			await context.send('⌛ Вы отказались дать свое согласие, а живым отсюда никто не уходил, вас упаковали!');
			return;
		}
		//приветствие игрока
		const visit = await context.question(`⌛ Поставив свою подпись, вы офигели не от того, что здесь розовые единороги, а лишь от того, что они ГОВОРЯЩИЕ сук@, после чего вы вошли в личный кабинет Центзнаком при поддержке МинУслуг, и увидели домашнего фестрала, наводящего смерть и покой в ваших покоях.`,
			{ 	
				keyboard: Keyboard.builder()
				.textButton({ label: 'Подойти и поздороваться', payload: { command: 'Согласиться' }, color: 'positive' }).row()
				.textButton({ label: 'Ждать, пока фестрал закончит', payload: { command: 'Отказаться' }, color: 'negative' }).oneTime().inline(),
				answerTimeLimit
			}
		);
		if (visit.isTimeout) { return await context.send(`⏰ Время ожидания активности истекло!`) }
		const save = await prisma.account.create({	data: {	idvk: context.senderId } })
		const info = await User_Info(context)
		await context.send(`⌛ Фестрал заскучал и просек, что вы его тоже видите, поэтому подошел и сказал.\n - Добро пожаловать в мир порномагии и хауса! \n И протянул вам вашу карточку.\n ⚖Вы получили картотеку, ${info.first_name}\n 🕯 GUID: ${save.id}. \n 🎥 idvk: ${save.idvk}\n ⚰ Дата Регистрации: ${save.crdate}\n`)
		await Logger(`In database created new user with uid [${save.id}] and idvk [${context.senderId}]`)
		/*await context.send(`⚠ Настоятельно рекомендуем ознакомиться с инструкцией эксплуатации системы "Центробанк Магомира":`,{ 	
			keyboard: Keyboard.builder()
			.urlButton({ label: '⚡ Инструкция', url: `https://vk.com/@bank_mm-instrukciya-po-polzovaniu-botom-centrobanka-magomira` }).row().inline(),
			answerTimeLimit
		})*/
		const ans_selector = `⁉ @id${save.idvk}(${info.first_name}) легально получает банковскую карту GUID: ${save.id}!`
		await Send_Message(chat_id, ans_selector)
		await Keyboard_Index(context, `💡 Подсказка: Когда все операции вы успешно завершили, напишите [!банк] без квадратных скобочек, а затем нажмите кнопку: ✅Подтвердить авторизацию!`)
	} else {
		await Keyboard_Index(context, `⌛ Загрузка, пожалуйста подождите...`)
	}
	return next();
})
vk.updates.on('message_event', async (context: any, next: any) => { 
	/*await Person_Detector(context)
	const config: any = {
		"system_call": Main_Menu_Init,
		"card_enter": Card_Enter,
		"birthday_enter": Birthday_Enter,
		"exit": Exit,
		"artefact_enter": Artefact_Enter,
		"inventory_enter": Inventory_Enter,
		"admin_enter": Admin_Enter,
		"service_enter": Service_Enter,
		"service_cancel": Service_Cancel,
		"shop_category_enter": Shop_Category_Enter,
		"shop_enter": Shop_Enter,
		"shop_cancel": Shop_Cancel,
		"shop_bought": Shop_Bought,
		"shop_buy": Shop_Buy,
		"operation_enter": Operation_Enter, // заглушки
		"right_enter": Right_Enter, // заглушки
		"service_kvass_open": Service_Kvass_Open,
		"statistics_enter": Statistics_Enter,
		"rank_enter": Rank_Enter,
		"alliance_control_multi": Alliance_Control_Multi,
		"alliance_control": Alliance_Control,
		"alliance_controller": Alliance_Controller,
		'alliance_enter': Alliance_Enter,
		'alliance_enter_admin': Alliance_Enter_Admin,
		'alliance_rank_enter': Alliance_Rank_Enter,
		'alliance_rank_coin_enter': Alliance_Rank_Coin_Enter
	}
	try {
		await config[context.eventPayload.command](context)
	} catch (e) {
		await Logger(`Error event detected for callback buttons: ${e}`)
	}*/
	return await next();
})

vk.updates.start().then(() => {
	Logger('running succes')
}).catch(console.error);
setInterval(Worker_Checker, 86400000);
process.on('warning', e => console.warn(e.stack))