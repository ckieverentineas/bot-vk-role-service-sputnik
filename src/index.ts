import { VK } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { QuestionManager, IQuestionMessageContext } from 'vk-io-question';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { Chat_Cleaner, Group_Id_Get, Keyboard_Index, Logger, Worker_Checker } from './module/helper';
import { InitGameRoutes } from './init';
import { commandUserRoutes } from './command';
import prisma from './module/prisma';
import { User_Registration } from './module/registration';
import { Data_Registration_Page_Detector } from './module/defender';
import { Counter_PK_Module } from './module/counter_pk';
dotenv.config()

//загрузка из .env, задание параметров
export const token: string = String(process.env.token) //подгружаем токен группы
export const root: number = Number(process.env.root) //подгружаем идвк рут пользователя
export const chat_id: number = Number(process.env.chat_id) //подгружаем ид чата группы для логов
export const group_id: number = Number(Group_Id_Get(token)) //автоматически узнаем идвк группы, которой принадлежит токен
export const timer_text = { answerTimeLimit: 600_000 } // таймер на пять минут для вопросов пользователям
export const answerTimeLimit = 600_000 // альтернативный таймер на пять минут для вопросов пользователям
export const starting_date = new Date(); // запись времени работы бота
// хранилище для пкметра
export const users_pk: Array<{ idvk: number, text: string, mode: boolean }> = []
//авторизация
export const vk = new VK({ token: token, pollingGroupId: group_id, apiLimit: 20, apiMode: 'parallel_selected' });

//инициализация миддлеваров
const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();

/*prisma.$use(async (params, next) => {
	console.log('This is middleware!')
	// Modify or interrogate params here
	console.log(params)
	return next(params)
})*/

//настройка миддлеваров
vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

//регистрация роутов из command.ts и init.ts
InitGameRoutes(hearManager)
commandUserRoutes(hearManager)

//миддлевар для предварительной обработки сообщений
vk.updates.on('message_new', async (context: any, next: any) => {
	//Модуль вызова пкметра
	const pk_counter_st = await Counter_PK_Module(context)
	//console.log(users_pk)
	if (pk_counter_st) { return }
	//если написали в чат, удаляем по дефолту
	await Chat_Cleaner(context)
	const date_page_check = await Data_Registration_Page_Detector(context)
	if (!date_page_check) { return next(); }
	//проверяем есть ли пользователь в базах данных
	const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
	//если пользователя нет, то начинаем регистрацию
	if (!user_check) { await User_Registration(context); return next(); }
	await Keyboard_Index(context, `⌛ Загрузка, пожалуйста подождите...`)
	return next();
})
//запускаем бота
vk.updates.start().then(() => {
	Logger(`(system) ~ running succes by <system> №0`)
}).catch(console.error);
//запускаем раз в сутки выдачу времени
setInterval(Worker_Checker, 86400000);
//process.on('warning', e => console.warn(e.stack))