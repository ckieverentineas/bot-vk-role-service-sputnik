import { Account } from "@prisma/client";
import { KeyboardBuilder } from "vk-io";
import { Accessed } from "./helper";

export async function Keyboard_Swap(length: number, account: Account) {
    const keyboard = new KeyboardBuilder()
    keyboard.textButton({ label: '⛔ Мимо', color: 'secondary' })
    .textButton({ label: '✅ Отклик', color: 'secondary' }).row()
    .textButton({ label: '🚫 Стоп', color: 'secondary' })
    if (account.donate) { keyboard.textButton({ label: '✏ Письмо', color: 'secondary' })}
    keyboard.row()
    keyboard.textButton({ label: `⌛ Ожидают [${length}]`, color: 'secondary' }).row()
    if (account.id_role != 1) {
        keyboard.textButton({ label: '🔪 Резать мразей как шаверму', color: 'secondary' }).row()
    } else {
        keyboard.textButton({ label: '⚠ Жалоба', color: 'secondary' }).row()
    }
    keyboard.oneTime().inline()
    return keyboard
}
