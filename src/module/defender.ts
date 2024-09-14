import got = require("got")

export async function Data_Registration_Page_Detector(context: any) {
    try {
        const data = (await got.get(`https://vk.com/foaf.php?id=${context.senderId}`)).body;
        const arr: any = data.toString().split('<')
        for (const i in arr) {
            if (arr[i].includes(`ya:created dc:date=`)) {
                const date_read = arr[i].match(/"([^']+)"/)[1];
                const date: any = new Date(date_read)
                const date_now = Date.now()
                if (date_now-date < 604800000) {
                    await context.send(`⁉ Вашей странице меньше недели. Вы не можете зарегистрироваться в Спутнике сейчас. Приходите через 7 дней от даты регистрации своего аккаунта!`)
                    return false
                }
            }
        }
    } catch (error: any) {
        console.error(error.response.statusCode);
    }
    return true
}
