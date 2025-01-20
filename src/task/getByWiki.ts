import { join } from '@std/path';
import { Vcalendar, VcalendarBuilder, dateToDateTime, timeout } from '../BaseUtil.ts';
import { getAllCharacters, getCharacterDetail } from '../WikiController.ts';
import { ReleaseJsonType } from '../type/ReleaseJsonType.ts';
import { UID_PREFIX } from '../Const.ts';


async function main() {
    const characters = await getAllCharacters();

    const builder = new VcalendarBuilder();
    const vcalendar: Vcalendar = builder
        .setVersion('2.0')
        .setProdId('-//SmallZombie//Genshin Birthday//ZH')
        .setName('原神角色生日')
        .setRefreshInterval('P1D')
        .setCalScale('GREGORIAN')
        .setTzid('Asia/Shanghai')
        .build();

    const jsonItems: ReleaseJsonType = [];
    for (let i = 0; i < characters.length; i++) {
        const item = characters[i];
        const { birthday, release } = await getCharacterDetail(item.content_id);
        // 20200928 是原神公测时间，没有发布时间的按公测时间算
        const releaseStr = release ? `${release.getFullYear()}${String(release.getMonth() + 1).padStart(2, '0')}${String(release.getDate()).padStart(2, '0')}` : '20200928';

        vcalendar.items.push({
            uid: UID_PREFIX + item.content_id.toString()!,
            dtstamp: dateToDateTime(new Date()),
            dtstart: releaseStr,
            rrule: `FREQ=YEARLY;BYMONTH=${String(birthday.getMonth() + 1).padStart(2, '0')};BYMONTHDAY=${String(birthday.getDate()).padStart(2, '0')}`,
            summary: `${item.title} 生日`,
        });
        jsonItems.push({
            wiki_id: item.content_id,
            name: item.title,
            birthday: {
                month: birthday.getMonth() + 1,
                day: birthday.getDate(),
            },
            release: release ? release.toISOString() : void 0,
        });

        console.log(`${i + 1}/${characters.length}`);
        await timeout(200);
    }

    const icsSavePath = join(Deno.cwd(), 'release.ics');
    Deno.writeTextFileSync(icsSavePath, vcalendar.toString());
    console.log(`[√] ICS Has Save To "${icsSavePath}"`);

    const jsonSavePath = join(Deno.cwd(), 'release.json');
    Deno.writeTextFileSync(jsonSavePath, JSON.stringify(jsonItems, null, 4));
    console.log(`[√] Json Has Save To "${jsonSavePath}"`);
}
main();
