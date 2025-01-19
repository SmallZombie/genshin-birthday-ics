export type ReleaseJsonType = {
    wiki_id: number;
    name: string;
    birthday: {
        month: number;
        day: number;
    };
    release?: {
        year: number;
        month: number;
        day: number;
    };
}[];
