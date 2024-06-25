import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import { chat_id, root } from ".";
import prisma from "./module/prisma";
import { Init_Person } from "./fake_profile";
import { Logger, Send_Message } from "./module/helper";

export function InitGameRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
	/*hearManager.hear(/!init/, async (context: any) => {
		if (context.senderId != root) { return }
		let date = new Date()
		let counter = 0
		for (let i=1; i < 1000000; i++) {
			const user_check = await prisma.account.findFirst({ where: { idvk: i } })
			if (user_check) { await Logger(`Пользователь с idvk${i} уже регнулся`); continue }
			const user_creation = await prisma.account.create({ data: { idvk: i } })
			const data = await Init_Person()
			const blank_creation = await prisma.blank.create({ data: { id_account: user_creation.id, text: data.text } })
			
			counter++
    		if (counter > 5000) {
				const ans_selector = `⁉ @id${user_creation.idvk}(${data.name}) по мему регистрируется в Спутнике под GUID: ${user_creation.id}!\n На 5000 учеток и анкет затрачено ${(Date.now() - Number(date))/1000} сек`
				await Send_Message(chat_id, ans_selector)
				counter = 0
				date = new Date()
			} else {
				await Logger(`⁉ @id${user_creation.idvk}(${data.name}) по мему регистрируется в Спутнике под GUID: ${user_creation.id}!\n На ${counter}/5000 учеток и анкет затрачено ${(Date.now() - Number(date))/1000} сек`)
			}
		}
	})
	hearManager.hear(/!delete/, async (context: any) => {
		if (context.senderId != root) { return }
		for (const ank of await prisma.vision.findMany({})) {
			await prisma.vision.delete({ where: { id: ank.id } })
		}
		await context.send(`Все просмотры удалены!`)
	})*/
}