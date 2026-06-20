import { VK } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { QuestionManager, IQuestionMessageContext } from 'vk-io-question';
import * as dotenv from 'dotenv'
import { Blank_Inactivity, Chat_Cleaner, Exiter, Group_Id_Get, Keyboard_Index, Logger, Online_Set, Reset_Sniper_Limits, Worker_Checker } from './module/helper';
import { InitGameRoutes } from './init';
import { commandUserRoutes, handleAgeConfirmForLike, handleAgeConfirmForUnlike, handleAgeConfirmFromSave, handleBlankTagsConfig, handleRomanceDoneFromLike, handleRomanceDoneFromSave, handleRomanceDoneFromUnlike, handleRomanceToggleBothFromLike, handleRomanceToggleBothFromSave, handleRomanceToggleBothFromUnlike, handleRomanceToggleFemaleFromLike, handleRomanceToggleFemaleFromSave, handleRomanceToggleFemaleFromUnlike, handleRomanceToggleMaleFromLike, handleRomanceToggleMaleFromSave, handleRomanceToggleMaleFromUnlike, handleSaveTags, handleSetupRomanceFromSave, handleShowBlank, handleShowTags, handleTagatorMenu, handleTagatorResearchConfigLike, handleTagatorResearchConfigReset, handleTagatorResearchConfigUnlike, handleTagDisplayMode, handleTagDisplayPosition, handleTagDisplaySettings, handleTagPage } from './command';
import prisma from './module/prisma';
import { User_Registration } from './module/registration';
import { Data_Registration_Page_Detector } from './module/defender';
import { Counter_PK_Module } from './module/counter_pk';
import { Start_Worker_API_Bot } from './api';

dotenv.config()

//загрузка из .env, задание параметров
export const token: string = String(process.env.token)
export const root: number = Number(process.env.root)
export const chat_id: number = Number(process.env.chat_id)
export let group_id: number = Number(Group_Id_Get(token))
export const timer_text = { answerTimeLimit: 600_000 }
export const answerTimeLimit = 600_000
export const starting_date = new Date();
export const users_pk: Array<{ idvk: number, text: string, mode: boolean }> = []
export const vk = new VK({ token: token, pollingGroupId: group_id, apiLimit: 20, apiMode: 'parallel_selected' });

const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();

vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

//регистрация роутов
InitGameRoutes(hearManager)
commandUserRoutes(hearManager)

//миддлевар для предварительной обработки сообщений
vk.updates.on('message_new', async (context: any, next: any) => {
	group_id = group_id ? group_id : Number(await Group_Id_Get(token))
	const pk_counter_st = await Counter_PK_Module(context)
	if (pk_counter_st) { return await next(); }
	const chat_ch = await Chat_Cleaner(context)
	if (chat_ch) { return await next(); }
	const date_page_check = await Data_Registration_Page_Detector(context)
	if (!date_page_check) { return await next(); }
	const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
	if (!user_check) { await User_Registration(context); return await next(); }
	await Online_Set(context)
	await Keyboard_Index(context, `⌛ Загрузка, пожалуйста, подождите...`)
	return await next();
})

vk.updates.on('message_event', async (context: any, next: any) => { 
	const command = context.eventPayload?.command;
	const config: any = {
		"exit": Exiter,
		"main_menu": Exiter,
		"card_enter": handleShowBlank,
		"save_tags": handleSaveTags,
		"tagator_blank_config": handleBlankTagsConfig,
		"tagator_research_config_like": handleTagatorResearchConfigLike,
		"tagator_research_config_unlike": handleTagatorResearchConfigUnlike,
		"tagator_research_config_reset": handleTagatorResearchConfigReset,
		"tagator_menu": handleTagatorMenu,
		"tag_page": handleTagPage,
		"tag_display_settings": handleTagDisplaySettings,
        "tag_display_mode": handleTagDisplayMode,
        "tag_display_position": handleTagDisplayPosition,
        "show_tags": handleShowTags,
        "confirm_age_from_save": handleAgeConfirmFromSave,
        "setup_romance_from_save": handleSetupRomanceFromSave,
		"confirm_age_for_like": handleAgeConfirmForLike,
        "romance_toggle_male_from_save": handleRomanceToggleMaleFromSave,
        "romance_toggle_female_from_save": handleRomanceToggleFemaleFromSave,
        "romance_toggle_both_from_save": handleRomanceToggleBothFromSave,
        "romance_done_from_save": handleRomanceDoneFromSave,
		"romance_done_from_like": handleRomanceDoneFromLike,
        "romance_toggle_male_from_like": handleRomanceToggleMaleFromLike,
        "romance_toggle_female_from_like": handleRomanceToggleFemaleFromLike,
        "romance_toggle_both_from_like": handleRomanceToggleBothFromLike,
		"confirm_age_for_unlike": handleAgeConfirmForUnlike,
        "romance_toggle_male_from_unlike": handleRomanceToggleMaleFromUnlike,
        "romance_toggle_female_from_unlike": handleRomanceToggleFemaleFromUnlike,
        "romance_toggle_both_from_unlike": handleRomanceToggleBothFromUnlike,
        "romance_done_from_unlike": handleRomanceDoneFromUnlike,
		"tagator_research_send": async (context: any, payload: any) => {
			await vk.api.messages.send({
				peer_id: context.peerId,
				random_id: 0,
				message: 'tagator_research'
			});
		}
	}
	
	try {
		if (config[command]) {
			await config[command](context, context.eventPayload);
		} else {
			await Logger(`Unknown callback command: ${command}`);
		}
	} catch (e) {
		await Logger(`Error event detected for callback buttons: ${e}`)
	}
	return await next();
})

//запускаем бота
vk.updates.start().then(async () => {
	await Logger(`(system) ~ running succes by <system> №0`)
	await Start_Worker_API_Bot()
}).catch(console.error);

setInterval(Worker_Checker, 86400000);
setInterval(Blank_Inactivity, 86400000);
setInterval(Reset_Sniper_Limits, 86400000);