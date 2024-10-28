const FS = require('fs');
const PATH = require('path');


const timeout = time => new Promise(resolve => setTimeout(resolve, time));


/**
 * 获取角色生日和角色上线时间
 * @param {Number} roleID
 * @returns {Promise<[Date, Date]>}
 */
async function getRoleBirthdayAndReleaseDate(roleID) {
    const res = await fetch('https://api-takumi-static.mihoyo.com/hoyowiki/genshin/wapi/entry_page?entry_page_id=' + roleID).then(res => res.json());
    // "11月11日"
    const birthdayText = JSON.parse(res.data.page.modules.find(v => v.name === '基础信息').components[0].data).attr.find(v => v.key === '生日').value[0];
    const [, birthdayMonth, birthdayDay] = birthdayText.match(/(\d+)月(\d+)日/);
    const birthday = new Date();
    birthday.setMonth(parseInt(birthdayMonth) - 1);
    birthday.setDate(parseInt(birthdayDay));


    const haveRelease = res.data.page.modules.find(v => v.name === '角色宣发时间轴');
    if (!haveRelease) return [birthday]; // 神里绫华(2123) & 埃洛伊(2415)

    const haveRelease2 = JSON.parse(haveRelease.components[0].data).list.find(v => v.tab_name.includes('角色登场'));
    if (!haveRelease2) return [birthday]; // 神里绫华(2123)

    // "「2024.07.15」角色登场"
    const releaseText = haveRelease2.tab_name.match(/「(.+)」/)[1];
    const release = new Date(releaseText);

    return [birthday, release];
}

async function main() {
    const rolesRes = await fetch('https://api-takumi-static.mihoyo.com/common/blackboard/ys_obc/v1/home/content/list?app_sn=ys_obc&channel_id=189').then(res => res.json());
    const roles = rolesRes.data.list.find(v => v.name === '图鉴').children.find(v => v.name === '角色').list;

    // to ICS
    // 详见 https://zh.wikipedia.org/wiki/ICalendar
    let result = 'BEGIN:VCALENDAR\n' +
        'VERSION:2.0\n' +
        'PRODID:-//SmallZombie//getFromWiki//ZH\n' +
        'NAME:原神角色生日\n' +
        // 'REFRESH-INTERVAL;VALUE=DURATION:P1W\n' + // 定时刷新，每周
        'REFRESH-INTERVAL;VALUE=DURATION:P1D\n' + // 定时刷新，每天
        'CALSCALE:GREGORIAN\n'
    ;
    let count = 0;
    for (const i of roles) {
        if (i.title.includes('预告')) continue;
        if (i.title.includes('旅行者')) continue;

        const [birthday, release] = await getRoleBirthdayAndReleaseDate(i.content_id);
        const releaseStr = release ? `${release.getFullYear()}${String(release.getMonth() + 1).padStart(2, '0')}${String(release.getDate()).padStart(2, '0')}` : '20200928';

        result += 'BEGIN:VEVENT\n' +
            `UID:${crypto.randomUUID()}\n` +
            `DTSTART;VALUE=DATE:${releaseStr}\n` +
            `RRULE:FREQ=YEARLY;BYMONTH=${String(birthday.getMonth() + 1).padStart(2, '0')};BYMONTHDAY=${String(birthday.getDate()).padStart(2, '0')}\n` +
            `SUMMARY:${i.title} 生日\n` +
            'END:VEVENT\n'
        ;

        console.log(`${++count}/${roles.length}`);
        // await timeout(200);
    }
    result += 'END:VCALENDAR\n';

    const savePath = PATH.join(__dirname, 'gcb.ics');
    FS.writeFileSync(savePath, result);
    console.log(`Save To "${savePath}"`);
}
main();
