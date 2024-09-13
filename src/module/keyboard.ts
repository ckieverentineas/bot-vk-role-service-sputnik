import { Account } from "@prisma/client";
import { KeyboardBuilder } from "vk-io";

export async function Keyboard_Swap(length: number, account: Account) {
    const keyboard = new KeyboardBuilder()
    keyboard.textButton({ label: '⛔ Налево', color: 'secondary' })
    .textButton({ label: '✅ Направо', color: 'secondary' }).row()
    .textButton({ label: '🚫 Назад', color: 'secondary' })
    if (account.donate) { keyboard.textButton({ label: '✏ Направо', color: 'secondary' })}
    keyboard.row()
    keyboard.textButton({ label: `⌛ В очереди [${length}]`, color: 'secondary' }).row()
    .textButton({ label: '⚠ Жалоба', color: 'secondary' }).row()
    .oneTime().inline()
    return keyboard
}
