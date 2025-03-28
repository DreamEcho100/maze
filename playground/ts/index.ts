// https://github.com/filippbudko/type-fest/tree/main

type GetRecordsOnly<T> = T extends Record<string, any> ? T : never;
type CompositeRecord<
  TRecords extends unknown[],
  OnlyRecords = GetRecordsOnly<TRecords[number]>,
> = {
  [Key in keyof GetRecordsOnly<TRecords[number]>]: GetRecordsOnly<
    TRecords[number]
  >[Key];
};
type Test =
  | { a: 1 }
  | never
  | { b: 2; a: 1.1 }
  | "lol"
  | { c: 3; b: 2.1; a: 1.2 };
const t = {} as CompositeRecord<Test[]>;
t.a;
t.b;

const b = {} as keyof GetRecordsOnly<Test>;
