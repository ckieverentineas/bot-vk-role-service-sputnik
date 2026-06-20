import { Account, Blank } from "@prisma/client"
import { Accessed, Confirm_User_Success, Logger, Send_Message } from "./helper"
import prisma from "./prisma"
import { abusivelist, Censored_Activation, Censored_Activation_Pro } from "./blacklist"
import { Keyboard } from "vk-io"
import { answerTimeLimit, chat_id } from ".."

export async function Blank_Like(context: any, user_check: Account, selector: Blank, blank_build: any, target: number) {
	const blank_check = await prisma.vision.findFirst({ where: { id_account: user_check.id, id_blank: selector.id }})
	if (!blank_check) { const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: selector.id } }) }
    
	blank_build.splice(target, 1)
	await Send_Message(user_check.idvk, `✅ Анкета #${selector.id} вам зашла, отправляем информацию об этом его/её владельцу.`)
	const user_nice = await prisma.account.findFirst({ where: { id: selector.id_account } })
	const user_blank = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
	const mail_set = await prisma.mail.create({ data: { blank_to: selector.id, blank_from: user_blank?.id ?? 0 }})
	if (mail_set) { await Send_Message(user_nice?.idvk ?? user_check.idvk, `🔔 Ваша анкета #${selector.id} понравилась кому-то, загляните в почту.`) }
	await Logger(`(private chat) ~ clicked swipe for <blank> #${selector.id} by <user> №${context.senderId}`)
}
export async function Blank_Like_Donate(context: any, user_check: Account, selector: Blank, blank_build: any, target: number) {
    const blank_check = await prisma.vision.findFirst({ where: { id_account: user_check.id, id_blank: selector.id }})
	if (!blank_check) { const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: selector.id } }) }

	blank_build.splice(target, 1)
	let ender2 = true
	let text_input = ''
	while (ender2) {
		let censored = user_check.censored ? await Censored_Activation_Pro(text_input) : text_input
		const corrected: any = await context.question(`🧷 Введите приватное сообщение пользователю:\n📝 Набранное: ${censored}`,
			{	
				keyboard: Keyboard.builder()
				.textButton({ label: '!сохранить', payload: { command: 'student' }, color: 'secondary' })
				.textButton({ label: '!отмена', payload: { command: 'citizen' }, color: 'secondary' })
				.oneTime().inline(),
				answerTimeLimit
			}
		)
		if (corrected.isTimeout) { return await context.send(`⏰ Время ожидания ввода приватного сообщения истекло!`) }
		if (corrected.text == '!сохранить') {
			if (text_input.length < 1) { await context.send(`⚠ Сообщение от 1 символа надо!`); continue }
			if (text_input.length > 3000) { await context.send(`⚠ Сообщение до 3000 символов надо!`); continue }
			await Send_Message(user_check.idvk, `✅ Анкета #${selector.id} вам зашла, отправляем информацию об этом его/её владельцу вместе с приложением: ${text_input}`)
			const user_nice = await prisma.account.findFirst({ where: { id: selector.id_account } })
			const user_blank = await prisma.blank.findFirst({ where: { id_account: user_check.id } })
			const mail_set = await prisma.mail.create({ data: { blank_to: selector.id, blank_from: user_blank?.id ?? 0 }})
			if (mail_set) { 
				await Send_Message(user_nice?.idvk ?? user_check.idvk, `🔔 Ваша анкета #${selector.id} понравилась владельцу анкеты #${user_blank?.id}, загляните в почту.`) 
				await Send_Message(user_nice?.idvk ?? user_check.idvk, `✉️ Получено приватное письмо от владельца анкеты #${user_blank?.id}: ${text_input}\n⚠ Чтобы отреагировать, загляните в почту и найдите анкету #${user_blank?.id}.`)
				await Send_Message(chat_id,`⚖️ #${user_blank?.id} --> ${text_input} --> #${selector.id}`)
			}
			await Logger(`(private chat) ~ clicked swipe with private message for <blank> #${selector.id} by <user> №${context.senderId}`)
			ender2 = false
		} else {
			if (corrected.text == '!отмена') {
				await context.send(`🔧 Вы отменили написание приватного письма на анкету`)
				ender2 = false
			} else {
				text_input = await Blank_Cleaner(corrected.text)
			}
		}
	}
}
export async function Blank_Unlike(context: any, user_check: Account, selector: Blank, blank_build: any, target: number) {
    const blank_check = await prisma.vision.findFirst({ where: { id_account: user_check.id, id_blank: selector.id }})
	if (!blank_check) { const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: selector.id } }) }

	blank_build.splice(target, 1)
	await Send_Message(user_check.idvk, `✅ Пропускаем анкету #${selector.id}.`)
	await Logger(`(private chat) ~ clicked unswipe for <blank> #${selector.id} by <user> №${context.senderId}`)
}
export async function Blank_Report(context: any, user_check: Account, selector: Blank, blank_build: any, target: number) {
    // Проверяем, является ли пользователь администратором
    const isAdmin = await Accessed(context) != 'user';
    
    // Если не админ, проверяем, не подавал ли уже жалобу на эту анкету
    if (!isAdmin) {
        const existingReport = await prisma.report.findFirst({ 
            where: { 
                id_blank: selector.id, 
                id_account: user_check.id,
                status: 'wait' // проверяем только ожидающие рассмотрения жалобы
            } 
        });
        
        if (existingReport) {
            await Send_Message(user_check.idvk, `⚠ Вы уже подавали жалобу на анкету #${selector.id}. Дождитесь её рассмотрения модераторами.`)
            return;
        }
    }
    
    const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `вы уверены, что хотите пожаловаться на анкету №${selector.id}?`)
    await context.send(`${confirm.text}`)
    if (!confirm.status) { return; }
    
    let ender2 = true
    let text_input = ``
    await Logger(`(private chat) ~ starting report writing on <blank> #${selector.id} by <user> №${context.senderId}`)
    while (ender2) {
        let censored = user_check.censored ? await Censored_Activation_Pro(text_input) : text_input
        const corrected: any = await context.question(`🧷 Введите причину жалобы от 10 до 200 символов:\n📝 Указана причина: ${censored}`,
            {	
                keyboard: Keyboard.builder()
                .textButton({ label: '!сохранить', payload: { command: 'student' }, color: 'secondary' })
                .textButton({ label: '!отмена', payload: { command: 'citizen' }, color: 'secondary' })
                .oneTime().inline(),
                answerTimeLimit
            }
        )
        if (corrected.isTimeout) { return await context.send(`⏰ Время ожидания ввода жалобы истекло!`) }
        if (corrected.text == '!сохранить') {
            if (text_input.length < 10) { await context.send(`⚠ Жалобу от 10 символов надо!`); continue }
            if (text_input.length > 200) { await context.send(`⚠ Жалобу до 200 символов надо!`); continue }
            const report_set = await prisma.report.create({ data: { id_blank: selector.id, id_account: user_check.id, text: text_input }})
            await Logger(`(private chat) ~ report send about <blank> #${selector.id} by <user> №${context.senderId}`)
            await Send_Message(user_check.idvk, `✅ Мы зарегистрировали вашу жалобу на анкету #${selector.id}, спасибо за донос!`)
            const user_warn = await prisma.account.findFirst({ where: { id: selector.id_account } })
            const counter_warn = await prisma.report.count({ where: { id_blank: selector.id, status: 'wait' } })
            if (!user_warn) { return }
            await Send_Message(user_warn.idvk, `✅ На вашу анкету #${selector.id} кто-то донес до модератора следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.\n💡 Не беспокойтесь, если это ложное обвинение, то после третьей жалобы модератор разблокирует вас.`)
            await Send_Message(chat_id, `🧨 На анкету #${selector.id} кто-то донес до модератора следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.`)
            if (counter_warn >= 3) {
                await prisma.blank.update({ where: { id: selector.id }, data: { banned: true } })
                await Send_Message(user_warn.idvk, `🚫 На вашу анкету #${selector.id} донесли крысы ${counter_warn}/3. Изымаем анкету из поиска до разбирательства модераторами.`)
                await Send_Message(chat_id, `⚠ Анкета №${selector.id} изъята из поиска из-за жалоб, модераторы, примите меры!`)
            }
            const blank_check = await prisma.vision.findFirst({ where: { id_account: user_check.id, id_blank: selector.id }})
            if (!blank_check) { const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: selector.id } }) }
            blank_build.splice(target, 1)
            ender2 = false
        } else {
            if (corrected.text == '!отмена') {
                await context.send(`🔧 Вы отменили написание жалобы на анкету`)
                ender2 = false
            } else {
                text_input = await Blank_Cleaner(corrected.text)
            }
        }
    }
}
export async function Blank_Report_Admin(context: any, user_check: Account, selector: Blank, blank_build: any, target: number) {
    const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `вы уверены, что хотите пожаловаться на анкету №${selector.id}?`)
    await context.send(`${confirm.text}`)
    if (!confirm.status) { return; }
	let ender2 = true
	let text_input = ``
	await Logger(`(private chat) ~ starting report writing on <blank> #${selector.id} by <user> №${context.senderId}`)
	while (ender2) {
		let censored = user_check.censored ? await Censored_Activation_Pro(text_input) : text_input
		const corrected: any = await context.question(`🧷 Введите причину жалобы от 10 до 200 символов:\n📝 Указана причина: ${censored}`,
			{	
				keyboard: Keyboard.builder()
				.textButton({ label: '!сохранить', payload: { command: 'student' }, color: 'secondary' })
				.textButton({ label: '!отмена', payload: { command: 'citizen' }, color: 'secondary' })
				.oneTime().inline(),
				answerTimeLimit
			}
		)
		if (corrected.isTimeout) { return await context.send(`⏰ Время ожидания ввода жалобы истекло!`) }
		if (corrected.text == '!сохранить') {
			if (text_input.length < 10) { await context.send(`⚠ Жалобу от 10 символов надо!`); continue }
			if (text_input.length > 200) { await context.send(`⚠ Жалобу до 200 символов надо!`); continue }
			const report_set = await prisma.report.create({ data: { id_blank: selector.id, id_account: user_check.id, text: text_input }})
			const report_set2 = await prisma.report.create({ data: { id_blank: selector.id, id_account: user_check.id, text: text_input }})
			const report_set3 = await prisma.report.create({ data: { id_blank: selector.id, id_account: user_check.id, text: text_input }})
			await Logger(`(private chat) ~ report send about <blank> #${selector.id} by <user> №${context.senderId}`)
			await Send_Message(user_check.idvk, `✅ Мы зарегистрировали вашу жалобу на анкету #${selector.id}, спасибо за донос!`)
			const user_warn = await prisma.account.findFirst({ where: { id: selector.id_account } })
			const counter_warn = await prisma.report.count({ where: { id_blank: selector.id, status: 'wait' } })
			if (!user_warn) { return }
			await Send_Message(user_warn.idvk, `✅ На вашу анкету #${selector.id} пожаловался модератор собственной персоной, похоронное сообщение на вашей цифровой могилке следующее: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.\n💡 Не беспокойтесь, если это ложное обвинение, то после третьей жалобы модератор разблокирует вас.`)
			await Send_Message(chat_id, `🧨 Анкету #${selector.id} вычислил модератор, и порвал ее в клочья со словами: [${report_set.text}]!\n⚠ Жалоб: ${counter_warn}/3.`)
			if (counter_warn >= 3) {
				await prisma.blank.update({ where: { id: selector.id }, data: { banned: true } })
				await Send_Message(user_warn.idvk, `🚫 На вашу анкету #${selector.id} наложено вето модератором-императором ${counter_warn}/3. Изымаем анкету из поиска до разбирательства модераторами.`)
				await Send_Message(chat_id, `⚠ Анкета №${selector.id} изъята из поиска из-за жалоб, модераторы, примите меры!`)
			}
			const blank_check = await prisma.vision.findFirst({ where: { id_account: user_check.id, id_blank: selector.id }})
			if (!blank_check) { const blank_skip = await prisma.vision.create({ data: { id_account: user_check.id, id_blank: selector.id } }) }
			blank_build.splice(target, 1)
			ender2 = false
		} else {
			if (corrected.text == '!отмена') {
				await context.send(`🔧 Вы отменили написание жалобы на анкету`)
				ender2 = false
			} else {
				text_input = await Blank_Cleaner(corrected.text)
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
		let censored = user_check.censored ? await Censored_Activation_Pro(text_input) : text_input
		const corrected: any = await context.question(`🧷 Введите промпт для поиска анкеты от 3 до 64 символов:\n📝 Текущий запрос: ${censored}`,
			{	
				keyboard: Keyboard.builder()
				.textButton({ label: '!сохранить', payload: { command: 'student' }, color: 'secondary' })
				.textButton({ label: '!отмена', payload: { command: 'citizen' }, color: 'secondary' })
				.oneTime().inline(),
				answerTimeLimit
			}
		)
		if (corrected.isTimeout) { await context.send(`⏰ Время ожидания ввода промпта для браузерного запроса по анкетам истекло!`); return data }
		if (corrected.text == '!сохранить') {
			if (text_input.length < 3) { await context.send(`⚠ Промпт от 3 символов надо!`); continue }
			if (text_input.length > 3000) { await context.send(`⚠ Промпт до 3000 символов надо!`); continue }
			ender2 = false
			data.status = true
			data.text = text_input.slice(0, 64)
		} else {
			if (corrected.text == '!отмена') {
				await context.send(`🔧 Вы отменили ввод промпта для браузера по анкетам`)
				ender2 = false
			} else {
				text_input = (await Blank_Cleaner(corrected.text)).slice(0, 64)
			}
		}
	}
	return data
}

export async function Blank_Cleaner(text: string) {
	try {
		return text.replace(/[^а-яА-Я0-9ёЁ \-+—–_•()/\\"'`«»{}[#№\]=:;.,!?...\n\r]/gi, '')
	} catch {
		return ' '
	}
}

export async function checkBlankHasTags(blankId: number): Promise<boolean> {
    const blank = await prisma.blank.findFirst({
        where: { id: blankId }
    });
    
    if (!blank) return false;
    if (!blank.tag) return false;
    
    try {
        const tags = JSON.parse(blank.tag);
        return tags.length >= 3;
    } catch {
        return false;
    }
}