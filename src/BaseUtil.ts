class Vcalendar {
    version: string;
    prodId: string;
    name: string;
    refreshInterval: string;
    calScale: string;
    // Asia/Shanghai
    tzid: string;
    items: Vevent[];

    constructor(version: string, prodId: string, name: string, refreshInterval: string, calScale: string, tzid: string, items: Vevent[]) {
        this.version = version;
        this.prodId = prodId;
        this.name = name;
        this.refreshInterval = refreshInterval;
        this.calScale = calScale;
        this.tzid = tzid;
        this.items = items;
    }


    /**
     * 请不要将此函数当作通用函数，此函数可能仅适用于本项目
     * 详见 https://zh.wikipedia.org/wiki/ICalendar
     */
    toString(): string {
        let result = 'BEGIN:VCALENDAR\n' +
            `VERSION:${this.version}\n` +
            `PRODID:${this.prodId}\n` +
            `NAME:${this.name}\n` +
            // 'REFRESH-INTERVAL;VALUE=DURATION:P1W\n' + // 定时刷新，每周
            `REFRESH-INTERVAL;VALUE=DURATION:${this.refreshInterval}\n` + // 定时刷新，每天
            `CALSCALE:${this.calScale}\n` +
            `TZID:${this.tzid}\n`
        ;
        for (const i of this.items) {
            result += 'BEGIN:VEVENT\n' +
                `UID:${i.uid}\n` +
                `DTSTART;VALUE=DATE:${i.dtstart}\n` +
                `RRULE:${i.rrule}\n` +
                `SUMMARY:${i.summary}\n` +
                'END:VEVENT\n'
            ;
        }
        result += 'END:VCALENDAR\n';
        return result;
    }


    /**
     * 请不要将此函数当作通用函数，此函数可能仅适用于本项目
     */
    static fromString(data: string): Vcalendar {
        const builder = new VcalendarBuilder();
        const items: Vevent[] = [];
        let inEvent = false;

        for (const i of data.split('\n')) {
            if (inEvent) {
                const item = items.at(-1)!;
                if (i.startsWith('UID:')) {
                    item.uid = i.slice('UID:'.length);
                } else if (i.startsWith('DTSTART;VALUE=DATE:')) {
                    item.dtstart = i.slice('DTSTART;VALUE=DATE:'.length);
                } else if (i.startsWith('RRULE:')) {
                    item.rrule = i.slice('RRULE:'.length);
                } else if (i.startsWith('SUMMARY:')) {
                    item.summary = i.slice('SUMMARY:'.length);
                } else if (i === 'END:VEVENT') {
                    inEvent = false;
                }
            } else {
                if (i.startsWith('VERSION:')) {
                    builder.setVersion(i.slice('VERSION:'.length));
                } else if (i.startsWith('PRODID:')) {
                    builder.setProdId(i.slice('PRODID:'.length));
                } else if (i.startsWith('NAME:')) {
                    builder.setName(i.slice('NAME:'.length));
                } else if (i.startsWith('REFRESH-INTERVAL;VALUE=DURATION:')) {
                    builder.setRefreshInterval(i.slice('REFRESH-INTERVAL;VALUE=DURATION:'.length));
                } else if (i.startsWith('CALSCALE:')) {
                    builder.setCalScale(i.slice('CALSCALE:'.length));
                } else if (i.startsWith('TZID:')) {
                    builder.setTzid(i.slice('TZID:'.length));
                } else if (i === 'BEGIN:VEVENT') {
                    inEvent = true;
                    items.push({});
                }
            }
        }

        builder.setItems(items);
        return builder.build();
    }
}

class VcalendarBuilder {
    version?: string;
    prodId?: string;
    name?: string;
    refreshInterval?: string;
    calScale?: string;
    tzid?: string;
    items: Vevent[] = [];


    setVersion(version: string) {
        this.version = version;
        return this;
    }
    setProdId(prodId: string) {
        this.prodId = prodId;
        return this;
    }
    setName(name: string) {
        this.name = name;
        return this;
    }
    setRefreshInterval(refreshInterval: string) {
        this.refreshInterval = refreshInterval;
        return this;
    }
    setCalScale(calScale: string) {
        this.calScale = calScale;
        return this;
    }
    setTzid(tzid: string) {
        this.tzid = tzid;
        return this;
    }
    setItems(items: Vevent[]) {
        this.items = items;
        return this;
    }
    build() {
        if (!this.version) throw new Error('version is required');
        if (!this.prodId) throw new Error('prodId is required');
        if (!this.name) throw new Error('name is required');
        if (!this.refreshInterval) throw new Error('refreshInterval is required');
        if (!this.calScale) throw new Error('calScale is required');
        if (!this.tzid) throw new Error('tzid is required');
        if (!this.items) throw new Error('items is required');

        return new Vcalendar(this.version, this.prodId, this.name, this.refreshInterval, this.calScale, this.tzid, this.items);
    }
}

type Vevent = {
    uid?: string;
    dtstart?: string;
    rrule?: string;
    summary?: string;
}

const timeout = (time: number) => new Promise(resolve => setTimeout(resolve, time));


export type {
    Vevent
}
export {
    Vcalendar,
    VcalendarBuilder,
    timeout
}
