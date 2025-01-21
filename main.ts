import { join } from '@std/path';
import { Vcalendar, VcalendarBuilder, timeout } from './src/BaseUtil.ts';
import { getAllCharacters, getCharacterDetail } from './src/WikiController.ts';
import { ReleaseJsonType } from './src/type/ReleaseJsonType.ts';
import { UID_PREFIX } from './src/Const.ts';
import { existsSync } from '@std/fs/exists';


const icsPath = join(Deno.cwd(), 'release.ics');
function getICS(): Vcalendar {
    if (existsSync(icsPath)) {
        return Vcalendar.fromString(Deno.readTextFileSync(icsPath));
    } else {
        const builder = new VcalendarBuilder();
        const vcalendar: Vcalendar = builder
            .setVersion('2.0')
            .setProdId('-//SmallZombie//Genshin Birthday ICS//ZH')
            .setName('原神角色生日')
            .setRefreshInterval('P1D')
            .setCalScale('GREGORIAN')
            .setTzid('Asia/Shanghai')
            .setTzoffset('+0800')
            .build();
        return vcalendar;
    }
}

const jsonPath = join(Deno.cwd(), 'release.json');
function getJson(): ReleaseJsonType {
    if (existsSync(jsonPath)) {
        return JSON.parse(Deno.readTextFileSync(jsonPath)) as ReleaseJsonType;
    } else {
        return [];
    }
}

async function main() {
    const ics = getICS();
    const json = getJson();
    const characters = await getAllCharacters();

    let needSaveICS = false;
    let needSaveJSON = false;
    console.log('[!] Total Characters: ', characters.length);
    for (let i = 0; i < characters.length; i++) {
        const item = characters[i];
        const { birthday, release } = await getCharacterDetail(item.id);

        // 20200928 是原神公测时间，没有发布时间的按公测时间算
        const releaseStr = release ? `${release.getFullYear()}${String(release.getMonth() + 1).padStart(2, '0')}${String(release.getDate()).padStart(2, '0')}` : '20200928';
        const rrule = `FREQ=YEARLY;BYMONTH=${String(birthday.getMonth() + 1).padStart(2, '0')};BYMONTHDAY=${String(birthday.getDate()).padStart(2, '0')}`;

        let needSaveICSInThisCycle = false;
        let icsItem = ics.items.find(v => v.uid === UID_PREFIX + item.id);
        if (icsItem) {
            if (icsItem.dtstart !== releaseStr) {
                icsItem.dtstart = releaseStr;
                icsItem.rrule = rrule;
                needSaveICSInThisCycle = true;
            }
        } else {
            icsItem = {
                uid: UID_PREFIX + item.id.toString()!,
                dtstamp: ics.dateToDateTime(new Date()),
                dtstart: releaseStr,
                rrule,
                summary: `${item.name} 生日`,
            };
            ics.items.push(icsItem);
            needSaveICSInThisCycle = true;

        }
        if (needSaveICSInThisCycle) {
            console.log(`${i + 1}/${characters.length} Update "${item.name}"(${item.id}) in ICS`);

            icsItem.dtstamp = ics.dateToDateTime(new Date());
            needSaveICS = true;
        }

        let needSaveJSONInThisCycle = false;
        const jsonItem = json.find(v => v.id === item.id);
        if (jsonItem) {
            if (jsonItem.birthday.month !== birthday.getMonth() + 1) {
                jsonItem.birthday.month = birthday.getMonth() + 1;
                needSaveJSONInThisCycle = true;
            }
            if (jsonItem.birthday.day !== birthday.getDate()) {
                jsonItem.birthday.day = birthday.getDate();
                needSaveJSONInThisCycle = true;
            }
            if (release && jsonItem.release !== release.toISOString()) {
                jsonItem.release = release.toISOString();
                needSaveJSONInThisCycle = true;
            }
        } else {
            json.push({
                id: item.id,
                name: item.name,
                birthday: {
                    month: birthday.getMonth() + 1,
                    day: birthday.getDate(),
                },
                release: release ? release.toISOString() : void 0,
            });
            needSaveJSONInThisCycle = true;
        }
        if (needSaveJSONInThisCycle) {
            console.log(`${i + 1}/${characters.length} Update "${item.name}"(${item.id}) in JSON`);
            needSaveJSON = true;
        }

        await timeout(200);
    }

    if (needSaveICS) {
        const icsSavePath = join(Deno.cwd(), 'release.ics');
        Deno.writeTextFileSync(icsSavePath, ics.toString());
        console.log(`[√] ICS Has Save To "${icsSavePath}"`);
    }

    if (needSaveJSON) {
        const jsonSavePath = join(Deno.cwd(), 'release.json');
        Deno.writeTextFileSync(jsonSavePath, JSON.stringify(json, null, 4));
        console.log(`[√] JSON Has Save To "${jsonSavePath}"`);
    }

    if (!needSaveICS && !needSaveJSON) {
        console.log('[-] No need to save');
    }
}
main();
