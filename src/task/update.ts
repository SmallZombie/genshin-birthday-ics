import { existsSync } from '@std/fs';
import { join } from '@std/path';
import { Vcalendar } from '../BaseUtil.ts';
import { getAllCharacters, getCharacterDetail } from '../WikiController.ts';
import type { ReleaseJsonType } from '../type/ReleaseJsonType.ts';
import { UID_PREFIX } from '../Const.ts';


async function update() {
    const icsPath = join(Deno.cwd(), 'release.ics');
    const jsonPath = join(Deno.cwd(), 'release.json');

    if (!existsSync(icsPath)) {
        throw new Error('Cannot update because release.ics does not exist');
    }
    if (!existsSync(jsonPath)) {
        throw new Error('Cannot update because release.json does not exist');
    }

    const icsData = Deno.readTextFileSync(icsPath);
    const jsonData = Deno.readTextFileSync(jsonPath);

    const ics = Vcalendar.fromString(icsData);
    const json = JSON.parse(jsonData) as ReleaseJsonType;

    const result = await getAllCharacters();

    // 检查新增
    const newItems = result.filter(v => !ics.items.some(vv => vv.uid === UID_PREFIX + v.content_id.toString()));
    if (!newItems.length) {
        console.log('[-] No new characters');
        return;
    }

    for (const i of newItems) {
        const { birthday, release } = await getCharacterDetail(i.content_id);
        const releaseStr = release ? `${release.getFullYear()}${String(release.getMonth() + 1).padStart(2, '0')}${String(release.getDate()).padStart(2, '0')}` : '20200928';

        ics.items.push({
            uid: UID_PREFIX + i.content_id.toString()!,
            dtstamp: dateToDateTime(new Date()),
            dtstart: releaseStr,
            rrule: `FREQ=YEARLY;BYMONTH=${String(birthday.getMonth() + 1).padStart(2, '0')};BYMONTHDAY=${String(birthday.getDate()).padStart(2, '0')}`,
            summary: `${i.title} 生日`,
        });
        json.push({
            wiki_id: i.content_id,
            name: i.title,
            birthday: birthday.toISOString(),
            release: release ? release.toISOString() : void 0,
        });

        console.log(`[√] "${i.title}"(${i.content_id}) has been added`);
    }

    Deno.writeTextFileSync(icsPath, ics.toString());
    console.log(`[√] ICS Has Save To "${icsPath}"`);

    Deno.writeTextFileSync(jsonPath, JSON.stringify(json, null, 2));
    console.log(`[√] JSON Has Save To "${jsonPath}"`);
}
await update();
