import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import { root } from ".";
import prisma from "./module/prisma";
import { Accessed, Logger, Send_Message, User_Info } from "./module/helper";

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
	hearManager.hear(/!спутник|!Спутник/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
		const user_inf = await User_Info(context)
		const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
		const mail_check = await prisma.mail.findFirst({ where: {  blank_to: blank_check?.id ?? 0, read: false, find: true } })
		
        const keyboard = new KeyboardBuilder()
    	.textButton({ label: '📃 Моя анкеты', payload: { command: 'card_enter' }, color: 'secondary' }).row()
		.textButton({ label: `${mail_check ? '📬' : '📪'} Почта`, payload: { command: 'card_enter' }, color: 'secondary' }).row()
    	//.textButton({ label: '🔍 Искать как делать нефиг', payload: { command: 'inventory_enter' }, color: 'secondary' }).row()
		.textButton({ label: '🎲 Рандом', payload: { command: 'shop_category_enter' }, color: 'positive' }).row()
    	//.textButton({ label: '🌐 Браузер для порно', payload: { command: 'shop_category_enter' }, color: 'positive' }).row()
    	//.callbackButton({ label: '🎓 Учебля', payload: { command: 'operation_enter' }, color: 'positive' }).row()
    	if (await Accessed(context) != `user`) {
    	    keyboard.callbackButton({ label: '⚙ Админы', payload: { command: 'admin_enter' }, color: 'secondary' })
    	}
    	//keyboard.urlButton({ label: '⚡ Инструкция', url: `https://vk.com/@bank_mm-instrukciya-po-polzovaniu-botom-centrobanka-magomira` }).row()
    	keyboard.textButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' }).oneTime().inline()
        if (await prisma.blank.count({ where: { id_account: user_check.id } }) > 1) {
            keyboard.textButton({ label: '🔃👥', payload: { command: 'Согласиться' }, color: 'secondary' })
        }
        keyboard.inline()
		await Send_Message(user_check.idvk, `🛰 Вы в системе поиска соролевиков ${user_inf.first_name}, что изволите?`, keyboard)
        await Logger(`In private chat, invite enter in system is viewed by user ${context.senderId}`)
    })
	//почта
	hearManager.hear(/📬 Почта|📪 Почта|!почта/, async (context: any) => {
		if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
		const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check?.id } })
        if (!user_check || !blank_check) { return }
		const mail_build = []
		for (const mail of await prisma.mail.findMany({ where: { blank_to: blank_check.id, read: false, find: true } })) {
			mail_build.push(mail)
		}
		let ender = true
		while (ender && mail_build.length > 0) {
			const target = Math.floor(Math.random() * mail_build.length)
			const selector = mail_build[target]
			const blank_to_check = await prisma.blank.findFirst({ where: { id: selector.blank_to } })
			const blank_from_check = await prisma.blank.findFirst({ where: { id: selector.blank_from } })
			if (!blank_to_check || !blank_from_check) { 
				const mail_skip = await prisma.mail.update({ where: { id: selector.id }, data: { read: true, find: false } })
				mail_build.splice(target, 1)
				await Send_Message(user_check.idvk, `⚠ Недавно ваша анкета #${blank_to_check?.id} понравилась ролевику с анкетой #${blank_from_check?.id}, но ваша или опоннента анкета не были найдены, сообщение было помечено не найденным\n `)
				continue
			}
			const account_to = await prisma.account.findFirst({ where: { id: blank_to_check.id_account } })
			const account_from = await prisma.account.findFirst({ where: { id: blank_from_check.id_account } })
			if (!account_to || !account_from) {
				const mail_skip = await prisma.mail.update({ where: { id: selector.id }, data: { read: true, find: false } })
				mail_build.splice(target, 1)
				await Send_Message(user_check.idvk, `⚠ Недавно ваша анкета #${blank_to_check?.id} понравилась ролевику с анкетой #${blank_from_check?.id}, но ваc или опоннента больше нет в системе, сообщение было помечено не найденным\n `)
				continue
			}
			const corrected = await context.question(`🔔 Ваша анкета #${blank_to_check.id} понравилась автору следующей анкеты:\n 📜 Анкета: ${blank_from_check.id}\n💬 Содержание: ${blank_from_check.text}`,
				{	
					keyboard: Keyboard.builder()
					.textButton({ label: '👎Иди Нафиг', payload: { command: 'student' }, color: 'secondary' })
					.textButton({ label: '👍Нраица', payload: { command: 'citizen' }, color: 'secondary' }).row()
					.textButton({ label: '🚫Назад', payload: { command: 'citizen' }, color: 'secondary' })
					.oneTime().inline()
				}
			)
			if (corrected.text == '🚫Назад') {
				await Send_Message(user_check.idvk, `✅ Успешная отмена просмотра почтового ящика анкет.`)
				ender = false
			}
			if (corrected.text == '👎Иди Нафиг') {
				const mail_skip = await prisma.mail.update({ where: { id: selector.id }, data: { read: true } })
				mail_build.splice(target, 1)
				await Send_Message(user_check.idvk, `✅ Игнорируем анкету #${selector.blank_from} полностью.`)
			}
			if (corrected.text == '👍Нраица') {
				const mail_skip = await prisma.mail.update({ where: { id: selector.id }, data: { read: true, status: true } })
				mail_build.splice(target, 1)
				await Send_Message(account_to.idvk, `🔊 Недавно вам понравилась анкета #${blank_from_check.id}, знайте это взаимно на вашу анкету #${blank_to_check.id}.\n Скорее пишите друг другу в личные сообщения и ловите флешбеки вместе, станьте врагами уже сегодня с https://vk.com/id${account_from.idvk} !`)
				await Send_Message(account_from.idvk, `🔊 Недавно вам понравилась анкета #${blank_to_check.id}, знайте это взаимно на вашу анкету #${blank_from_check.id}.\n Скорее пишите друг другу в личные сообщения и ловите флешбеки вместе, станьте врагами уже сегодня с https://vk.com/id${account_to.idvk} !`)
        		await Logger(`In private chat, invite enter in system is viewed by user ${context.senderId}`)
			}
		}
		if (mail_build.length == 0) { await Send_Message(user_check.idvk, `😿 Письма кончились, приходите позже - воробушек.`)}
        await Logger(`In private chat, invite enter in system is viewed by user ${context.senderId}`)
    })
	//для рандома
	hearManager.hear(/🎲 Рандом|!рандом/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
		const blank_build = []
		for (const blank of await prisma.blank.findMany()) {
			if (blank.id_account == user_check.id) { continue }
			const vision_check = await prisma.vision.findFirst({ where: { id_blank: blank.id, id_account: user_check.id } })
			if (vision_check) { continue }
			blank_build.push(blank)
		}
		let ender = true
		while (ender && blank_build.length > 0) {
			const target = Math.floor(Math.random() * blank_build.length)
			const selector = blank_build[target]
			const corrected = await context.question(`📜 Анкета: ${selector.id}\n💬 Содержание: ${selector.text}`,
				{	
					keyboard: Keyboard.builder()
					.textButton({ label: '⛔Налево', payload: { command: 'student' }, color: 'secondary' })
					.textButton({ label: '✅Направо', payload: { command: 'citizen' }, color: 'secondary' }).row()
					.textButton({ label: '🚫Назад', payload: { command: 'citizen' }, color: 'secondary' })
					.oneTime().inline()
				}
			)
			if (corrected.text == '🚫Назад') {
				await Send_Message(user_check.idvk, `✅ Успешная отмена рандомных анкет.`)
				ender = false
			}
			if (corrected.text == '⛔Налево') {
				const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: selector.id } })
				blank_build.splice(target, 1)
				await Send_Message(user_check.idvk, `✅ Пропускаем анкету #${selector.id}.`)
			}
			if (corrected.text == '✅Направо') {
				const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: selector.id } })
				blank_build.splice(target, 1)
				await Send_Message(user_check.idvk, `✅ Анкета #${selector.id} вам зашла, отправляем информацию об этом его/её владельцу.`)
				const user_nice = await prisma.account.findFirst({ where: { id: selector.id_account } })
				const user_blank = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
				const mail_set = await prisma.mail.create({ data: { blank_to: selector.id, blank_from: user_blank?.id ?? 0 }})
				if (mail_set) { await Send_Message(user_nice?.idvk ?? user_check.idvk, `🔔 Ваша анкета #${selector.id} понравилась кому-то, загляните в почту.`) }
			}
		}
		if (blank_build.length == 0) { await Send_Message(user_check.idvk, `😿 Анкеты кончились, приходите позже - масленок.`)}
        await Logger(`In private chat, invite enter in system is viewed by user ${context.senderId}`)
    })
	// для анкеты
	hearManager.hear(/📃 Моя анкеты|!анкета/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
		const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
		if (!blank_check) {
			let ender = true
			let text_input = ``
			while (ender) {
				const corrected = await context.question(`🧷 У вас еще нет анкеты, введите анкету до 4000 символов:\n📝 Сейчас заполнено: ${text_input}`,
					{	
						keyboard: Keyboard.builder()
						.textButton({ label: '!сохранить', payload: { command: 'student' }, color: 'secondary' })
						.textButton({ label: '!отмена', payload: { command: 'citizen' }, color: 'secondary' })
						.oneTime().inline()
					}
				)
				if (corrected.text == '!сохранить') {
					const save = await prisma.blank.create({ data: { text: text_input, id_account: user_check.id } })
					await context.send(`Вы успешно создали анкетку-конфетку под UID: ${save.id}`)
					ender = false
				} else {
					if (corrected.text == '!отмена') {
						ender = false
					} else {
						text_input = corrected.text
					}
				}
			}
		} else {
			const blank = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
			if (blank) {
				const keyboard = new KeyboardBuilder()
    			.textButton({ label: `⛔Удалить ${blank.id}`, payload: { command: 'card_enter' }, color: 'secondary' }).row()
    			.textButton({ label: `✏Изменить ${blank.id}`, payload: { command: 'inventory_enter' }, color: 'secondary' }).row()
    			keyboard.textButton({ label: '🚫', payload: { command: 'exit' }, color: 'secondary' }).oneTime().inline()
				const count_vision = await prisma.vision.count({ where: { id_blank: blank.id } })
				const count_account = await prisma.account.count({})
				const count_success = await prisma.mail.count({ where: { blank_to: blank.id, read: true, status: true }})
				const count_ignore = await prisma.mail.count({ where: { blank_to: blank.id, read: true, status: false }})
				const count_wrong = await prisma.mail.count({ where: { blank_to: blank.id, read: true, find: false }})
				const count_unread = await prisma.mail.count({ where: { blank_to: blank.id, read: false }})
				await Send_Message(user_check.idvk, `📜 Анкета: ${blank.id}\n💬 Содержание: ${blank.text}\n👁 Просмотров: ${count_vision}/${count_account}\n✅ Принятых: ${count_success}\n🚫 Игноров: ${count_ignore}\n⌛ Ожидает: ${count_ignore}\n❗ Потеряшек: ${count_wrong}`, keyboard)
			}
		}
        await Logger(`In private chat, invite enter in system is viewed by user ${context.senderId}`)
    })
	hearManager.hear(/⛔Удалить|!удалить/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
		const [cmd, value] = context.text.split(' ');
        const target = parseInt(value)
		const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id, id: target } })
		if (!blank_check) { return }
		const blank_delete = await prisma.blank.delete({ where: { id: blank_check.id } })
        if (blank_delete) { 
			await Send_Message(user_check.idvk, `✅ Успешно удалено:\n📜 Анкета: ${blank_delete.id}\n💬 Содержание: ${blank_delete.text}`)
		}
        await Logger(`In private chat, invite enter in system is viewed by user ${context.senderId}`)
    })
	hearManager.hear(/✏Изменить|!изменить/, async (context: any) => {
        if (context.peerType == 'chat') { return }
        const user_check = await prisma.account.findFirst({ where: { idvk: context.senderId } })
        if (!user_check) { return }
		const [cmd, value] = context.text.split(' ');
        const target = parseInt(value)
		const blank_check = await prisma.blank.findFirst({ where: { id_account: user_check.id, id: target } })
		if (!blank_check) { return }
		let ender = true
		let text_input = blank_check.text
		while (ender) {
			const corrected = await context.question(`🧷 Вы редактируете анкету ${blank_check.id}, напоминаем анкета должна быть до 4000 символов:\n📝 текущая анкета: ${text_input}`,
				{	
					keyboard: Keyboard.builder()
					.textButton({ label: '!сохранить', payload: { command: 'student' }, color: 'secondary' })
					.textButton({ label: '!отмена', payload: { command: 'citizen' }, color: 'secondary' })
					.oneTime().inline()
				}
			)
			if (corrected.text == '!сохранить') {
				const blank_edit = await prisma.blank.update({ where: { id: blank_check.id }, data: { text: text_input } })
				await Send_Message(user_check.idvk, `✅ Успешно изменено:\n📜 Анкета: ${blank_edit.id}\n💬 Содержание: ${blank_edit.text}`)
				ender = false
			} else {
				if (corrected.text == '!отмена') {
					ender = false
				} else {
					text_input = corrected.text
				}
			}
		}
        await Logger(`In private chat, invite enter in system is viewed by user ${context.senderId}`)
    })
}