import { Account } from "@prisma/client";
import { KeyboardBuilder } from "vk-io";

export async function Keyboard_Swap(length: number, account: Account) {
    const keyboard = new KeyboardBuilder()
    keyboard.textButton({ label: '⛔ Мимо', color: 'secondary' })
    .textButton({ label: '✅ Отклик', color: 'secondary' }).row()
    .textButton({ label: '🚫 Стоп', color: 'secondary' })
    if (account.donate) { keyboard.textButton({ label: '✏ Письмо', color: 'secondary' })}
    keyboard.row()
    keyboard.textButton({ label: `⌛ Ожидают [${length}]`, color: 'secondary' }).row()
    .textButton({ label: '⚠ Жалоба', color: 'secondary' }).row()
    .oneTime().inline()
    return keyboard
}
