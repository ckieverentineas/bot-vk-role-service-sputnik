import { Account, Blank } from "@prisma/client"
import { Confirm_User_Success, Logger, Send_Message } from "./helper"
import prisma from "./prisma"
import { abusivelist, Censored_Activation } from "./blacklist"
import { Keyboard } from "vk-io"

export async function Blank_Like(context: any, user_check: Account, selector: Blank, blank_build: any) {
    const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: selector.id } })
	blank_build.splice(0, 1)
	await Send_Message(user_check.idvk, `✅ Анкета #${selector.id} вам зашла, отправляем информацию об этом его/её владельцу.`)
	const user_nice = await prisma.account.findFirst({ where: { id: selector.id_account } })
	const user_blank = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
	const mail_set = await prisma.mail.create({ data: { blank_to: selector.id, blank_from: user_blank?.id ?? 0 }})
	if (mail_set) { await Send_Message(user_nice?.idvk ?? user_check.idvk, `🔔 Ваша анкета #${selector.id} понравилась кому-то, загляните в почту.`) }
	await Logger(`(private chat) ~ clicked swipe for <blank> #${selector.id} by <user> №${context.senderId}`)
    
}
export async function Blank_Unlike(context: any, user_check: Account, selector: Blank, blank_build: any) {
    const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: selector.id } })
	blank_build.splice(0, 1)
	await Send_Message(user_check.idvk, `✅ Пропускаем анкету #${selector.id}.`)
	await Logger(`(private chat) ~ clicked unswipe for <blank> #${selector.id} by <user> №${context.senderId}`)
}
export async function Blank_Report(context: any, user_check: Account, selector: Blank, blank_build: any) {
    const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `вы уверены, что хотите пожаловаться на анкету №${selector.id}?`)
    await context.send(`${confirm.text}`)
    if (!confirm.status) { return; }
	let ender2 = true
	let text_input = ``
	await Logger(`(private chat) ~ starting report writing on <blank> #${selector.id} by <user> №${context.senderId}`)
	while (ender2) {
		let censored = user_check.censored ? await Censored_Activation(text_input) : text_input
		const corrected = await context.question(`🧷 Введите причину жалобы от 10 до 200 символов:\n📝 Указана причина: ${censored}`,
			{	
				keyboard: Keyboard.builder()
				.textButton({ label: '!сохранить', payload: { command: 'student' }, color: 'secondary' })
				.textButton({ label: '!отмена', payload: { command: 'citizen' }, color: 'secondary' })
				.oneTime().inline()
			}
		)
		if (corrected.text == '!сохранить') {
			if (text_input.length < 10) { await context.send(`Жалобу от 10 символов надо!`); continue }
			if (text_input.length > 200) { await context.send(`Жалобу до 200 символов надо!`); continue }
			const report_set = await prisma.report.create({ data: { id_blank: selector.id, id_account: user_check.id, text: text_input }})
			await Logger(`(private chat) ~ report send about <blank> #${selector.id} by <user> №${context.senderId}`)
			await Send_Message(user_check.idvk, `✅ Мы зарегистрировали вашу жалобу на анкету #${selector.id}, спасибо за донос!`)
			const user_warn = await prisma.account.findFirst({ where: { id: selector.id_account } })
			const counter_warn = await prisma.report.count({ where: { id_blank: selector.id, status: 'wait' } })
			if (!user_warn) { return }
			await Send_Message(user_warn.idvk, `✅ На вашу анкету #${selector.id} донесли крысы следующее: [${report_set.text}]! Жалоб ${counter_warn}/3.`)
			if (counter_warn >= 3) {
				await prisma.blank.update({ where: { id: selector.id }, data: { banned: true } })
				await Send_Message(user_warn.idvk, `🚫 На вашу анкету #${selector.id} донесли крысы ${counter_warn}/3. Изымаем анкету из поиска до разбирательства модераторами.`)
			}
			const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: selector.id } })
			blank_build.splice(0, 1)
			ender2 = false
		} else {
			if (corrected.text == '!отмена') {
				ender2 = false
			} else {
				text_input = corrected.text.replace(/[^а-яА-Я0-9ёЁ -+—–(){}[#№\]=:;.,!?...]/gi, '')
			}
		}
	}
}

export async function Blank_Browser(context: any, user_check: Account) {
	let ender2 = true
	let text_input = ``
	const data = { text: '', status: false }
	await Logger(`(private chat) ~ starting browser writing prompt by <user> №${context.senderId}`)
	while (ender2) {
		let censored = user_check.censored ? await Censored_Activation(text_input) : text_input
		const corrected = await context.question(`🧷 Введите промпт для поиска анкеты от 10 до 200 символов:\n📝 Текущий запрос: ${censored}`,
			{	
				keyboard: Keyboard.builder()
				.textButton({ label: '!сохранить', payload: { command: 'student' }, color: 'secondary' })
				.textButton({ label: '!отмена', payload: { command: 'citizen' }, color: 'secondary' })
				.oneTime().inline()
			}
		)
		if (corrected.text == '!сохранить') {
			if (text_input.length < 10) { await context.send(`Промпт от 10 символов надо!`); continue }
			if (text_input.length > 200) { await context.send(`Промпт до 200 символов надо!`); continue }
			ender2 = false
			data.status = true
			data.text = text_input
		} else {
			if (corrected.text == '!отмена') {
				ender2 = false
			} else {
				text_input = corrected.text.replace(/[^а-яА-Я0-9ёЁ -+—–(){}[#№\]=:;.,!?...]/gi, '')
			}
		}
	}
	return data
}