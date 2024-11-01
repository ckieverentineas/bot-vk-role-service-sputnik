import { Account, BlackList } from "@prisma/client";
import prisma from "./prisma";
import { KeyboardBuilder } from "vk-io";
import { answerTimeLimit, timer_text, vk } from "..";
import { Confirm_User_Success, Logger, Parser_IDVK, Send_Message } from "./helper";

//контроллер управления локациями
async function BLackList_Get(cursor: number, account: Account) {
    const batchSize = 5;
    let counter = 0
    let limiter = 0
    let res: BlackList[] = []
    for (const location of await prisma.blackList.findMany({ where: { id_account: account.id } })) {
        if ((cursor <= counter && batchSize+cursor >= counter) && limiter < batchSize) {
            res.push(location)
            limiter++
        }
        counter++
    }
    
   return res
}
export async function BlackList_Printer(context: any) {
    const account = await prisma.account.findFirst({ where: { idvk: context.senderId } })
    if (!account) { return }
    
    let location_tr = false
    let cursor = 0
    while (!location_tr) {
        const keyboard = new KeyboardBuilder()
        let event_logger = ``
        for await (const location of await BLackList_Get(cursor, account)) {
            let [info]= await vk.api.users.get({user_id: location.idvk});
            keyboard.textButton({ label: `👀 ${location.id}-${info.first_name}`, payload: { command: 'location_select', cursor: cursor, id_location: location.id }, color: 'secondary' })
            .textButton({ label: `⛔`, payload: { command: 'location_delete', cursor: cursor, id_location: location.id }, color: 'secondary' }).row()
            event_logger += `💬 ${location.id} - ${info.first_name} ${info.last_name}\n📎 Ссылка: https://vk.com/id${location.idvk}\n`
        }
        if (cursor >= 5) { keyboard.textButton({ label: `←`, payload: { command: 'location_back', cursor: cursor }, color: 'secondary' }) }
        const location_counter = await prisma.blackList.count({ where: { id_account: account.id } })
        if (5+cursor < location_counter) { keyboard.textButton({ label: `→`, payload: { command: 'location_next', cursor: cursor }, color: 'secondary' }) }
        keyboard.textButton({ label: `➕`, payload: { command: 'location_create', cursor: cursor }, color: 'secondary' }).row()
        .textButton({ label: `🚫`, payload: { command: 'location_return', cursor: cursor }, color: 'secondary' }).oneTime()
        event_logger += `\n ${1+cursor} из ${location_counter}`
        const location_bt = await context.question(`🧷 Посмотрите на них:\n\n ${event_logger}`,
            {	
                keyboard: keyboard, answerTimeLimit
            }
        )
        if (location_bt.isTimeout) { return await context.send(`⏰ Время ожидания в панели управления черным списком истекло!`) }
        if (!location_bt.payload) {
            await context.send(`💡 Жмите только по кнопкам с иконками!`)
        } else {
            const config: any = {
                'location_select': Location_Select,
                'location_create': Location_Create,
                'location_next': Location_Next,
                'location_back': Location_Back,
                'location_return': Location_Return,
                'location_delete': Location_Delete
            }
            const ans = await config[location_bt.payload.command](context, location_bt.payload, account)
            cursor = ans?.cursor || ans?.cursor == 0 ? ans.cursor : cursor
            location_tr = ans.stop ? ans.stop : false
        }
    }
    
}

async function Location_Delete(context: any, data: any, account: Account) {
    const res = { cursor: data.cursor }
    const location_check = await prisma.blackList.findFirst({ where: { id: data.id_location } })
    if (!location_check) { return res }
    const confirm: { status: boolean, text: String } = await Confirm_User_Success(context, `убрать из черного списка пользователя https://vk.com/id${location_check.idvk} ?`)
    await context.send(`${confirm.text}`)
    if (!confirm.status) { return res }
    if (location_check) {
        const location_del = await prisma.blackList.delete({ where: { id: location_check.id } })
        if (location_del) {
            await Logger(`In database, deleted from blacklist user: ${location_del.id}-${location_del.idvk} by admin ${context.senderId}`)
            await context.send(`🔧 Вы удалили пользователя из черного списка: https://vk.com/id${location_del.idvk} !`)
        }
    }
    return res
}

async function Location_Return(context: any, data: any, account: Account) {
    const res = { cursor: data.cursor, stop: true }
    await context.send(`🔧 Вы отменили меню управления черным списком.`)
    return res
}

async function Location_Select(context: any, data: any, account: Account) {
    const res = { cursor: data.cursor }
    await context.send(`🔧 Пользователь BUID${data.id_location} в вашем черном списке и его анкеты больше не появятся у вас в процессе поиска сорола!`)
    return res
}

async function Location_Next(context: any, data: any, account: Account) {
    const res = { cursor: data.cursor+5 }
    return res
}

async function Location_Back(context: any, data: any, account: Account) {
    const res = { cursor: data.cursor-5 }
    return res
}

async function Location_Create(context: any, data: any, account: Account) {
    const res = { cursor: data.cursor }
    let spec_check = false
    let name_loc = null
	while (spec_check == false) {
		const name = await context.question( `🧷 Введите ссылку/упоминание на пользователя для добавления в черный список:`, timer_text)
		if (name.isTimeout) { return await context.send(`⏰ Время ожидания ввода ссылки профиля для добавления в ЧС истекло!`) }
		if (name.text.length <= 100) {
			
			name_loc = `${name.text}`
            console.log(name_loc)
            const target = await Parser_IDVK(name_loc)
            name_loc = target
            console.log(Number(target))
			if (!target) { await context.send(`⚠ Невалидная ссылка/упоминание на страницу пользователя!`); return res }
            const user: Account | null = await prisma.account.findFirst({ where: { idvk: Number(target) } })
            if (!user) { await context.send(`⚠ К сожалению, пользователь https://vk.com/id${target} еще не успел зарегистрироваться в Спутнике, приведите недруга к нам и сделайте это!`); continue }
            const black_list_ch = await prisma.blackList.findFirst({ where: { id_account: account.id, idvk: Number(target) } })
            if (black_list_ch) { await context.send(`⚠ К сожалению, пользователь https://vk.com/id${target} уже в вашем черном списке. Как бы ни хотелось, но дважды и более подряд в ЧС не добавишь!`); continue }
            spec_check = true
		} else { await context.send(`💡 Ввведите до 100 символов включительно!`) }
	}
    if (name_loc) {
        const loc_cr = await prisma.blackList.create({ data: { idvk: Number(name_loc), id_account: account.id } })
        if (loc_cr) {
            await Logger(`In database, added new person BL: ${loc_cr.id}-${loc_cr.idvk} by admin ${context.senderId}`)
            await context.send(`🔧 Вы добавили в черный список пользователя https://vk.com/id${loc_cr.idvk}`)
        }
    }
    return res
}